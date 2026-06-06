import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import AxiosInstance from "../../../utils/AxiosInstance";
import Pagination from "../../../components/Pagination";

const PermitMgmt = () => {
  const [permits, setPermits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [permitsPerPage, setPermitsPerPage] = useState(10);
  const [totalPermits, setTotalPermits] = useState(0);

  const { isAuthenticated, loading: authLoading } = useAuth();

  // Add new state for filters
  const [filters, setFilters] = useState({
    status: "",
    dateRange: { start: "", end: "" },
    society: "",
    factory: "",
    warehouse: "",
    quantityRange: { min: "", max: "" },
  });

  // Add new state for dropdown options
  const [societies, setSocieties] = useState([]);
  const [factories, setFactories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Add new useEffect to fetch dropdown options
  useEffect(() => {
    fetchSocieties();
    fetchFactories();
    fetchWarehouses();
  }, []);

  const fetchSocieties = async () => {
    try {
      const response = await AxiosInstance.get("/societies/societies/");
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const fetchFactories = async () => {
    try {
      const response = await AxiosInstance.get("/societies/factories/");
      setFactories(response.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await AxiosInstance.get("/warehouse/warehouses/");
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  useEffect(() => {
    const fetchPermits = async () => {
      if (!isAuthenticated || authLoading) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = {
          status: filters.status,
          start_date: filters.dateRange.start,
          end_date: filters.dateRange.end,
          society: filters.society,
          factory: filters.factory,
          warehouse: filters.warehouse,
          min_quantity: filters.quantityRange.min,
          max_quantity: filters.quantityRange.max,
        };

        const response = await AxiosInstance.get(
          "/permits/permits/my_permits/",
          { params }
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
                .includes(searchTerm.toLowerCase()))
        );

        if (filters.status) {
          filteredPermits = filteredPermits.filter(
            (permit) => permit.status === filters.status
          );
        }

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
    filters,
  ]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
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
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Add handler for clearing filters
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

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Permits</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all your coffee movement permits.
          </p>
        </div>

        <Link
          to="/permits/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Permit
        </Link>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

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
                    Ref No
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
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
    </div>
  );
};

export default PermitMgmt;
