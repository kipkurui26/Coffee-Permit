import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
} from '@heroicons/react/24/outline';
import PermitApprovalQueue from './PermitApprovalQueue';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";

const DashboardOverview = () => {
  const [metrics, setMetrics] = useState({
    totalPermits: 0,
    pendingApprovals: 0,
    approvedPermits: 0,
    rejectedPermits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await AxiosInstance.get('/permits/permits/staff_metrics/');
        setMetrics({
          totalPermits: response.data.total_permits || 0,
          pendingApprovals: response.data.pending_permits || 0,
          approvedPermits: response.data.active_permits || 0,
          rejectedPermits: response.data.rejected_permits || 0
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard metrics');
        setLoading(false);
        showToast('Failed to fetch dashboard metrics', 'error');
        console.error('Error fetching metrics:', err);
      }
    };

    fetchMetrics();
  }, [showToast]);

  const MetricCard = ({ title, value, icon: Icon, color, loading }) => (
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

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
      <p className="text-gray-600 text-sm md:text-base max-w-2xl">Welcome to your staff dashboard. Monitor permit metrics and manage pending approvals efficiently.</p>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Permits" 
          value={metrics.totalPermits} 
          icon={DocumentTextIcon} 
          color="text-blue-500"
          loading={loading}
        />
        <MetricCard 
          title="Pending Approvals" 
          value={metrics.pendingApprovals} 
          icon={ClockIcon} 
          color="text-yellow-500"
          loading={loading}
        />
        <MetricCard 
          title="Approved Permits" 
          value={metrics.approvedPermits} 
          icon={CheckCircleIcon} 
          color="text-green-500"
          loading={loading}
        />
        <MetricCard 
          title="Rejected Permits" 
          value={metrics.rejectedPermits} 
          icon={XCircleIcon} 
          color="text-red-500"
          loading={loading}
        />
      </div>

      {/* Permit Approval Queue */}
      <PermitApprovalQueue />
    </div>
  );
};

export default DashboardOverview;

