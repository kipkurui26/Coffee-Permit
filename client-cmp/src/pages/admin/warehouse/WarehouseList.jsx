import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../../utils/AxiosInstance";
import coffeeBG from "../../../assets/coffee.jpg";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Pagination from '../../../components/Pagination';
import { useToast } from "../../../context/ToastContext";
import { useForm } from 'react-hook-form';

const PAGE_SIZE = 10;

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      county: "",
      sub_county: "",
      licence_number: "",
      is_active: true,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("warehouse/warehouses/");
      setWarehouses(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch warehouses");
      showToast(error.response?.data?.message || "Failed to fetch warehouses", "error");
    }
    setLoading(false);
  };

  const onSubmit = async (data) => {
    try {
      await axiosInstance.post("warehouse/warehouses/", data);
      showToast("Warehouse created successfully", "success");
      setIsModalOpen(false);
      reset();
      fetchWarehouses();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create warehouse", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this warehouse?"))
      return;
    try {
      await axiosInstance.delete(`warehouse/warehouses/${id}/`);
      showToast("Warehouse deleted successfully", "success");
      fetchWarehouses();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete warehouse", "error");
    }
  };

  const totalPages = Math.ceil(warehouses.length / PAGE_SIZE);
  const paginatedWarehouses = warehouses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 px-2 sm:px-4 md:px-0">
      <div className="flex justify-between items-center">
        <div className="w-full flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mill Warehouse Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View, add, edit, and manage all coffee mill warehouses in the system.
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              reset();
            }}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Warehouse
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-x-auto sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sub County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Licence Number
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              paginatedWarehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {warehouse.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        warehouse.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {warehouse.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {warehouse.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {warehouse.sub_county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {warehouse.licence_number}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/warehouses/${warehouse.id}`}
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

      {!loading && warehouses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={warehouses.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center px-2"
          style={{
            backgroundImage: `url(${coffeeBG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xs sm:max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Add New Warehouse</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Name"
                />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  County
                </label>
                <input
                  {...register('county', {
                    required: 'County is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="County"
                />
                {errors.county && <p className="text-red-600 text-xs mt-1">{errors.county.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sub County
                </label>
                <input
                  {...register('sub_county', {
                    required: 'Sub-county is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Sub County"
                />
                {errors.sub_county && <p className="text-red-600 text-xs mt-1">{errors.sub_county.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Licence Number
                </label>
                <input
                  {...register('licence_number', {
                    required: 'Licence number is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Licence Number"
                />
                {errors.licence_number && <p className="text-red-600 text-xs mt-1">{errors.licence_number.message}</p>}
              </div>
              <div className="flex items-center">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-amber-300 rounded focus:ring-amber-600"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end space-x-0 sm:space-x-3 mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseList;
