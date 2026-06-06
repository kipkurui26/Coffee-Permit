import React, { useState, useEffect } from "react";
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import AxiosInstance from "../../../utils/AxiosInstance";
import { Link } from "react-router-dom";
import Pagination from '../../../components/Pagination'; 
import { useToast } from "../../../context/ToastContext";

const PermitManagement = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [permitsPerPage, setPermitsPerPage] = useState(10);
  const [totalPermits, setTotalPermits] = useState(0);
  const totalPages = Math.ceil(totalPermits / permitsPerPage);

  const [filters, setFilters] = useState({
    status: "",
    dateRange: { start: "", end: "" },
    society: "",
    factory: "",
    warehouse: "",
    quantityRange: { min: "", max: "" },
  });

  const [selectedPermits, setSelectedPermits] = useState([]);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add these new states
  const [societies, setSocieties] = useState([]);
  const [factories, setFactories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const { showToast } = useToast();

  useEffect(() => {
    fetchPermits();
    fetchSocieties();
    fetchFactories();
    fetchWarehouses();
  }, [currentPage, permitsPerPage, filters]); 

  const fetchPermits = async () => {
    try {
      const params = {
        page: currentPage,
        page_size: permitsPerPage,
        status: filters.status,
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
        society: filters.society,
        factory: filters.factory,
        warehouse: filters.warehouse,
        min_quantity: filters.quantityRange.min,
        max_quantity: filters.quantityRange.max,
      };
      
      const response = await AxiosInstance.get("/permits/permits/", { params });
      
      if (response.data.results) {
        setPermits(response.data.results);
        setTotalPermits(response.data.count);
      } else {
        // Handle non-paginated response
        const startIndex = (currentPage - 1) * permitsPerPage;
        const endIndex = startIndex + permitsPerPage;
        const paginatedData = response.data.slice(startIndex, endIndex);
        
        setPermits(paginatedData);
        setTotalPermits(response.data.length);
      }
      
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch permits");
      setLoading(false);
      showToast("Failed to fetch permits", "error");
    }
  };

  const fetchSocieties = async () => {
    try {
      const response = await AxiosInstance.get('/societies/admin/societies/');
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
      showToast("Failed to fetch societies", "error");
    }
  };

  const fetchFactories = async () => {
    try {
      const response = await AxiosInstance.get('/societies/factories/');
      setFactories(response.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
      showToast("Failed to fetch factories", "error");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await AxiosInstance.get('/warehouse/warehouses/');
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      showToast("Failed to fetch warehouses", "error");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-teal-100 text-teal-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-orange-100 text-orange-800",
    };
    return colors[status.toUpperCase()] || "bg-gray-100 text-gray-800";
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allPermitIds = permits.map((permit) => permit.id);
      setSelectedPermits(allPermitIds);
    } else {
      setSelectedPermits([]);
    }
  };

  const handleSelectPermit = (event, permitId) => {
    if (event.target.checked) {
      setSelectedPermits([...selectedPermits, permitId]);
    } else {
      setSelectedPermits(selectedPermits.filter((id) => id !== permitId));
    }
  };

  const handleExport = () => {
    console.log("Export selected permits:", selectedPermits);
    // Add your export logic here
  };

  const handleGenerateReport = () => {
    console.log("Generate report for selected permits:", selectedPermits);
    // Add your report generation logic here
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      dateRange: { start: "", end: "" },
      society: "",
      factory: "",
      warehouse: "",
      quantityRange: { min: "", max: "" },
    });
    setCurrentPage(1);
  };

  const allSelectedArePending = selectedPermits.length > 0 &&
    selectedPermits.every(id => permits.find(p => p.id === id)?.status === "PENDING");

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

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Permit Management</h1>
          <p className="text-gray-600 mt-1 text-sm">View, filter, and manage all permit applications across societies, factories, and warehouses.</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.dateRange.start}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value },
                  })
                }
              />
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.dateRange.end}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Society Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Society
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.society}
              onChange={(e) =>
                setFilters({ ...filters, society: e.target.value })
              }
            >
              <option value="">All Societies</option>
              {societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.name}
                </option>
              ))}
            </select>
          </div>

          {/* Factory Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Factory
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.factory}
              onChange={(e) =>
                setFilters({ ...filters, factory: e.target.value })
              }
            >
              <option value="">All Factories</option>
              {factories.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.warehouse}
              onChange={(e) =>
                setFilters({ ...filters, warehouse: e.target.value })
              }
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

        {/* Search Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer w-full sm:w-auto"
          >
            Clear Filters
          </button>
        </div>
          
        </div>

      </div>

      {/* Permits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto rounded-md border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      selectedPermits.length === permits.length &&
                      permits.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ref No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mill Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Weight(kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedPermits.includes(permit.id)}
                      onChange={(e) => handleSelectPermit(e, permit.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {permit.ref_no || "‾"}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(permit.application_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permit.society?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permit.factory?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permit.warehouse?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permit.total_weight || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/admin/permits/${permit.id}`}
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
        {permits.length === 0 && !loading && !error && (
          <div className="text-center py-4 text-gray-500">
            No permits found.
          </div>
        )}
      </div>

      {/* Add Pagination component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalPermits}
          pageSize={permitsPerPage}
          onPageChange={setCurrentPage}
        />
    </div>
  );
};

export default PermitManagement;
