import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AxiosInstance from "../../../utils/AxiosInstance";
import { useToast } from "../../../context/ToastContext";

const WarehouseDetail = () => {
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { showToast } = useToast();
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchWarehouse();
    // eslint-disable-next-line
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get(
        `warehouse/warehouses/${warehouseId}/`
      );
      setWarehouse(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to fetch warehouse details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await AxiosInstance.delete(`warehouse/warehouses/${warehouseId}/`);
      showToast("Warehouse deleted successfully!", "success");
      setTimeout(() => navigate("/admin/warehouses"), 1500);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to delete warehouse.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => navigate("/admin/warehouses")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <div className="">
        {/* Header: stack vertically on mobile */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
          <button
            onClick={() => navigate("/admin/warehouses")}
            className="w-max inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Warehouse Details
          </h1>
          <p className="text-gray-600 text-sm mt-1 mb-2 max-w-xl">
            View, edit, or delete this warehouse. Below you’ll find all the key information and related society details if available.
          </p>
        </div>
        <div className="w-full flex items-center gap-4 md:justify-end">
          <Link
            to={`/admin/warehouses/${warehouseId}/edit`}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Warehouse Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {warehouse.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">County</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {warehouse.county}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Sub County</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {warehouse.sub_county}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Licence Number
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {warehouse.licence_number}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Active</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    warehouse.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {warehouse.is_active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
            {/* If warehouse.society exists, show society details */}
            {warehouse.society && (
              <div className="bg-white px-4 py-5 sm:px-6">
                <h4 className="text-md font-semibold text-gray-700 mb-2">
                  Society Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-500">Name: </span>
                    <span className="text-gray-900">
                      {warehouse.society.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Manager: </span>
                    <span className="text-gray-900">
                      {warehouse.society.manager_name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Email: </span>
                    <span className="text-gray-900">
                      {warehouse.society.manager_email}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Phone: </span>
                    <span className="text-gray-900">
                      {warehouse.society.manager_phone}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <div className="bg-white rounded shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to <span className="font-bold">delete</span>{" "}
              this warehouse? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={
                  deleteLoading ? undefined : () => setShowDeleteModal(false)
                }
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseDetail;
