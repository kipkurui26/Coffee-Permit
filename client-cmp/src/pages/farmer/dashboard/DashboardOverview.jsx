import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import AxiosInstance from '../../../utils/AxiosInstance';
import PermitList from "./PermitList";

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalPermits: 0,
    activePermits: 0,
    pendingPermits: 0,
    expiredPermits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await AxiosInstance.get('/permits/permits/society_metrics/');
        setStats({
          totalPermits: response.data.total_permits,
          activePermits: response.data.active_permits,
          pendingPermits: response.data.pending_permits,
          expiredPermits: response.data.expired_permits,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case "permit_created":
          return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
        case "permit_approved":
          return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case "permit_expired":
          return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
        default:
          return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500">
            {new Date(activity.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your permits.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Permits"
          value={stats.totalPermits}
          icon={DocumentTextIcon}
          color="text-blue-600"
          loading={isLoading}
        />
        <StatCard
          title="Active Permits"
          value={stats.activePermits}
          icon={CheckCircleIcon}
          color="text-green-600"
          loading={isLoading}
        />
        <StatCard
          title="Pending Permits"
          value={stats.pendingPermits}
          icon={ClockIcon}
          color="text-yellow-600"
          loading={isLoading}
        />
        <StatCard
          title="Expired Permits"
          value={stats.expiredPermits}
          icon={ExclamationCircleIcon}
          color="text-red-600"
          loading={isLoading}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* You can add recent activity items here if needed */}
          <p className="text-sm text-gray-500">No recent activity to show.</p>
        </div>
      </div>

      <PermitList/>
    </div>
  );
};

export default DashboardOverview;
