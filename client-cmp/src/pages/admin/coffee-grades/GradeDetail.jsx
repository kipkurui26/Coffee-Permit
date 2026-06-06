import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AxiosInstance from "../../../utils/AxiosInstance";
import { useToast } from "../../../context/ToastContext";
import { useForm } from "react-hook-form";

const GradeDetail = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    defaultValues: {
      grade: "",
      weight_per_bag: "",
      description: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    fetchGradeDetails();
    // eslint-disable-next-line
  }, [gradeId]);

  const fetchGradeDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await AxiosInstance.get(
        `/permits/coffee-grades/${gradeId}/`
      );
      setGrade(response.data);
      reset({
        grade: response.data.grade,
        weight_per_bag: response.data.weight_per_bag,
        description: response.data.description || "",
      });
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          "Failed to fetch grade details. Please try again later.",
        "error"
      );
      setError(
        error.response?.data?.detail ||
          "Failed to fetch grade details. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const response = await AxiosInstance.patch(
        `/permits/coffee-grades/${gradeId}/`,
        data
      );
      setGrade(response.data);
      setIsEditing(false);
      setSuccessMessage("Grade updated successfully!");
      showToast("Grade updated successfully!", "success");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          "Failed to update grade. Please try again later.",
        "error"
      );
      setError(
        error.response?.data?.detail ||
          "Failed to update grade. Please try again later."
      );
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await AxiosInstance.delete(`/permits/coffee-grades/${gradeId}/`);
      showToast("Grade deleted successfully!", "success");
      setTimeout(() => {
        navigate("/admin/coffee-grades", {
          state: { message: "Grade deleted successfully!" },
        });
      }, 1200);
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          "Failed to delete grade. Please try again later.",
        "error"
      );
      setError(
        error.response?.data?.detail ||
          "Failed to delete grade. Please try again later."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error && !grade) {
    return (
      <div className="text-center p-6">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => navigate("/admin/coffee-grades")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Grades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
          <button
            onClick={() => navigate("/admin/coffee-grades")}
            className="w-max inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Grade Details</h1>
          <p className="text-gray-600 text-sm mt-1 mb-2 max-w-xl">
            View, edit, or delete this coffee grade.
          </p>
        </div>
      </div>
      <div className="w-full flex justify-evenly items-center gap-4 md:justify-end">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <PencilIcon className="h-5 w-5 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Delete
        </button>
      </div>

      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700"
            >
              Grade
            </label>
            <input
              {...register('grade', {
                required: 'Grade is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 50, message: 'Max 50 characters' },
              })}
              type="text"
              name="grade"
              id="grade"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Grade"
            />
            {errors.grade && <p className="text-red-600 text-xs mt-1">{errors.grade.message}</p>}
          </div>
          <div>
            <label
              htmlFor="weight_per_bag"
              className="block text-sm font-medium text-gray-700"
            >
              Weight per Bag (kg)
            </label>
            <input
              {...register('weight_per_bag', {
                required: 'Weight is required',
                min: { value: 1, message: 'Must be at least 1kg' },
                max: { value: 1000, message: 'Must be less than 1000kg' },
                valueAsNumber: true,
              })}
              type="number"
              step="0.01"
              name="weight_per_bag"
              id="weight_per_bag"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Weight per Bag (kg)"
            />
            {errors.weight_per_bag && <p className="text-red-600 text-xs mt-1">{errors.weight_per_bag.message}</p>}
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              {...register('description', {
                maxLength: { value: 200, message: 'Max 200 characters' },
              })}
              name="description"
              id="description"
              className="mt-1 block w-full min-h-24 rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm resize-none"
              placeholder="Description"
              rows={3}
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white shadow overflow-x-auto sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Grade Information
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Grade</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grade.grade}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grade.description || "-"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Weight per Bag
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grade.weight_per_bag} kg
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Created At
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grade.created_at
                    ? new Date(grade.created_at).toLocaleString()
                    : "-"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Updated At
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {grade.updated_at
                    ? new Date(grade.updated_at).toLocaleString()
                    : "-"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">delete</span>{" "}
              this grade? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
                className="px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700"
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

export default GradeDetail;
