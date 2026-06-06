import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const statusColors = {
  true: 'bg-green-100 text-green-800',
  false: 'bg-yellow-100 text-yellow-800',
};

const getSocietyStatus = (society) => {
  if (society.canceled) return { label: "Canceled", color: "bg-gray-200 text-gray-700" };
  if (society.is_approved) return { label: "Approved", color: "bg-green-100 text-green-800" };
  if (society.rejection_reason) return { label: "Rejected", color: "bg-red-100 text-red-800" };
  return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
};

const SocietyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const [actionModal, setActionModal] = useState({ show: false, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSociety();
    // eslint-disable-next-line
  }, [id]);

  const fetchSociety = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get(`/societies/admin/societies/${id}/`);
      setSociety(response.data);
    } catch (err) {
      setError('Failed to fetch society details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await AxiosInstance.post(`/societies/admin/societies/${id}/approve/`);
      showToast('Society approved successfully', "success");
      fetchSociety();
    } catch (err) {
      showToast('Failed to approve society', "error");
    }
  };

  const handleReject = async () => {
    try {
      await AxiosInstance.post(`/societies/admin/societies/${id}/reject/`, { rejection_reason: rejectionReason });
      showToast('Society rejected successfully', "success");
      fetchSociety();
    } catch (err) {
      showToast('Failed to reject society', "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !society) {
    return (
      <div className="text-red-500 text-center p-4">
        {error || 'Society not found.'}
      </div>
    );
  }

  const status = getSocietyStatus(society);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8 mt-8 space-y-8 px-2 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-amber-700 hover:text-amber-900"
            title="Back"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{society.name}</h1>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
            {status.label}
          </span>
        </div>
        {!society.is_approved && !society.rejection_reason && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActionModal({ show: true, action: 'approve' })}
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 w-full sm:w-auto"
            >
              Approve
            </button>
            <button
              onClick={() => setActionModal({ show: true, action: 'reject' })}
              className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 w-full sm:w-auto"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Society Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-amber-800">Society Info</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-gray-600">Name</dt>
              <dd className="text-gray-900">{society.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">County</dt>
              <dd className="text-gray-900">{society.county}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Sub-County</dt>
              <dd className="text-gray-900">{society.sub_county}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Date Registered</dt>
              <dd className="text-gray-900">{society.date_registered ? new Date(society.date_registered).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Rejection Reason</dt>
              <dd className="text-gray-900">{society.rejection_reason || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Date Rejected</dt>
              <dd className="text-gray-900">{society.date_rejected ? new Date(society.date_rejected).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Rejected By</dt>
              <dd className="text-gray-900">{society.rejected_by_name || '-'}</dd>
            </div>
          </dl>
        </div>
        {/* Manager Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-amber-800">Manager Info</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-gray-600">Name</dt>
              <dd className="text-gray-900">{society.manager_name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Email</dt>
              <dd className="text-gray-900">{society.manager_email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Phone</dt>
              <dd className="text-gray-900">{society.manager_phone}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Unified Approve/Reject Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              {actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">{actionModal.action}</span> this society? This action cannot be undone.
            </p>
            {actionModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Optional)
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
                className={`px-4 py-2 text-white rounded ${actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                disabled={actionLoading}
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
    </div>
  );
};

export default SocietyDetail;