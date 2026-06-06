import os
import base64
from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.response import Response
from django.utils import timezone
from .models import PermitApplication, CoffeeGrade, CoffeeQuantity, PermitQRCode, QRCodeVerification
from .serializers import (
    PermitApplicationSerializer,
    PermitApplicationCreateSerializer,
    PermitApplicationUpdateSerializer,
    CoffeeGradeSerializer,
    CoffeeQuantitySerializer,
    PermitQRCodeSerializer,
)
from django.db.models import Q, F, Sum, FloatField, Count
from django_filters.rest_framework import DjangoFilterBackend
from .filters import PermitApplicationFilter
from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from django.conf import settings
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from django.core.exceptions import ObjectDoesNotExist
import logging
from .throttling import (
    SocietyManagerRateThrottle,
    StaffRateThrottle,
    FarmerRateThrottle,
    AnonRateThrottle,
)
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncQuarter
import datetime
from datetime import timedelta
import pandas as pd
from rest_framework.pagination import PageNumberPagination
from users.utils import notify_user

logger = logging.getLogger(__name__)


def get_timezone_aware_date_range(start_date, end_date):

    from datetime import datetime
    
    if start_date:
        # Start of day in server timezone
        start_datetime = timezone.make_aware(
            datetime.strptime(start_date, '%Y-%m-%d')
        )
    else:
        start_datetime = None
        
    if end_date:
        # End of day in server timezone (23:59:59)
        end_datetime = timezone.make_aware(
            datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        )
    else:
        end_datetime = None
        
    return start_datetime, end_datetime


def convert_frontend_date_to_server_date(date_str):

    from datetime import datetime
    
    if not date_str:
        return None
        
    # Parse the date string
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    
    # Convert to server timezone (same as Django's timezone handling)
    server_tz = timezone.get_current_timezone()
    return timezone.make_aware(date_obj, server_tz)


class IsSocietyManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.managed_society is not None


class CoffeeGradeViewSet(viewsets.ModelViewSet):
    queryset = CoffeeGrade.objects.all()
    serializer_class = CoffeeGradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [StaffRateThrottle]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 1000


class PermitApplicationViewSet(viewsets.ModelViewSet):
    queryset = PermitApplication.objects.all().order_by("-application_date")
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PermitApplicationFilter
    pagination_class = StandardResultsSetPagination

    def get_throttles(self):
        if self.request.user.is_staff:
            return [StaffRateThrottle()]
        elif self.request.user.managed_society is not None:
            return [SocietyManagerRateThrottle()]
        else:
            return [FarmerRateThrottle()]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSocietyManager()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return PermitApplicationCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return PermitApplicationUpdateSerializer
        return PermitApplicationSerializer

    def create(self, request, *args, **kwargs):
        try:
            print("Data received in PermitApplicationViewSet create:", request.data)
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            logger.error(f"Validation error in permit creation: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error in permit creation: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Update status for each permit in the queryset
        for permit in queryset:
            permit.update_status()

        # Filter based on user role
        if user.is_staff:
            return queryset  # Staff sees all permits
        elif user.managed_society is not None:
            return queryset.filter(
                society__manager=user
            )  # Manager sees only their society's permits
        else:
            return queryset.filter(
                farmer=user
            )  # Regular farmers see only their permits

    def get_analytics_queryset(self):
        """Get unfiltered queryset for analytics (bypasses role-based filtering)"""
        queryset = super().get_queryset()
        
        # Update status for each permit in the queryset
        for permit in queryset:
            permit.update_status()
            
        return queryset

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if not request.user.signature_image:
            return Response(
                {"error": "You must upload your signature before approving a permit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        permit = self.get_object()

        if permit.status != "PENDING":
            return Response(
                {"error": "Only pending permits can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permit.status = "APPROVED"
        permit.approved_by = request.user
        permit.approved_at = timezone.now()
        permit.save()

        # Notify the permit owner (society manager)
        notify_user(
            permit.society.manager,
            type="PERMIT_APPROVED",
            message=f"Your permit application (Ref: {permit.ref_no}) has been approved.",
            link=f"/permits/{permit.id}",
        )
        # Notify the farmer if different from manager
        if permit.farmer and permit.farmer != permit.society.manager:
            notify_user(
                permit.farmer,
                type="PERMIT_APPROVED",
                message=f"Your permit application (Ref: {permit.ref_no}) has been approved.",
                link=f"/permits/{permit.id}",
            )

        serializer = self.get_serializer(permit)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if not request.user.signature_image:
            return Response(
                {"error": "You must upload your signature before rejecting a permit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        permit = self.get_object()

        if permit.status != "PENDING":
            return Response(
                {"error": "Only pending permits can be rejected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get("rejection_reason")
        if not rejection_reason:
            return Response(
                {"error": "Rejection reason is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permit.status = "REJECTED"
        permit.rejection_reason = rejection_reason
        permit.rejected_by = request.user
        permit.rejected_at = timezone.now()
        permit.save()

        # Notify the permit owner (society manager)
        notify_user(
            permit.society.manager,
            type="PERMIT_REJECTED",
            message=f"Your permit application (Ref: {permit.ref_no}) has been rejected. Reason: {rejection_reason}",
            link=f"/permits/{permit.id}",
        )
        # Notify the farmer if different from manager
        if permit.farmer and permit.farmer != permit.society.manager:
            notify_user(
                permit.farmer,
                type="PERMIT_REJECTED",
                message=f"Your permit application (Ref: {permit.ref_no}) has been rejected. Reason: {rejection_reason}",
                link=f"/permits/{permit.id}",
            )

        serializer = self.get_serializer(permit)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        permit = self.get_object()

        if permit.status not in ["PENDING", "APPROVED"]:
            return Response(
                {"error": "Only pending or approved permits can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permit.status = "CANCELLED"
        permit.save()

        # Notify the permit owner (society manager)
        notify_user(
            permit.society.manager,
            type="PERMIT_CANCELLED",
            message=f"Your permit application (Ref: {permit.ref_no}) has been cancelled.",
            link=f"/permits/{permit.id}",
        )
        # Notify the farmer if different from manager
        if permit.farmer and permit.farmer != permit.society.manager:
            notify_user(
                permit.farmer,
                type="PERMIT_CANCELLED",
                message=f"Your permit application (Ref: {permit.ref_no}) has been cancelled.",
                link=f"/permits/{permit.id}",
            )

        serializer = self.get_serializer(permit)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def my_permits(self, request):
        queryset = PermitApplication.objects.all()
        if request.user.managed_society is not None:
            queryset = queryset.filter(society__manager=request.user)
        else:
            queryset = queryset.filter(farmer=request.user)

        # Apply filters
        status = request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        start_date = request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(application_date__gte=start_date)
        end_date = request.query_params.get("end_date")
        if end_date:
            queryset = queryset.filter(application_date__lte=end_date)
        society = request.query_params.get("society")
        if society:
            queryset = queryset.filter(society_id=society)
        factory = request.query_params.get("factory")
        if factory:
            queryset = queryset.filter(factory_id=factory)
        warehouse = request.query_params.get("warehouse")
        if warehouse:
            queryset = queryset.filter(warehouse_id=warehouse)
        min_quantity = request.query_params.get("min_quantity")
        if min_quantity:
            queryset = queryset.filter(total_weight__gte=min_quantity)
        max_quantity = request.query_params.get("max_quantity")
        if max_quantity:
            queryset = queryset.filter(total_weight__lte=max_quantity)

        queryset = queryset.order_by("-application_date")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending_permits(self, request):
        queryset = self.get_queryset()

        # Filter for pending permits
        pending_permits = queryset.filter(status="PENDING")

        # Apply role-based filtering
        if not request.user.is_staff:
            if request.user.managed_society is not None:
                # For society managers, show only their society's pending permits
                pending_permits = pending_permits.filter(society__manager=request.user)
            else:
                # For regular farmers, show only their pending permits
                pending_permits = pending_permits.filter(farmer=request.user)

        serializer = self.get_serializer(pending_permits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def society_metrics(self, request):
        if not request.user.managed_society is not None:
            return Response(
                {"error": "Only society managers can access these metrics"},
                status=status.HTTP_403_FORBIDDEN,
            )

        society_permits = PermitApplication.objects.filter(
            society__manager=request.user
        )
        total_permits = society_permits.count()
        active_permits = society_permits.filter(status="APPROVED").count()
        pending_permits = society_permits.filter(status="PENDING").count()
        expired_permits = society_permits.filter(status="EXPIRED").count()

        return Response(
            {
                "total_permits": total_permits,
                "active_permits": active_permits,
                "pending_permits": pending_permits,
                "expired_permits": expired_permits,
            }
        )

    @action(detail=False, methods=["get"])
    def staff_metrics(self, request):

        if not request.user.is_staff:
            return Response(
                {"error": "Only staff members can access these metrics"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all permits
        all_permits = self.get_queryset()

        # Basic counts
        total_permits = all_permits.count()
        active_permits = all_permits.filter(status="APPROVED").count()
        pending_permits = all_permits.filter(status="PENDING").count()
        expired_permits = all_permits.filter(status="EXPIRED").count()
        rejected_permits = all_permits.filter(status="REJECTED").count()

        return Response(
            {
                "total_permits": total_permits,
                "active_permits": active_permits,
                "pending_permits": pending_permits,
                "expired_permits": expired_permits,
                "rejected_permits": rejected_permits,
            }
        )

    @action(detail=False, methods=["post"])
    def bulk_approve(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Only staff members can approve permits"},
                status=status.HTTP_403_FORBIDDEN,
            )
        permit_ids = request.data.get("permit_ids", [])
        if not permit_ids:
            return Response(
                {"error": "No permit IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        permits = PermitApplication.objects.filter(id__in=permit_ids, status="PENDING")
        if not permits.exists():
            return Response(
                {"error": "No valid pending permits found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current_time = timezone.now()
        for permit in permits:
            permit.status = "APPROVED"
            permit.approved_by = request.user
            permit.approved_at = current_time
            permit.save()
        serializer = self.get_serializer(permits, many=True)
        return Response(
            {
                "message": f"Successfully approved {permits.count()} permits",
                "permits": serializer.data,
            }
        )

    @action(detail=True, methods=["post"])
    def regenerate_qr_code(self, request, pk=None):
        """Regenerate QR code for a permit"""
        permit = self.get_object()
        
        if permit.status != "APPROVED":
            return Response(
                {"error": "Only approved permits can have QR codes"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        qr_code = permit.generate_qr_code()
        serializer = PermitQRCodeSerializer(qr_code)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_reject(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Only staff members can reject permits"},
                status=status.HTTP_403_FORBIDDEN,
            )
        permit_ids = request.data.get("permit_ids", [])
        rejection_reason = request.data.get("rejection_reason")
        if not permit_ids:
            return Response(
                {"error": "No permit IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not rejection_reason:
            return Response(
                {"error": "Rejection reason is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        permits = PermitApplication.objects.filter(id__in=permit_ids, status="PENDING")
        if not permits.exists():
            return Response(
                {"error": "No valid pending permits found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current_time = timezone.now()
        for permit in permits:
            permit.status = "REJECTED"
            permit.rejection_reason = rejection_reason
            permit.rejected_by = request.user
            permit.rejected_at = current_time
            permit.save()
        serializer = self.get_serializer(permits, many=True)
        return Response(
            {
                "message": f"Successfully rejected {permits.count()} permits",
                "permits": serializer.data,
            }
        )

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        """
        Returns permit counts grouped by period (day/week/month) and status.
        Query params:
            - start_date: YYYY-MM-DD
            - end_date: YYYY-MM-DD
            - granularity: daily|weekly|monthly (default: daily)
            - status, society, factory, warehouse, etc. (optional filters)
        """
        # Get filters from query params
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        granularity = request.query_params.get("granularity", "daily")

        # Debug logging
        logger.info(f"analytics - start_date: {start_date}, end_date: {end_date}, granularity: {granularity}")

        # Base queryset with filters
        queryset = self.filter_queryset(self.get_analytics_queryset())
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
        
        if start_date:
            queryset = queryset.filter(application_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(application_date__lte=end_date)

        # Choose truncation function based on granularity
        if granularity == "weekly":
            trunc_func = TruncWeek("application_date")
        elif granularity == "monthly":
            trunc_func = TruncMonth("application_date")
        else:
            trunc_func = TruncDay("application_date")

        # Group by period and status, count
        grouped = (
            queryset.annotate(period=trunc_func)
            .values("period", "status")
            .order_by("period")
            .annotate(count=Count("id"))
        )

        # Pivot to {period: {status1: count, status2: count, ...}}
        result = {}
        for row in grouped:
            period = (
                row["period"].strftime("%Y-%m-%d")
                if granularity == "daily"
                else row["period"].strftime("%Y-%m")
            )
            if granularity == "weekly":
                period = f"{row['period'].isocalendar()[0]}-W{row['period'].isocalendar()[1]:02d}"
            if period not in result:
                result[period] = {}
            result[period][row["status"]] = row["count"]

        # Ensure all statuses are present for each period (fill missing with 0)
        all_statuses = [choice[0] for choice in self.queryset.model.STATUS_CHOICES]
        chart_data = []
        for period in sorted(result.keys()):
            entry = {"period": period}
            for status in all_statuses:
                entry[status] = result[period].get(status, 0)
            chart_data.append(entry)

        # Log result count
        logger.info(f"analytics - Found {len(chart_data)} data points")
        
        page = self.paginate_queryset(chart_data)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(chart_data)

    @action(
        detail=False,
        methods=["get"],
        url_path="coffee-analytics",
        throttle_classes=[AnonRateThrottle, StaffRateThrottle],
    )
    def coffee_analytics(self, request):
        """
        Returns total coffee moved grouped by period (day/week/month) and grade.
        Query params:
            - start_date: YYYY-MM-DD
            - end_date: YYYY-MM-DD
            - granularity: daily|weekly|monthly (default: daily)
            - society, factory, warehouse, etc. (optional filters)
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        granularity = request.query_params.get("granularity", "daily")

        # Debug logging
        logger.info(f"coffee_analytics - start_date: {start_date}, end_date: {end_date}, granularity: {granularity}")
        logger.info(f"Current date: {timezone.now().date()}, Current time: {timezone.now()}")

        # Filter permits by date and other filters
        permits = self.filter_queryset(self.get_analytics_queryset())
        
        # Convert frontend dates to server timezone (consistent with other operations)
        server_start_date = convert_frontend_date_to_server_date(start_date)
        server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        logger.info(f"Server current date: {current_date}, User end_date: {end_date}")
        
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
            server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Use timezone-aware date filtering (consistent with coffee grade operations)
        start_datetime, end_datetime = get_timezone_aware_date_range(start_date, end_date)
        
        if start_datetime:
            permits = permits.filter(application_date__gte=start_datetime)
        if end_datetime:
            permits = permits.filter(application_date__lte=end_datetime)

        # Choose truncation function based on granularity
        if granularity == "weekly":
            trunc_func = TruncWeek("application__application_date")
        elif granularity == "monthly":
            trunc_func = TruncMonth("application__application_date")
        elif granularity == "90days":
            trunc_func = TruncQuarter("application__application_date")
        else:
            trunc_func = TruncDay("application__application_date")

        # Join with CoffeeQuantity and CoffeeGrade
        from .models import CoffeeQuantity, CoffeeGrade

        coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)

        # Annotate period and grade, sum total_weight
        grouped = (
            coffee_quantities.annotate(period=trunc_func)
            .values("period", "coffee_grade__grade")
            .annotate(
                total_weight=Sum(
                    F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                    output_field=FloatField(),
                )
            )
            .order_by("period")
        )

        # Pivot to {period: {grade1: total, grade2: total, ...}}
        result = {}
        for row in grouped:
            if granularity == "daily":
                period = row["period"].strftime("%Y-%m-%d")
            elif granularity == "weekly":
                period = f"{row['period'].isocalendar()[0]}-W{row['period'].isocalendar()[1]:02d}"
            elif granularity == "monthly":
                period = row["period"].strftime("%Y-%m")
            elif granularity == "90days":
                period = f"{row['period'].year}-Q{((row['period'].month - 1) // 3) + 1}"
            else:
                period = str(row["period"])
            if period not in result:
                result[period] = {}
            result[period][row["coffee_grade__grade"]] = row["total_weight"]

        # Get all grades
        all_grades = list(CoffeeGrade.objects.values_list("grade", flat=True))
        chart_data = []

        # --- NEW: Ensure all periods (weeks/quarters) in range are present ---
        if granularity == "weekly":
            curr = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            first_week_start = curr - timedelta(
                days=curr.weekday()
            )  # Monday as start of week
            last_week_start = end - timedelta(days=end.weekday())
            all_weeks = set()
            curr = first_week_start
            while curr <= last_week_start:
                year, week, _ = curr.isocalendar()
                week_key = f"{year}-W{week:02d}"
                all_weeks.add(week_key)
                curr += timedelta(days=7)
            for week in all_weeks:
                if week not in result:
                    result[week] = {}
            sorted_periods = sorted(all_weeks)
        elif granularity == "90days":
            curr = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            # Find the first quarter start
            first_quarter = pd.Timestamp(
                year=curr.year, month=3 * ((curr.month - 1) // 3) + 1, day=1
            )
            last_quarter = pd.Timestamp(
                year=end.year, month=3 * ((end.month - 1) // 3) + 1, day=1
            )
            all_quarters = set()
            curr = first_quarter
            while curr <= last_quarter:
                quarter_key = f"{curr.year}-Q{((curr.month-1)//3)+1}"
                all_quarters.add(quarter_key)
                # Move to next quarter
                if curr.month >= 10:
                    curr = pd.Timestamp(year=curr.year + 1, month=1, day=1)
                else:
                    curr = pd.Timestamp(year=curr.year, month=curr.month + 3, day=1)
            for quarter in all_quarters:
                if quarter not in result:
                    result[quarter] = {}
            sorted_periods = sorted(all_quarters)
        else:
            sorted_periods = sorted(result.keys())

        for period in sorted_periods:
            entry = {"period": period}
            for grade in all_grades:
                entry[grade] = result[period].get(grade, 0)
            chart_data.append(entry)
        # --- END NEW ---

        # Log result count
        logger.info(f"coffee_analytics - Found {len(chart_data)} data points")
        
        page = self.paginate_queryset(chart_data)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(chart_data)

    @action(
        detail=False,
        methods=["get"],
        url_path="top-societies",
        throttle_classes=[AnonRateThrottle, StaffRateThrottle],
    )
    def top_societies(self, request):
        """
        Returns top societies by total coffee moved (with filters).
        Query params: start_date, end_date, factory, warehouse, etc.
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        # Debug logging
        logger.info(f"top_societies - start_date: {start_date}, end_date: {end_date}")

        permits = self.filter_queryset(self.get_analytics_queryset())
        permits = permits.filter(status="APPROVED")  # Only approved permits
        
        # Convert frontend dates to server timezone (consistent with other operations)
        server_start_date = convert_frontend_date_to_server_date(start_date)
        server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
            server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Use timezone-aware date filtering (consistent with coffee grade operations)
        start_datetime, end_datetime = get_timezone_aware_date_range(start_date, end_date)
        
        if start_datetime:
            permits = permits.filter(application_date__gte=start_datetime)
        if end_datetime:
            permits = permits.filter(application_date__lte=end_datetime)

        from .models import CoffeeQuantity

        # Join CoffeeQuantity and group by society
        coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
        grouped = (
            coffee_quantities.values(
                "application__society__id", "application__society__name"
            )
            .annotate(
                total_kg=Sum(
                    F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                    output_field=FloatField(),
                )
            )
            .order_by("-total_kg")
        )

        # Return top 3 (or all if you want)
        result = [
            {
                "society_id": row["application__society__id"],
                "society": row["application__society__name"],
                "totalKg": row["total_kg"] or 0,
            }
            for row in grouped
        ]
        
        # Log result count
        logger.info(f"top_societies - Found {len(result)} societies")
        
        page = self.paginate_queryset(result)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(result)

    @action(
        detail=False,
        methods=["get"],
        url_path="top-grades",
        throttle_classes=[AnonRateThrottle, StaffRateThrottle],
    )
    def top_grades(self, request):
        """
        Returns top coffee grades by total coffee moved (with filters).
        Query params: start_date, end_date, society, factory, warehouse, exclude_grades, etc.
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        exclude_grades = request.query_params.get("exclude_grades")
        exclude_grades = exclude_grades.split(",") if exclude_grades else []

        # Debug logging
        logger.info(f"top_grades - start_date: {start_date}, end_date: {end_date}")

        permits = self.filter_queryset(self.get_analytics_queryset())
        permits = permits.filter(status="APPROVED")  # Only approved permits
        
        # Convert frontend dates to server timezone (consistent with other operations)
        server_start_date = convert_frontend_date_to_server_date(start_date)
        server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
            server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Use timezone-aware date filtering (consistent with coffee grade operations)
        start_datetime, end_datetime = get_timezone_aware_date_range(start_date, end_date)
        
        if start_datetime:
            permits = permits.filter(application_date__gte=start_datetime)
        if end_datetime:
            permits = permits.filter(application_date__lte=end_datetime)

        from .models import CoffeeQuantity

        coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
        if exclude_grades:
            coffee_quantities = coffee_quantities.exclude(
                coffee_grade__grade__in=exclude_grades
            )
        grouped = (
            coffee_quantities.values("coffee_grade__grade")
            .annotate(
                total_kg=Sum(
                    F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                    output_field=FloatField(),
                )
            )
            .order_by("-total_kg")
        )

        result = [
            {
                "grade": row["coffee_grade__grade"],
                "totalKg": row["total_kg"] or 0,
            }
            for row in grouped
        ]
        
        # Log result count
        logger.info(f"top_grades - Found {len(result)} grades")
        
        page = self.paginate_queryset(result)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(result)

    @action(detail=False, methods=["get"], url_path="permits-cumulative-status")
    def permits_cumulative_status(self, request):
        """
        Returns cumulative count of approved and rejected permits by day.
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        # Debug logging
        logger.info(f"permits_cumulative_status - start_date: {start_date}, end_date: {end_date}")

        qs = self.get_analytics_queryset().filter(status__in=["APPROVED", "REJECTED"])
        
        # Convert frontend dates to server timezone (consistent with other operations)
        server_start_date = convert_frontend_date_to_server_date(start_date)
        server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
            server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Use timezone-aware date filtering (consistent with coffee grade operations)
        start_datetime, end_datetime = get_timezone_aware_date_range(start_date, end_date)
        
        if start_datetime:
            qs = qs.filter(approved_at__gte=start_datetime)
        if end_datetime:
            qs = qs.filter(approved_at__lte=end_datetime)

        # Get all relevant dates using timezone-aware filtering
        all_dates = set()
        for status in ["APPROVED", "REJECTED"]:
            date_field = "approved_at" if status == "APPROVED" else "rejected_at"
            status_qs = self.get_analytics_queryset().filter(status=status)
            if start_datetime:
                status_qs = status_qs.filter(**{f"{date_field}__gte": start_datetime})
            if end_datetime:
                status_qs = status_qs.filter(**{f"{date_field}__lte": end_datetime})
            all_dates.update(
                status_qs.annotate(day=TruncDay(date_field)).values_list(
                    "day", flat=True
                )
            )
        all_dates = sorted([d for d in all_dates if d is not None])

        # Build cumulative counts
        cumulative_approved = 0
        cumulative_rejected = 0
        result = []
        for day in all_dates:
            # Use timezone-aware filtering for consistent date handling
            day_start = timezone.make_aware(day.replace(hour=0, minute=0, second=0, microsecond=0))
            day_end = timezone.make_aware(day.replace(hour=23, minute=59, second=59, microsecond=999999))
            
            approved_count = (
                self.get_analytics_queryset()
                .filter(status="APPROVED", approved_at__gte=day_start, approved_at__lte=day_end)
                .count()
            )
            rejected_count = (
                self.get_analytics_queryset()
                .filter(status="REJECTED", rejected_at__gte=day_start, rejected_at__lte=day_end)
                .count()
            )
            cumulative_approved += approved_count
            cumulative_rejected += rejected_count
            result.append(
                {
                    "date": day.strftime("%Y-%m-%d"),
                    "cumulative_approved": cumulative_approved,
                    "cumulative_rejected": cumulative_rejected,
                }
            )

        # Log result count
        logger.info(f"permits_cumulative_status - Found {len(result)} data points")
        
        return Response(result)

    @action(
        detail=False,
        methods=["get"],
        url_path="top-factories",
        throttle_classes=[AnonRateThrottle, StaffRateThrottle],
    )
    def top_factories(self, request):
        """
        Returns top factories by total coffee moved (with filters).
        Query params: start_date, end_date, society, warehouse, exclude_grades, etc.
        """
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        society = request.query_params.get("society")
        warehouse = request.query_params.get("warehouse")
        exclude_grades = request.query_params.get("exclude_grades")
        exclude_grades = exclude_grades.split(",") if exclude_grades else []

        # Debug logging
        logger.info(f"top_factories - start_date: {start_date}, end_date: {end_date}")

        permits = self.filter_queryset(self.get_analytics_queryset())
        
        # Convert frontend dates to server timezone (consistent with other operations)
        server_start_date = convert_frontend_date_to_server_date(start_date)
        server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Auto-extend end_date to include today if it doesn't
        current_date = timezone.now().date()
        if end_date and end_date < current_date.isoformat():
            logger.info(f"Auto-extending end_date from {end_date} to {current_date.isoformat()}")
            end_date = current_date.isoformat()
            server_end_date = convert_frontend_date_to_server_date(end_date)
        
        # Use timezone-aware date filtering (consistent with coffee grade operations)
        start_datetime, end_datetime = get_timezone_aware_date_range(start_date, end_date)
        
        if start_datetime:
            permits = permits.filter(application_date__gte=start_datetime)
        if end_datetime:
            permits = permits.filter(application_date__lte=end_datetime)
        if society:
            permits = permits.filter(society_id=society)
        if warehouse:
            permits = permits.filter(warehouse_id=warehouse)

        from .models import CoffeeQuantity

        # Join CoffeeQuantity and group by factory
        coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
        if exclude_grades:
            coffee_quantities = coffee_quantities.exclude(
                coffee_grade__grade__in=exclude_grades
            )
        grouped = (
            coffee_quantities.values(
                "application__factory__id", "application__factory__name"
            )
            .annotate(
                total_kg=Sum(
                    F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                    output_field=FloatField(),
                )
            )
            .order_by("-total_kg")
        )

        # Return top 3 (or all if you want)
        result = [
            {
                "factory_id": row["application__factory__id"],
                "factory": row["application__factory__name"],
                "totalKg": row["total_kg"] or 0,
            }
            for row in grouped
        ]
        
        # Log result count
        logger.info(f"top_factories - Found {len(result)} factories")
        
        page = self.paginate_queryset(result)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(result)


class CoffeeQuantityViewSet(viewsets.ModelViewSet):
    queryset = CoffeeQuantity.objects.all()
    serializer_class = CoffeeQuantitySerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [FarmerRateThrottle]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return CoffeeQuantity.objects.all()
        return CoffeeQuantity.objects.filter(application__farmer=user)


def _build_permit_context_and_qr(permit):
    """Prepare permit context and QR image for rendering (shared helper)."""
    # Determine the coffee year
    current_date = timezone.now().date()
    current_year = current_date.year
    if current_date.month < 10:
        coffee_year = f"{current_year - 1}/{str(current_year)[-2:]}"
    else:
        coffee_year = f"{current_year}/{str(current_year + 1)[-2:]}"

    # Base permit data
    permit_data = {
        "ref_no": permit.ref_no,
        "status": permit.status,
        "approved_at": permit.approved_at,
        "delivery_start": permit.delivery_start,
        "delivery_end": permit.delivery_end,
        "approved_by": permit.approved_by,
        "total_weight": permit.total_weight,
        "total_bags": permit.total_bags,
        "application_date": permit.application_date,
        "farmer": permit.farmer,
        "rejection_reason": permit.rejection_reason,
        "society": {
            "name": permit.society.name,
            "county": permit.society.county,
        },
        "factory": {
            "name": permit.factory.name,
        },
        "warehouse": {
            "name": permit.warehouse.name,
            "county": permit.warehouse.county,
        },
    }

    # Signature image (base64) if available
    import base64 as _b64
    signature_base64 = None
    if permit.approved_by and getattr(permit.approved_by, "signature_image", None):
        try:
            signature_image = permit.approved_by.signature_image
            file_extension = signature_image.name.split(".")[-1].lower()
            mime_type = (
                f"image/{file_extension}"
                if file_extension in ["jpeg", "jpg", "png", "gif"]
                else "image/jpeg"
            )
            with signature_image.open("rb") as image_file:
                encoded_string = _b64.b64encode(image_file.read()).decode("utf-8")
                signature_base64 = f"data:{mime_type};base64,{encoded_string}"
        except Exception:
            signature_base64 = None
    permit_data["approved_by_signature_base64"] = signature_base64 or ""

    # Coffee quantities mapped to all grades
    all_grades = list(CoffeeGrade.objects.all())
    grade_to_quantity = {q.coffee_grade.id: q for q in permit.coffee_quantities.all()}
    coffee_quantities_full = []
    for grade in all_grades:
        q = grade_to_quantity.get(grade.id)
        bags_quantity = q.bags_quantity if q else None
        total_weight = None
        if bags_quantity:
            total_weight = float(bags_quantity) * float(grade.weight_per_bag)
        coffee_quantities_full.append(
            {
                "coffee_grade": {
                    "grade": grade.grade,
                    "weight_per_bag": grade.weight_per_bag,
                },
                "bags_quantity": bags_quantity,
                "total_weight": total_weight,
            }
        )
    permit_data["coffee_quantities_full"] = coffee_quantities_full

    # Ensure QR exists and build QR image base64
    qr_code = permit.active_qr_code
    if not qr_code:
        qr_code = permit.generate_qr_code()
    from .services import QRCodeService
    qr_image_bytes = QRCodeService.generate_qr_code_for_permit(permit)
    qr_code_base64 = _b64.b64encode(qr_image_bytes).decode("utf-8")

    return permit_data, coffee_year, qr_code_base64


def _render_pdf_response_from_permit(permit):
    """Render a PDF HttpResponse for the given permit."""
    from weasyprint import HTML
    from django.template.loader import render_to_string
    from django.http import HttpResponse

    permit_data, coffee_year, qr_code_base64 = _build_permit_context_and_qr(permit)
    html_string = render_to_string(
        "permits/permit_pdf.html",
        {
            "permit": permit_data,
            "coffee_year": coffee_year,
            "qr_code_base64": qr_code_base64,
        },
    )
    html = HTML(string=html_string)
    pdf = html.write_pdf()
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="permit_{permit.ref_no}.pdf"'
    )
    return response


def _render_view_html_from_permit(permit):
    """Render an HTML string for view-only permit page."""
    from django.template.loader import render_to_string

    permit_data, _coffee_year, qr_code_base64 = _build_permit_context_and_qr(permit)
    html_string = render_to_string(
        "permits/permit_view.html",
        {
            "permit": permit_data,
            "qr_code_base64": qr_code_base64,
            "view_only": True,
            "remaining_days": permit.get_remaining_download_days(),
        },
    )
    return html_string


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def generate_permit_pdf(request, permit_id):
    try:
        permit = get_object_or_404(
            PermitApplication.objects.select_related(
                "society", "factory", "warehouse", "approved_by"
            ).prefetch_related("coffee_quantities__coffee_grade"),
            id=permit_id,
        )
        
        permit.update_status()
        
        # Check if user can download (authenticated users)
        if not permit.is_downloadable:
            return Response(
                {
                    "error": "Download period has expired. This permit can only be viewed.",
                    "remaining_days": permit.get_remaining_download_days(),
                    "validity_status": permit.validity_status
                },
                status=410
            )
        
        # Check if permit is approved
        if permit.status != "APPROVED":
            raise PermissionDenied(
                detail=f"PDF can only be generated for approved permits. Current status: {permit.status}"
            )
        return _render_pdf_response_from_permit(permit)
    except Exception as e:
        logger.error(f"Error generating permit PDF: {str(e)}")
        return HttpResponse("Error generating PDF", status=500)


def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def is_rate_limited(client_ip):
    """Simple rate limiting check"""
    # This is a basic implementation - you might want to use Django's cache framework
    # or a more sophisticated rate limiting library
    return False

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_permit_qr(request, token):
    """Public endpoint to verify permit via QR code with access control"""
    
    # Rate limiting
    client_ip = get_client_ip(request)
    if is_rate_limited(client_ip):
        return HttpResponse("Too many requests", status=429)
    
    try:
        from .models import PermitQRCode, QRCodeVerification
        
        # Accept valid tokens as long as permit hasn't expired; still require is_active
        qr_code = PermitQRCode.objects.get(
            token=token,
            is_active=True,
        )
        
        # Check verification limits
        if qr_code.verification_count >= qr_code.max_verifications:
            return HttpResponse("QR code usage limit exceeded", status=410)
        
        permit = qr_code.permit
        permit.update_status()
        
        # Check permit validity (only approved and not expired)
        if not permit.is_viewable:
            return HttpResponse(
                "This permit is no longer valid for viewing.",
                status=410,
                content_type="text/plain"
            )
        
        # Determine access level
        effective_access = qr_code.get_effective_access_level()
        
        # Log verification attempt
        QRCodeVerification.objects.create(
            qr_code=qr_code,
            ip_address=client_ip,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            access_level=effective_access
        )
        
        # Increment verification count
        qr_code.increment_verification()
        
        # Return appropriate response based on access level
        if effective_access == 'DOWNLOAD':
            # Serve PDF directly without requiring authentication
            return _render_pdf_response_from_permit(permit)
        elif effective_access == 'VIEW_ONLY':
            # Serve HTML view directly
            html_string = _render_view_html_from_permit(permit)
            return HttpResponse(html_string, content_type="text/html")
        else:
            return HttpResponse(
                "Access denied.",
                status=403,
                content_type="text/plain"
            )
        
    except PermitQRCode.DoesNotExist:
        return HttpResponse(
            "Invalid or expired QR code.",
            status=404,
            content_type="text/plain"
        )
    except Exception as e:
        logger.error(f"Error verifying permit QR: {str(e)}")
        return HttpResponse(
            "Error verifying permit.",
            status=500,
            content_type="text/plain"
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def generate_permit_view(request, permit_id):
    """Generate view-only version of permit (no download)"""
    try:
        permit = get_object_or_404(
            PermitApplication.objects.select_related(
                "society", "factory", "warehouse", "approved_by"
            ).prefetch_related("coffee_quantities__coffee_grade"),
            id=permit_id,
        )
        
        permit.update_status()
        
        if not permit.is_viewable:
            return HttpResponse(
                "This permit is no longer valid for viewing.",
                status=410,
                content_type="text/plain"
            )
        html_string = _render_view_html_from_permit(permit)
        return HttpResponse(html_string, content_type="text/html")
        
    except Exception as e:
        logger.error(f"Error generating permit view: {str(e)}")
        return HttpResponse("Error generating view", status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AnonRateThrottle, StaffRateThrottle])
def analytics_report_pdf(request):
    try:
        user = request.user
        data = request.data
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        granularity = data.get("granularity", "monthly")
        include_total = data.get("include_total", True)
        include_top_factories = data.get("include_top_factories", True)
        include_top_societies = data.get("include_top_societies", True)
        include_top_grades = data.get("include_top_grades", True)
        society_id = data.get("society_id")
        exclude_grades = data.get("exclude_grades")
        if exclude_grades:
            if isinstance(exclude_grades, str):
                exclude_grades = [
                    g.strip() for g in exclude_grades.split(",") if g.strip()
                ]
            elif not isinstance(exclude_grades, list):
                exclude_grades = []
        else:
            exclude_grades = []
        # Role-based access control
        if user.is_staff:
            permitted_society_id = society_id
        elif hasattr(user, "managed_society") and user.managed_society is not None:
            if society_id is not None and int(society_id) != int(
                user.managed_society.id
            ):
                raise PermissionDenied(
                    "You are not authorized to access this society's data."
                )
            permitted_society_id = user.managed_society.id
        else:
            farmer_permits = PermitApplication.objects.filter(farmer=user)
            farmer_society_ids = set(
                farmer_permits.values_list("society_id", flat=True)
            )
            if society_id is not None and int(society_id) not in farmer_society_ids:
                raise PermissionDenied(
                    "You are not authorized to access this society's data."
                )
            permitted_society_id = (
                list(farmer_society_ids) if society_id is None else [int(society_id)]
            )
        permits = PermitApplication.objects.all()
        if start_date:
            permits = permits.filter(application_date__date__gte=start_date)
        if end_date:
            permits = permits.filter(application_date__date__lte=end_date)
        if user.is_staff:
            if permitted_society_id:
                permits = permits.filter(society_id=permitted_society_id)
        elif hasattr(user, "managed_society") and user.managed_society is not None:
            permits = permits.filter(society_id=permitted_society_id)
        else:
            permits = permits.filter(society_id__in=permitted_society_id, farmer=user)
        # --- Total Coffee Moved (by period and grade) ---
        total_coffee = []
        all_grades = list(CoffeeGrade.objects.values_list("grade", flat=True))
        if include_total:
            from .models import CoffeeQuantity

            # Choose truncation function based on granularity
            if granularity == "weekly":
                trunc_func = TruncWeek("application__application_date")
            elif granularity == "monthly":
                trunc_func = TruncMonth("application__application_date")
            elif granularity == "90days":
                trunc_func = TruncQuarter("application__application_date")
            else:
                trunc_func = TruncDay("application__application_date")

            coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
            if exclude_grades:
                coffee_quantities = coffee_quantities.exclude(
                    coffee_grade__grade__in=exclude_grades
                )
            grouped = (
                coffee_quantities.annotate(period=trunc_func)
                .values("period", "coffee_grade__grade")
                .annotate(
                    total_weight=Sum(
                        F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                        output_field=FloatField(),
                    )
                )
                .order_by("period")
            )
            # Pivot to {period: {grade1: total, grade2: total, ...}}
            result = {}
            for row in grouped:
                if granularity == "daily":
                    period = row["period"].strftime("%Y-%m-%d")
                elif granularity == "weekly":
                    period = f"{row['period'].isocalendar()[0]}-W{row['period'].isocalendar()[1]:02d}"
                elif granularity == "monthly":
                    period = row["period"].strftime("%Y-%m")
                elif granularity == "90days":
                    period = (
                        f"{row['period'].year}-Q{((row['period'].month - 1) // 3) + 1}"
                    )
                else:
                    period = str(row["period"])
                if period not in result:
                    result[period] = {}
                result[period][row["coffee_grade__grade"]] = row["total_weight"]
            # Format for template
            for period in sorted(result.keys()):
                entry = {"period": period}
                for grade in all_grades:
                    entry[grade] = result[period].get(grade, 0)
                total_coffee.append(entry)

        # --- Top Factories ---
        top_factories = []
        if include_top_factories:
            from .models import CoffeeQuantity

            coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
            grouped = (
                coffee_quantities.values(
                    "application__factory__id", "application__factory__name"
                )
                .annotate(
                    total_kg=Sum(
                        F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                        output_field=FloatField(),
                    )
                )
                .order_by("-total_kg")
            )
            top_factories = [
                {
                    "factory_id": row["application__factory__id"],
                    "factory": row["application__factory__name"],
                    "totalKg": row["total_kg"] or 0,
                }
                for row in grouped
            ]

        # --- Top Societies ---
        top_societies = []
        if include_top_societies:
            from .models import CoffeeQuantity

            coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
            grouped = (
                coffee_quantities.values(
                    "application__society__id", "application__society__name"
                )
                .annotate(
                    total_kg=Sum(
                        F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                        output_field=FloatField(),
                    )
                )
                .order_by("-total_kg")
            )
            top_societies = [
                {
                    "society_id": row["application__society__id"],
                    "society": row["application__society__name"],
                    "totalKg": row["total_kg"] or 0,
                }
                for row in grouped
            ]

        # --- Top Grades (for society) ---
        top_grades = []
        if include_top_grades:
            from .models import CoffeeQuantity

            coffee_quantities = CoffeeQuantity.objects.filter(application__in=permits)
            grouped = (
                coffee_quantities.values("coffee_grade__grade")
                .annotate(
                    total_kg=Sum(
                        F("bags_quantity") * F("coffee_grade__weight_per_bag"),
                        output_field=FloatField(),
                    )
                )
                .order_by("-total_kg")
            )
            top_grades = [
                {
                    "grade": row["coffee_grade__grade"],
                    "totalKg": row["total_kg"] or 0,
                }
                for row in grouped
            ]

        # Get society name if relevant
        society_name = None
        if society_id:
            from societies.models import Society

            society = Society.objects.filter(id=society_id).first()
            if society:
                society_name = society.name

        # Render HTML template
        html_string = render_to_string(
            "permits/analytics_report_pdf.html",
            {
                "generation_date": datetime.datetime.now(),
                "start_date": start_date,
                "end_date": end_date,
                "granularity": granularity,
                "society_name": society_name,
                "top_factories": top_factories,
                "top_societies": top_societies,
                "top_grades": top_grades,
                "total_coffee": total_coffee,
                "all_grades": all_grades,
            },
        )
        html = HTML(string=html_string)
        pdf = html.write_pdf()
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="analytics_report.pdf"'
        return response
    except Exception as e:
        logger.error(f"Error generating analytics report PDF: {str(e)}")
        return HttpResponse("Error generating analytics report PDF", status=500)
