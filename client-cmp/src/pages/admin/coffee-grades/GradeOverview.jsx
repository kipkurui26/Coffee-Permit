import React, { useEffect, useState } from "react";
import AxiosInstance from "../../../utils/AxiosInstance";
import { Link, useLocation } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../../context/ToastContext";
import Pagination from "../../../components/Pagination";

const PAGE_SIZE = 10;

const GradeOverview = () => {
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState("");
  const [weightFilter, setWeightFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { showToast } = useToast();

  // For showing success message after redirect from register/delete
  const location = useLocation();
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, "success");
      window.history.replaceState({}, document.title); // Clear state
    }
  }, [location.state, showToast]);

  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get("/permits/coffee-grades/");
      setGrades(response.data);
    } catch (err) {
      showToast("Failed to fetch grades", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredGrades = grades.filter((grade) => {
    const matchesSearch = grade.grade
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesWeight = weightFilter
      ? String(grade.weight_per_bag) === weightFilter
      : true;
    return matchesSearch && matchesWeight;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredGrades.length / PAGE_SIZE);
  const paginatedGrades = filteredGrades.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-4 sm:p-6 px-2 sm:px-4 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <div className="w-full flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Coffee Grades
            </h1>
            <p className="text-gray-600 text-sm">
              View, filter, and manage all registered coffee grades.
            </p>
          </div>
          <Link
            to="/admin/coffee-grades/register"
            className="inline-flex items-center  px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Grade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-end gap-4 shadow overflow-x-auto">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search by Grade
          </label>
          <input
            type="text"
            placeholder="Search by grade name"
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 placeholder:text-gray-400 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Weight per Bag (kg)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 50"
            className="rounded-md border border-gray-300 px-3 py-2 w-full focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition"
            value={weightFilter}
            onChange={(e) => setWeightFilter(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer"
            onClick={() => {
              setSearch("");
              setWeightFilter("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Weight per Bag (kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Updated At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                </td>
              </tr>
            ) : paginatedGrades.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No grades found.
                </td>
              </tr>
            ) : (
              paginatedGrades.map((grade) => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grade.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {grade.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grade.weight_per_bag}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grade.created_at
                      ? new Date(grade.created_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grade.updated_at
                      ? new Date(grade.updated_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/coffee-grades/${grade.id}`}
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
        totalResults={filteredGrades.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default GradeOverview;
