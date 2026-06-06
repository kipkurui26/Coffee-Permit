import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../context/ToastContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/AxiosInstance';
import { GiCoffeeBeans } from 'react-icons/gi';
import coffeeImage from '../../assets/coffee.jpg';
import { FiEye, FiEyeOff } from "react-icons/fi";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axiosInstance.post('/auth/password/reset/confirm/', {
        uid,
        token,
        new_password1: data.new_password1,
        new_password2: data.new_password2,
      });
      setSuccess(true);
      showToast('Password reset successful! You can now log in.', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showToast('Password reset failed. The link may be invalid or expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-amber-50">
      {/* Left Half: Form */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-4 sm:p-6">
        <div className="flex items-center mb-6 sm:mb-8">
          <GiCoffeeBeans className="h-8 w-8 text-amber-800 flex-shrink-0" />
          <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-800">Coffee Movement Permit</span>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md border border-amber-200">
          <div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 text-center">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">Enter your new password below.</p>
          </div>
          {success ? (
            <div className="auth-message text-center mt-6">
              <p className="text-green-700 font-medium mb-4">Your password has been reset. Redirecting to login...</p>
              <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">Go to Login</Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="new_password1" className="sr-only">New Password</label>
                <div className="relative">
                  <input
                    id="new_password1"
                    type={showPassword ? "text" : "password"}
                    {...register('new_password1', { required: 'New password is required' })}
                    className={`appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm pr-10 ${errors.new_password1 ? 'border-red-500' : ''}`}
                    placeholder="New Password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {errors.new_password1 && <p className="mt-1 text-sm text-red-600">{errors.new_password1.message}</p>}
              </div>
              <div>
                <label htmlFor="new_password2" className="sr-only">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="new_password2"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('new_password2', {
                      required: 'Please confirm your new password',
                      validate: value => value === watch('new_password1') || 'Passwords do not match',
                    })}
                    className={`appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm pr-10 ${errors.new_password2 ? 'border-red-500' : ''}`}
                    placeholder="Confirm New Password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {errors.new_password2 && <p className="mt-1 text-sm text-red-600">{errors.new_password2.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div className="text-center mt-4 text-sm text-gray-700">
                <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Right Half: Image */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center items-center justify-center p-8 relative"
        style={{ backgroundImage: `url(${coffeeImage})` }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative text-white text-center p-4">
          <h3 className="text-3xl font-bold mb-4 drop-shadow-md">Set a New Password</h3>
          <p className="text-lg drop-shadow-md">Create a strong password to secure your account.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 