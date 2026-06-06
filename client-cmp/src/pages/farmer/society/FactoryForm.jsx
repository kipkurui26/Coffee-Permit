import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

const FactoryForm = () => {
  const navigate = useNavigate();
  const { factoryId } = useParams();
  const isEditing = Boolean(factoryId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      county: '',
      sub_county: '',
      is_active: true,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isEditing) {
      fetchFactory();
    }
    // eslint-disable-next-line
  }, [factoryId, isEditing]);

  const fetchFactory = async () => {
    try {
      const response = await axiosInstance.get(`societies/factories/${factoryId}/`);
      reset({
        name: response.data.name,
        county: response.data.county,
        sub_county: response.data.sub_county,
        is_active: response.data.is_active,
      });
    } catch (error) {
      showToast('Failed to fetch factory details', 'error');
      console.error('Error fetching factory:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    if (!user?.managed_society?.id) {
      showToast('You are not associated with a society to create/update factories.', 'error');
      setLoading(false);
      return;
    }
    const payload = {
      ...data,
      society: user.managed_society.id
    };
    try {
      if (isEditing) {
        await axiosInstance.patch(`societies/factories/${factoryId}/`, payload);
        showToast('Factory updated successfully', 'success');
      } else {
        await axiosInstance.post('societies/factories/', payload);
        showToast('Factory created successfully', 'success');
      }
      setTimeout(() => navigate('/factories'), 1200);
    } catch (error) {
      showToast(isEditing ? 'Failed to update factory' : 'Failed to create factory', 'error');
      console.error('Error saving factory:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.managed_society) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be a society manager to access this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {isEditing ? 'Edit Factory' : 'Add New Factory'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Factory Name
            </label>
            <input
              {...register('name', {
                required: 'Factory name is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              id="name"
              className="mt-1 block w-full border border-amber-300 rounded-md px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Factory Name"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="county" className="block text-sm font-medium text-gray-700">
              County
            </label>
            <input
              {...register('county', {
                required: 'County is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              id="county"
              className="mt-1 block w-full border border-amber-300 rounded-md px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="County"
            />
            {errors.county && <p className="text-red-600 text-xs mt-1">{errors.county.message}</p>}
          </div>

          <div>
            <label htmlFor="sub_county" className="block text-sm font-medium text-gray-700">
              Sub County
            </label>
            <input
              {...register('sub_county', {
                required: 'Sub-county is required',
                minLength: { value: 2, message: 'Min 2 characters' },
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              id="sub_county"
              className="mt-1 block w-full border border-amber-300 rounded-md px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              placeholder="Sub County"
            />
            {errors.sub_county && <p className="text-red-600 text-xs mt-1">{errors.sub_county.message}</p>}
          </div>

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              className="h-4 w-4 text-amber-700 border-amber-300 rounded focus:ring-amber-600"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Is Active
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/factories')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600"
            >
              {loading || isSubmitting ? 'Saving...' : isEditing ? 'Update Factory' : 'Create Factory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactoryForm; 