import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";
import { useAuth } from '../../../context/AuthContext';

const PermitDetails = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [permitData, setPermitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
        setPermitData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch permit details');
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

  const handleApprove = async () => {
    try {
      await AxiosInstance.post(`/permits/permits/${permitId}/approve/`);
      const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
      setPermitData(response.data);
      showToast('Permit approved successfully!', 'success');
    } catch (err) {
      showToast('Failed to approve permit', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await AxiosInstance.post(`/permits/permits/${permitId}/reject/`, {
        rejection_reason: rejectionReason
      });
      const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
      setPermitData(response.data);
      showToast('Permit rejected successfully!', 'success');
    } catch (err) {
      showToast('Failed to reject permit', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (permitData.status !== 'APPROVED') {
        showToast(`PDF can only be generated for approved permits. Current status: ${permitData.status}`, 'error');
        return;
      }

      const response = await AxiosInstance.get(`/permits/permits/${permitId}/pdf/`, {
        responseType: 'blob'
      });
      
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const fileURL = window.URL.createObjectURL(file);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `permit_${permitData.ref_no}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(fileURL);
      showToast('Permit PDF downloaded!', 'success');
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            showToast('Please log in to download the permit.', 'error');
            break;
          case 403:
            showToast(`PDF can only be generated for approved permits. Current status: ${permitData.status}`, 'error');
            break;
          case 404:
            showToast('Permit not found.', 'error');
            break;
          default:
            showToast('An error occurred while downloading the permit.', 'error');
        }
      } else {
        showToast('An error occurred while downloading the permit.', 'error');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!permitData) {
    return <div className="text-center p-4">Permit not found</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <PermitInformation permit={permitData} />;
      case 'history':
        return <ApprovalHistory permitId={permitId} />;
      case 'communication':
        return <CommunicationHistory permitId={permitId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/permits')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Permit Details</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2 w-full sm:w-auto">
          {permitData.status === 'PENDING' && !user?.signature_image && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-sm">
              You must upload your signature in your profile before you can approve or reject permits.
            </div>
          )}
          {permitData.status === 'PENDING' && (
            <>
              <button 
                onClick={() => setActionModal({ show: true, action: 'approve' })}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                disabled={!user?.signature_image}
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Approve
              </button>
              <button 
                onClick={() => setActionModal({ show: true, action: 'reject' })}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                disabled={!user?.signature_image}
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Reject
              </button>
            </>
          )}
          {permitData.status === 'APPROVED' && (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {downloading ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-gray-700 rounded-full"></span>
                Downloading...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download Permit
              </>
            )}
          </button>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              {actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">{actionModal.action}</span> this permit? This action cannot be undone.
            </p>
            {actionModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows="3"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-red-600 focus:border-red-600 text-sm resize-none"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={actionLoading ? undefined : () => {
                  setActionModal({ show: false, action: null });
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    if (actionModal.action === 'approve') {
                      await handleApprove();
                    } else {
                      await handleReject();
                    }
                    setActionModal({ show: false, action: null });
                    setRejectionReason('');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading || (actionModal.action === 'reject' && !rejectionReason.trim())}
                className={`px-4 py-2 text-white rounded ${actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
              >
                {actionLoading ? (
                  <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>{actionModal.action === 'approve' ? 'Approving...' : 'Rejecting...'}</span>
                ) : (
                  actionModal.action === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <ClockIcon className="h-5 w-5 inline-block mr-2" />
            History
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`${
              activeTab === 'communication'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 inline-block mr-2" />
            Communication
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Sub-components
const PermitInformation = ({ permit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Reference Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{permit.ref_no || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(permit.status)}`}>
                  {permit.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Application Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(permit.application_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Delivery Period</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {permit.delivery_start && permit.delivery_end ? (
                  `${new Date(permit.delivery_start).toLocaleDateString()} - ${new Date(permit.delivery_end).toLocaleDateString()}`
                ) : (
                  "N/A"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {permit.rejection_reason || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Society</dt>
              <dd className="mt-1 text-sm text-gray-900">{permit.society.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Factory</dt>
              <dd className="mt-1 text-sm text-gray-900">{permit.factory.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Warehouse</dt>
              <dd className="mt-1 text-sm text-gray-900">{permit.warehouse.name}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Coffee Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight per Bag (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permit.coffee_quantities.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coffee_grade.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bags_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coffee_grade.weight_per_bag}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_weight}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.total_bags}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.total_weight}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ApprovalHistory = ({ permitId }) => {
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
        setPermit(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching permit details:', error);
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const timelineEvents = [
    {
      id: 1,
      date: permit.application_date,
      status: 'SUBMITTED',
      description: 'Permit application submitted',
      details: `Reference: ${permit.ref_no}`
    },
    ...(permit.approved_at ? [{
      id: 2,
      date: permit.approved_at,
      status: 'APPROVED',
      description: 'Permit approved',
      details: `Approved by: ${permit.approved_by.full_name}`
    }] : []),
    ...(permit.rejection_reason ? [{
      id: 3,
      date: permit.rejected_at,
      status: 'REJECTED',
      description: 'Permit rejected',
      details: `Reason: ${permit.rejection_reason}`
    }] : [])
  ];

  return (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Approval History</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, index) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {index !== timelineEvents.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      event.status === 'APPROVED' ? 'bg-green-500' : 
                      event.status === 'REJECTED' ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`}>
                      {event.status === 'APPROVED' ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : event.status === 'REJECTED' ? (
                        <XCircleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-white" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{event.description}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{event.details}</p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.date}>
                        {new Date(event.date).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
  </div>
);
};

const CommunicationHistory = ({ permitId }) => {
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
        setPermit(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching permit details:', error);
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);
  }

  return (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Communication History</h3>
      
      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {/* Farmer Information */}
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Manager Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {permit.farmer.full_name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{permit.farmer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{permit.farmer.phone_no}</p>
            </div>
          </div>
        </div>

        {/* Society Information */}
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Society Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{permit.society.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {permit.society.sub_county}, {permit.society.county}
              </p>
            </div>
          </div>
        </div>

        {/* Factory Information */}
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Factory Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{permit.factory.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {permit.factory.sub_county}, {permit.factory.county}
              </p>
            </div>
          </div>
        </div>

        {/* Warehouse Information */}
        <div className="p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Warehouse Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{permit.warehouse.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {permit.warehouse.sub_county}, {permit.warehouse.county}
              </p>
            </div>
          </div>
        </div>
      </div>
  </div>
);
};

export default PermitDetails;
