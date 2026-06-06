import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  XCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";

const PermitDetail = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const [permitData, setPermitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        // Fetch permit details. The backend get_queryset will filter by farmer or society manager.
        const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
        setPermitData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching permit details:", err);
        setError('Failed to fetch permit details. You might not have permission or the permit does not exist.');
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

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
      case 'CANCELLED': // Assuming CANCELLED status might exist
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/permits/permits/${permitId}/cancel/`);
      // Refresh permit data after cancellation
      const response = await AxiosInstance.get(`/permits/permits/${permitId}/`);
      setPermitData(response.data);
      showToast('Permit application cancelled successfully!', 'success');
    } catch (err) {
      console.error('Error cancelling permit:', err);
      setError('Failed to cancel permit. Please try again.');
      showToast('Failed to cancel permit. Please try again.', 'error');
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Check if permit is approved before attempting download
      if (permitData.status !== 'APPROVED') {
        showToast(`PDF can only be generated for approved permits. Current status: ${permitData.status}`, 'error');
        return;
      }

      const response = await AxiosInstance.get(`/permits/permits/${permitId}/pdf/`, {
        responseType: 'blob' // Important for downloading files
      });

      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });

      // Create a URL for the blob
      const fileURL = window.URL.createObjectURL(file);

      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `permit_${permitData.ref_no}.pdf`; // Suggest a filename
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error('Error downloading PDF:', error);
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
    return <div className="text-center p-4">Permit not found or you don't have access.</div>;
  }

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/permits')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Permit Details</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
          {permitData.status === 'PENDING' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              Cancel Application
            </button>
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reference Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permitData.ref_no || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(permitData.status)}`}>
                      {permitData.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(permitData.application_date).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Delivery Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {permitData.delivery_start && permitData.delivery_end ? (
                      `${new Date(permitData.delivery_start).toLocaleDateString()} - ${new Date(permitData.delivery_end).toLocaleDateString()}`
                    ) : (
                      "N/A"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {permitData.rejection_reason || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Society</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permitData.society?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Factory</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permitData.factory?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Warehouse</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permitData.warehouse?.name || 'N/A'}</dd>
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
                  {permitData.coffee_quantities.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coffee_grade?.grade || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bags_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coffee_grade?.weight_per_bag || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_weight}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permitData.total_bags}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permitData.total_weight}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Cancellation</h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">cancel</span> this permit application? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={actionLoading ? undefined : () => setShowCancelModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (<span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Cancelling...</span>) : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermitDetail;