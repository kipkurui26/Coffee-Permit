import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../../utils/AxiosInstance';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext'; 
import { useToast } from "../../../context/ToastContext";
import Pagination from "../../../components/Pagination";

const FactoryMgmt = () => {
  const { user } = useAuth();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState({ show: false, factoryId: null });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const factoriesPerPage = 10;
  const totalFactories = factories.length;

  // Paginate factories
  const paginatedFactories = factories.slice(
    (currentPage - 1) * factoriesPerPage,
    currentPage * factoriesPerPage
  );

  useEffect(() => {
    if (user?.managed_society) {
      fetchFactories();
    } else {
      setLoading(false); 
    }
  }, [user]); 

  const fetchFactories = async () => {
    try {
      const response = await axiosInstance.get('societies/factories/');
      // Filter factories by the current user's managed society if not an admin
      const filteredFactories = user.role === 'ADMIN'
        ? response.data
        : response.data.filter(factory => factory.society === user.managed_society.id);
      setFactories(filteredFactories);
    } catch (error) {
      toast.error('Failed to fetch factories');
      console.error('Error fetching factories:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (factoryId) => {
    setConfirmDelete({ show: true, factoryId });
  };

  const confirmDeleteFactory = async () => {
    const factoryId = confirmDelete.factoryId;
    setConfirmDelete({ show: false, factoryId: null });
      try {
        await axiosInstance.delete(`societies/factories/${factoryId}/`);
      showToast('Factory deleted successfully', 'success');
      fetchFactories();
      } catch (error) {
      showToast('Failed to delete factory', 'error');
        console.error('Error deleting factory:', error.response?.data || error.message);
    }
  };

  // Display message if user is not a society manager
  if (!user?.managed_society && user?.role !== 'ADMIN') { // Also check for admin role
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be a society manager to access this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-amber-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Factories</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all your coffee factories. You can add, edit, or remove factories associated with your society.
          </p>
        </div>
        <Link
          to="/factories/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Factory
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">County</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sub County</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date Updated</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFactories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 sm:px-6 text-gray-500 text-center">
                    No factories found.
                  </td>
                </tr>
              ) : (
                paginatedFactories.map((factory) => (
                  <tr key={factory.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">{factory.name}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">{factory.county}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">{factory.sub_county}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">{new Date(factory.date_added).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">{new Date(factory.date_updated).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          factory.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {factory.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right font-medium flex justify-end space-x-2">
                      <Link
                        to={`/factories/${factory.id}`}
                        className="text-teal-600 hover:text-teal-900"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(factory.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalFactories / factoriesPerPage)}
        totalResults={totalFactories}
        pageSize={factoriesPerPage}
        onPageChange={setCurrentPage}
      />
      {/* Confirmation Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this factory?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete({ show: false, factoryId: null })}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFactory}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryMgmt;