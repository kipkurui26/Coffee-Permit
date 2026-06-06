import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/20/solid";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import AxiosInstance from "../../../utils/AxiosInstance";
import Pagination from "../../../components/Pagination";
import { useToast } from "../../../context/ToastContext";

const PermitList = () => {
  const [permits, setPermits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermits, setSelectedPermits] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [permitsPerPage] = useState(10);
  const [totalPermits, setTotalPermits] = useState(0);

  const { isAuthenticated, loading: authLoading, user } = useAuth();

  // Get user role for conditional rendering
  const isStaff = user?.is_staff;
  const isSocietyManager = user?.managed_society;

  useEffect(() => {
    const fetchPermits = async () => {
      if (!isAuthenticated || authLoading) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await AxiosInstance.get(
          "permits/permits/pending_permits/"
        );
        const data = response.data;

        const transformedPermits = data.map((permit) => ({
          id: permit.id,
          refNo: permit.ref_no,
          society: permit.society?.name || "N/A",
          factory: permit.factory?.name || "N/A",
          warehouse: permit.warehouse?.name || "N/A",
          applicationDate: permit.application_date
            ? new Date(permit.application_date).toLocaleDateString()
            : "N/A",
          expiryDate: permit.delivery_end
            ? new Date(permit.delivery_end).toLocaleDateString()
            : "N/A",
          status: permit.status,
          approvedBy: permit.approved_by
            ? `${permit.approved_by.first_name || ""} ${
                permit.approved_by.last_name || ""
              }`.trim() || "N/A"
            : "N/A",
          totalBags: permit.total_bags,
          totalWeight: permit.total_weight,
          farmer: permit.farmer
            ? `${permit.farmer.first_name} ${permit.farmer.last_name}`
            : "N/A",
          is_valid: permit.is_valid,
        }));

        let filteredPermits = transformedPermits.filter(
          (permit) =>
            permit.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permit.society.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permit.factory.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permit.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (permit.approvedBy &&
              permit.approvedBy
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (permit.farmer &&
              permit.farmer.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        setTotalPermits(filteredPermits.length);
        const startIndex = (currentPage - 1) * permitsPerPage;
        const endIndex = startIndex + permitsPerPage;
        const paginatedPermits = filteredPermits.slice(startIndex, endIndex);

        setPermits(paginatedPermits);
      } catch (error) {
        console.error("Error fetching permits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermits();
  }, [
    searchTerm,
    currentPage,
    permitsPerPage,
    isAuthenticated,
    authLoading,
  ]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedPermits(permits.map((permit) => permit.id));
    } else {
      setSelectedPermits([]);
    }
  };

  const handleSelectPermit = (permitId) => {
    setSelectedPermits((prevSelected) =>
      prevSelected.includes(permitId)
        ? prevSelected.filter((id) => id !== permitId)
        : [...prevSelected, permitId]
    );
  };

  const handleCancelSelected = async () => {
    setActionLoading(true);
    try {
      // Only allow cancel for pending permits
      const pendingPermitIds = selectedPermits.filter(id => {
        const permit = permits.find(p => p.id === id);
        return permit && permit.status === "PENDING";
      });

      if (pendingPermitIds.length === 0) {
        showToast("No pending permits selected for cancellation.", "error");
        setShowCancelModal(false);
        return;
      }

      for (const id of pendingPermitIds) {
        await AxiosInstance.post(`/permits/permits/${id}/cancel/`);
      }
      showToast("Selected permits cancelled successfully.", "success");
      setSelectedPermits([]);
      await fetchPermits();
    } catch (err) {
      showToast("Failed to cancel selected permits.", "error");
    } finally {
      setShowCancelModal(false);
      setActionLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "EXPIRED":
        return "text-red-600 bg-red-100";
      case "REJECTED":
        return "text-red-600 bg-red-100";
      case "CANCELLED":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Permits</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isStaff
              ? "View and manage all coffee movement permits."
              : isSocietyManager
              ? "View and manage pending permits for your society."
              : "View your coffee movement permits."}
          </p>
        </div>
        {isSocietyManager && (
          <Link
            to="/permits/new"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Permit
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border-amber-300 pl-10 pr-10 focus:border-amber-600 focus:ring-amber-600 sm:text-sm"
              placeholder="Search permits..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Actions on selected items */}
      {selectedPermits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedPermits.length} permit
            {selectedPermits.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={selectedPermits.length === 0}
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            Cancel Selected
          </button>
        </div>
      )}

      {/* Permit Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-hidden">
        {authLoading || isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : permits.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No permits found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onChange={handleSelectAll}
                      checked={
                        selectedPermits.length === permits.length &&
                        permits.length > 0
                      }
                      disabled={permits.length === 0}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ref No
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  {isStaff && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Farmer
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Society
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Factory
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mill Warehouse
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Application Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Expiry Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Approved By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Bags
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Weight (kg)
                  </th>
                  <th
                    scope="col"
                    className="relative px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    <span className="">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permits.map((permit) => (
                  <tr key={permit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedPermits.includes(permit.id)}
                        onChange={() => handleSelectPermit(permit.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {permit.refNo  || "‾"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          permit.status
                        )}`}
                      >
                        {permit.status}
                      </span>
                    </td>
                    {isStaff && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.farmer}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.society}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.factory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.applicationDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.approvedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.totalBags}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permit.totalWeight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/permits/${permit.id}`}
                        className="px-3 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalPermits / permitsPerPage)}
        totalResults={totalPermits}
        pageSize={permitsPerPage}
        onPageChange={setCurrentPage}
      />

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Cancellation</h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">cancel</span> the selected pending permits? This action cannot be undone.
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
                onClick={handleCancelSelected}
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

export default PermitList;
