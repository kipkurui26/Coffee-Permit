import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import AxiosInstance from "../../../utils/AxiosInstance";
import { useAuth } from "../../../context/AuthContext";
import coffeeBG from "../../../assets/coffee.jpg";
import { useToast } from "../../../context/ToastContext";
import { useForm } from 'react-hook-form';

const CoffeePrice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      society: "",
      coffee_grade: "",
      coffee_year: "",
      price_per_bag: "",
      effective_date: "",
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    fetchPrices();
    fetchGrades();
  }, []);

  useEffect(() => {
    if (user && user.managed_society) {
      setValue('society', user.managed_society.id);
    } else if (user && user.role !== "ADMIN") {
      setError(
        "You are not authorized to manage coffee prices as you don't manage a society."
      );
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchPrices = async () => {
    try {
      const response = await AxiosInstance.get("/societies/coffee-prices/");
      setPrices(response.data);
    } catch (error) {
      setError("Failed to fetch coffee prices");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await AxiosInstance.get("/permits/coffee-grades/");
      setGrades(response.data);
    } catch (error) {
      setError("Failed to fetch coffee grades");
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!data.society) {
        setError("Society information is missing. Please log in as a society manager.");
        showToast("Society information is missing. Please log in as a society manager.", "error");
        return;
      }
      await AxiosInstance.post("/societies/coffee-prices/", data);
      setIsModalOpen(false);
      fetchPrices();
      reset({
        society: user?.managed_society?.id || "",
        coffee_grade: "",
        coffee_year: "",
        price_per_bag: "",
        effective_date: "",
      });
      showToast("Coffee price added successfully!", "success");
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.coffee_year ||
        error.response?.data?.detail ||
        "Failed to create coffee price";
      setError(errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await AxiosInstance.get(
        `/societies/coffee-prices/${id}/`
      );
      reset({
        society: response.data.society,
        coffee_grade: response.data.coffee_grade,
        coffee_year: response.data.coffee_year,
        price_per_bag: response.data.price_per_bag,
        effective_date: response.data.effective_date,
      });
      setIsModalOpen(true);
    } catch (error) {
      setError("Failed to fetch price details");
      showToast("Failed to fetch price details", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this price?")) {
      try {
        await AxiosInstance.delete(`/societies/coffee-prices/${id}/`);
        fetchPrices();
        showToast("Coffee price deleted successfully!", "success");
      } catch (error) {
        setError("Failed to delete price");
        showToast("Failed to delete price", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error && !user?.managed_society) {
    return (
      <div className="text-center p-6">
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Authorization Error
        </h3>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-amber-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Coffee Prices</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage coffee prices for your society. Set prices for different grades and coffee years.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            reset({
              society: user?.managed_society?.id || "",
              coffee_grade: "",
              coffee_year: "",
              price_per_bag: "",
              effective_date: "",
            });
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Price
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coffee Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price per Bag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effective Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prices.map((price) => (
              <tr key={price.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {price.coffee_grade_details.grade} (
                  {price.coffee_grade_details.weight_per_bag}kg)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {price.coffee_year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  KES {price.price_per_bag}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(price.effective_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      price.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {price.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(price.id)}
                    className="text-teal-600 hover:text-teal-900 mr-4"
                    title="Edit"
                    aria-label="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(price.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center"
          style={{
            backgroundImage: `url(${coffeeBG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm sm:max-w-md w-full border border-amber-200 shadow-md">
            <h2 className="text-lg font-medium mb-4">Add New Coffee Price</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {user?.managed_society && (
                <p className="text-sm text-gray-600">
                  Setting price for: {" "}
                  <span className="font-semibold">
                    {user.managed_society.name}
                  </span>
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coffee Grade
                </label>
                <select
                  {...register('coffee_grade', {
                    required: 'Coffee grade is required',
                  })}
                  className="mt-1 block w-full rounded-md border border-amber-300 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade} ({grade.weight_per_bag}kg)
                    </option>
                  ))}
                </select>
                {errors.coffee_grade && <p className="text-red-600 text-xs mt-1">{errors.coffee_grade.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coffee Year
                </label>
                <input
                  {...register('coffee_year', {
                    required: 'Coffee year is required',
                    pattern: {
                      value: /^\d{4}\/\d{2}$/,
                      message: 'Format: YYYY/YY (e.g., 2023/24)',
                    },
                  })}
                  type="text"
                  placeholder="YYYY/YY (e.g., 2023/24)"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                />
                {errors.coffee_year && <p className="text-red-600 text-xs mt-1">{errors.coffee_year.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price per Bag (KES)
                </label>
                <input
                  {...register('price_per_bag', {
                    required: 'Price is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  placeholder="Price per Bag"
                  className="mt-1 block w-full rounded-md border border-amber-300 placeholder-gray-800 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                />
                {errors.price_per_bag && <p className="text-red-600 text-xs mt-1">{errors.price_per_bag.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Effective Date
                </label>
                <input
                  {...register('effective_date', {
                    required: 'Effective date is required',
                  })}
                  type="date"
                  className="mt-1 block w-full rounded-md border border-amber-300 text-black px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                />
                {errors.effective_date && <p className="text-red-600 text-xs mt-1">{errors.effective_date.message}</p>}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-700 hover:bg-amber-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeePrice;
