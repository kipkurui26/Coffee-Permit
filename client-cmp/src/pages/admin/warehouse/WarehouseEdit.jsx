import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";
import { useForm } from 'react-hook-form';

const WarehouseEdit = () => {
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      county: '',
      sub_county: '',
      licence_number: '',
      is_active: true,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    fetchWarehouse();
    // eslint-disable-next-line
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get(`warehouse/warehouses/${warehouseId}/`);
      reset({
        name: response.data.name || '',
        county: response.data.county || '',
        sub_county: response.data.sub_county || '',
        licence_number: response.data.licence_number || '',
        is_active: response.data.is_active,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch warehouse details.');
      showToast(err.response?.data?.detail || 'Failed to fetch warehouse details.', "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      await AxiosInstance.patch(`warehouse/warehouses/${warehouseId}/`, data);
      setSuccessMessage('Warehouse updated successfully!');
      showToast('Warehouse updated successfully!', "success");
      setTimeout(() => navigate(`/admin/warehouses/${warehouseId}`), 1200);
    } catch (err) {
      const errorMsg =
        (err.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : err.response?.data?.detail) ||
        'Failed to update warehouse.';
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
        <button
          onClick={() => navigate(`/admin/warehouses/${warehouseId}`)}
          className="w-max inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Warehouse</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Name"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">County</label>
            <input
              {...register('county', {
                required: 'County is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="County"
            />
            {errors.county && <p className="text-red-600 text-xs mt-1">{errors.county.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sub County</label>
            <input
              {...register('sub_county', {
                required: 'Sub-county is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Sub County"
            />
            {errors.sub_county && <p className="text-red-600 text-xs mt-1">{errors.sub_county.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Licence Number</label>
            <input
              {...register('licence_number', {
                required: 'Licence number is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
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
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseEdit;