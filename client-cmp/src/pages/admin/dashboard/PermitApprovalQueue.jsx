import React, { useState, useEffect } from 'react';
import AxiosInstance from '../../../utils/AxiosInstance';
import { Link } from 'react-router-dom';
import { useToast } from "../../../context/ToastContext";
import Pagination from '../../../components/Pagination';
import { useAuth } from '../../../context/AuthContext';

const PermitApprovalQueue = () => {
  const [selectedPermits, setSelectedPermits] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [permitsPerPage] = useState(8);
  const [totalPermits, setTotalPermits] = useState(0);
  const [pendingPermits, setPendingPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [bulkActionModal, setBulkActionModal] = useState({
    show: false,
    action: null, // "approve" or "reject"
  });
  
  const { user } = useAuth();
  const { showToast } = useToast();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // --- Selection Logic ---
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allPermitIds = pendingPermits.map(permit => permit.id);
      setSelectedPermits(allPermitIds);
    } else {
      setSelectedPermits([]);
    }
  };

  const handleSelectPermit = (event, permitId) => {
    if (event.target.checked) {
      setSelectedPermits([...selectedPermits, permitId]);
    } else {
      setSelectedPermits(selectedPermits.filter(id => id !== permitId));
    }
  };

  const handleBulkAction = async () => {
    setActionLoading(true);
    const { action } = bulkActionModal;

    try {
      if (action === "approve") {
        const response = await AxiosInstance.post("/permits/permits/bulk_approve/", {
          permit_ids: selectedPermits
        });
        showToast(response.data.message || "Permits approved successfully.", "success");
      } else if (action === "reject") {
        if (!rejectionReason.trim()) {
          showToast('Please provide a rejection reason', "error");
          setActionLoading(false);
          return;
        }
        const response = await AxiosInstance.post("/permits/permits/bulk_reject/", {
          permit_ids: selectedPermits,
          rejection_reason: rejectionReason
        });
        showToast(response.data.message || "Permits rejected successfully.", "success");
      }
      
      await fetchPendingPermits();
      setSelectedPermits([]);
      
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} permits`, "error");
    } finally {
      setActionLoading(false);
      setBulkActionModal({ show: false, action: null });
      setRejectionReason('');
    }
  };

  const openBulkActionModal = (action) => {
    if (selectedPermits.length === 0) {
      showToast(`Please select permits to ${action}`, "error");
      return;
    }
    setBulkActionModal({ show: true, action });
  };

  const fetchPendingPermits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get("/permits/permits/pending_permits/", {
        params: {
          page: currentPage,
          page_size: permitsPerPage
        }
      });

      if (response.data.results) {
        setPendingPermits(response.data.results);
        setTotalPermits(response.data.count);
      } else {
        const startIndex = (currentPage - 1) * permitsPerPage;
        const endIndex = startIndex + permitsPerPage;
        const paginatedData = response.data.slice(startIndex, endIndex);

        setPendingPermits(paginatedData);
        setTotalPermits(response.data.length);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending permits:", err);
      setError("Failed to fetch pending permits");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPermits();
  }, [currentPage]);

  // Calculate total pages for Pagination component
  const totalPages = Math.ceil(totalPermits / permitsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }


  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <h1 className="text-2xl font-semibold text-gray-900">Permit Approval Queue</h1>
      <p className="text-gray-600 text-sm md:text-base max-w-2xl">Review, approve, or reject pending permit applications below. Use the bulk actions to efficiently process multiple requests at once.</p>
      {!user?.signature_image && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          You must upload your signature in your profile before you can approve or reject permits.
        </div>
      )}
      {/* Permits List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg font-medium text-gray-900">Pending Permits ({totalPermits})</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => openBulkActionModal('approve')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                disabled={selectedPermits.length === 0 || actionLoading || !user?.signature_image}
              >
                {actionLoading && bulkActionModal.action === "approve" ? 'Processing...' : `Bulk Approve (${selectedPermits.length})`}
              </button>
              <button
                onClick={() => openBulkActionModal('reject')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                disabled={selectedPermits.length === 0 || actionLoading || !user?.signature_image}
              >
                {actionLoading && bulkActionModal.action === "reject" ? 'Processing...' : `Bulk Reject (${selectedPermits.length})`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-gray-100">
            {pendingPermits.length > 0 ? (
              <table className="max-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedPermits.length === pendingPermits.length && pendingPermits.length > 0}
                        onChange={handleSelectAll}
                        disabled={actionLoading}
                      />
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ref No
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Society
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factory
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager Phone
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Bags
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight (kg)
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPermits.map((permit) => {
                    // Calculate totals
                    const totalBags = permit.coffee_quantities
                      ? permit.coffee_quantities.reduce((sum, q) => sum + (q.bags_quantity || 0), 0)
                      : 0;
                    const totalWeight = permit.coffee_quantities
                      ? permit.coffee_quantities.reduce(
                          (sum, q) =>
                            sum +
                            (q.bags_quantity || 0) *
                              (q.coffee_grade?.weight_per_bag || 0),
                          0
                        )
                      : 0;

                    return (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedPermits.includes(permit.id)}
                          onChange={(e) => handleSelectPermit(e, permit.id)}
                          disabled={actionLoading}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {permit.ref_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.society?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.factory?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.warehouse?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(permit.application_date)}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {permit.society?.manager_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {permit.society?.manager_email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {permit.society?.manager_phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {totalBags}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {totalWeight}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/permits/${permit.id}`}
                          className="px-3 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4 text-gray-500">No pending permits found.</div>
            )}
          </div>

        </div>
      </div>
          {/* Use shared Pagination component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalPermits}
            pageSize={permitsPerPage}
            onPageChange={setCurrentPage}
          />

      {/* Unified Bulk Action Modal */}
      {bulkActionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4 capitalize">
              Confirm {bulkActionModal.action}
            </h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">{bulkActionModal.action}</span> the selected permits?
            </p>
            {bulkActionModal.action === "reject" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-blue-600 focus:border-blue-600 text-sm resize-none"
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={actionLoading ? undefined : () => {
                  setBulkActionModal({ show: false, action: null });
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                className={`px-4 py-2 text-white rounded ${bulkActionModal.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
                disabled={actionLoading || (bulkActionModal.action === 'reject' && !rejectionReason.trim())}
              >
                {actionLoading ? (
                  <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Processing...</span>
                ) : (
                  bulkActionModal.action === "approve" ? "Approve" : "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermitApprovalQueue;
