import React, { useEffect, useState } from "react";
import AxiosInstance from "../../../utils/AxiosInstance";
import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../../context/ToastContext";

const PAGE_SIZE = 10;

const statusColors = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  canceled: "bg-gray-200 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
};

function getSocietyStatus(society) {
  if (society.canceled) return "canceled";
  if (society.is_approved) return "approved";
  if (society.rejection_reason) return "rejected";
  return "pending";
}

const SocietyMgmt = () => {
  const [societies, setSocieties] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [subCountyFilter, setSubCountyFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // For filter dropdowns
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection
  const [selectedSocieties, setSelectedSocieties] = useState([]);

  // Bulk action modal
  const [bulkActionModal, setBulkActionModal] = useState({
    show: false,
    action: null, // "approve" or "reject"
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSocieties();
    // eslint-disable-next-line
  }, []);

  const fetchSocieties = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get("/societies/admin/societies/");
      setSocieties(response.data);

      // Extract unique counties and sub-counties for filters
      const uniqueCounties = [
        ...new Set(response.data.map((s) => s.county).filter(Boolean)),
      ];
      setCounties(uniqueCounties);

      const uniqueSubCounties = [
        ...new Set(response.data.map((s) => s.sub_county).filter(Boolean)),
      ];
      setSubCounties(uniqueSubCounties);
    } catch (err) {
      showToast("Failed to fetch societies", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredSocieties = societies.filter((society) => {
    const matchesSearch =
      society.name.toLowerCase().includes(search.toLowerCase()) ||
      (society.manager &&
        (society.manager.first_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
          society.manager.last_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          society.manager.email
            ?.toLowerCase()
            .includes(search.toLowerCase()))) ||
      society.county?.toLowerCase().includes(search.toLowerCase()) ||
      society.sub_county?.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "approved") {
      matchesStatus = society.is_approved;
    } else if (statusFilter === "pending") {
      matchesStatus = !society.is_approved && !society.rejection_reason;
    } else if (statusFilter === "rejected") {
      matchesStatus = !society.is_approved && !!society.rejection_reason;
    } else if (statusFilter === "canceled") {
      matchesStatus = society.canceled;
    }

    const matchesCounty = countyFilter ? society.county === countyFilter : true;
    const matchesSubCounty = subCountyFilter
      ? society.sub_county === subCountyFilter
      : true;

    return matchesSearch && matchesStatus && matchesCounty && matchesSubCounty;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSocieties.length / PAGE_SIZE);
  const paginatedSocieties = filteredSocieties.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Bulk selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSocieties(paginatedSocieties.map((s) => s.id));
    } else {
      setSelectedSocieties([]);
    }
  };

  const handleSelectSociety = (id) => {
    setSelectedSocieties((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Bulk Approve/Reject
  const handleBulkAction = async (action, reason = "") => {
    if (selectedSocieties.length === 0) return;
    try {
      for (const id of selectedSocieties) {
        if (action === "approve") {
          await AxiosInstance.post(`/societies/admin/societies/${id}/approve/`);
        } else {
          await AxiosInstance.post(`/societies/admin/societies/${id}/reject/`, {
            rejection_reason: reason,
          });
        }
      }
      showToast(`Societies ${action}d successfully`, "success");
      setSelectedSocieties([]);
      fetchSocieties();
    } catch (err) {
      showToast(`Failed to ${action} societies`, "error");
    }
  };

  const allSelectedArePending =
    selectedSocieties.length > 0 &&
    selectedSocieties.every((id) => {
      const s = paginatedSocieties.find((soc) => soc.id === id);
      return s && !s.is_approved && !s.rejection_reason;
    });

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-4 sm:p-6 px-2 sm:px-4 md:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Society Management
          </h1>
          <p className="text-gray-600 text-sm">
            View, filter, and manage all registered societies. Use the filters
            below to narrow down your search.
          </p>
        </div>
        <Link
          to="/admin/societies/register"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 w-full sm:w-auto justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Society
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-end gap-4 shadow overflow-x-auto">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name, manager, county, sub-county"
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 placeholder:text-gray-400 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending/Inactive</option>
            <option value="rejected">Rejected</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            County
          </label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition"
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
          >
            <option value="">All Counties</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sub-County
          </label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition"
            value={subCountyFilter}
            onChange={(e) => setSubCountyFilter(e.target.value)}
          >
            <option value="">All Sub-Counties</option>
            {subCounties.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setCountyFilter("");
              setSubCountyFilter("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 mb-2 w-full">
        <button
          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
          disabled={selectedSocieties.length === 0 || !allSelectedArePending}
          onClick={() => setBulkActionModal({ show: true, action: "approve" })}
        >
          Bulk Approve ({selectedSocieties.length})
        </button>
        <button
          className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto"
          disabled={selectedSocieties.length === 0 || !allSelectedArePending}
          onClick={() => setBulkActionModal({ show: true, action: "reject" })}
        >
          Bulk Reject ({selectedSocieties.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    paginatedSocieties.length > 0 &&
                    selectedSocieties.length === paginatedSocieties.length
                  }
                  onChange={handleSelectAll}
                  disabled={paginatedSocieties.length === 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Manager Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Manager Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Manager Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sub-County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rejection Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                </td>
              </tr>
            ) : paginatedSocieties.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No societies found.
                </td>
              </tr>
            ) : (
              paginatedSocieties.map((society) => (
                <tr key={society.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSocieties.includes(society.id)}
                      onChange={() => handleSelectSociety(society.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[getSocietyStatus(society)]
                      }`}
                    >
                      {getSocietyStatus(society).charAt(0).toUpperCase() +
                        getSocietyStatus(society).slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.manager_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.manager_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.manager_phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.sub_county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.date_registered
                      ? new Date(society.date_registered).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {society.rejection_reason || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/societies/${society.id}`}
                      className="px-3 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={filteredSocieties.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {bulkActionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4 capitalize">
              Confirm {bulkActionModal.action}
            </h2>
            <p className="mb-6">
              Are you sure you want to{" "}
              <span className="font-bold">{bulkActionModal.action}</span> the
              selected societies?
            </p>
            {bulkActionModal.action === "reject" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm resize-none "
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={
                  actionLoading
                    ? undefined
                    : () => {
                        setBulkActionModal({ show: false, action: null });
                        setRejectionReason("");
                      }
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    setBulkActionModal({ show: false, action: null });
                    await handleBulkAction(
                      bulkActionModal.action,
                      rejectionReason
                    );
                    setRejectionReason("");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className={`px-4 py-2 text-white rounded ${
                  bulkActionModal.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
                disabled={
                  actionLoading ||
                  (bulkActionModal.action === "reject" &&
                    !rejectionReason.trim())
                }
              >
                {actionLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                    Processing...
                  </span>
                ) : bulkActionModal.action === "approve" ? (
                  "Approve"
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyMgmt;
