import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";
import { useForm } from 'react-hook-form';

const GradeRegister = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      grade: '',
      weight_per_bag: '',
      description: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data) => {
    try {
      await AxiosInstance.post('/permits/coffee-grades/', data);
      showToast("Grade created successfully!", "success");
      reset();
      setTimeout(() => {
        navigate('/admin/coffee-grades');
      }, 1200);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create grade. Please try again later.', "error");
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      <div className="flex items-center space-x-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
          <button
            onClick={() => navigate('/admin/coffee-grades')}
            className="w-max inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Register New Grade</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
            Grade
          </label>
          <input
            {...register('grade', {
              required: 'Grade is required',
              minLength: { value: 2, message: 'Min 2 characters' },
              maxLength: { value: 50, message: 'Max 50 characters' },
            })}
            type="text"
            id="grade"
            className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
            placeholder="Grade"
          />
          {errors.grade && <p className="text-red-600 text-xs mt-1">{errors.grade.message}</p>}
        </div>

        <div>
          <label htmlFor="weight_per_bag" className="block text-sm font-medium text-gray-700">
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
            id="weight_per_bag"
            className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 placeholder-gray-800 text-black focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
            placeholder="Weight per Bag (kg)"
          />
          {errors.weight_per_bag && <p className="text-red-600 text-xs mt-1">{errors.weight_per_bag.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description', {
              maxLength: { value: 200, message: 'Max 200 characters' },
            })}
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
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isSubmitting ? 'Creating...' : 'Create Grade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeRegister;