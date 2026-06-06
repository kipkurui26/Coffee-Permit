import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../../context/ToastContext';
import axiosInstance from '../../utils/AxiosInstance';
import { Link } from 'react-router-dom';
import { GiCoffeeBeans } from 'react-icons/gi';
import coffeeImage from '../../assets/coffee.jpg';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axiosInstance.post('auth/password/forgot/', { email: data.email });
      setSubmitted(true);
      showToast('If an account with that email exists, a reset link has been sent.', 'success');
    } catch (err) {
      showToast('There was a problem sending the reset email. Please try again.', 'error');
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
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 text-center">Forgot Password</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">Enter your email to receive a password reset link.</p>
          </div>
          {submitted ? (
            <div className="auth-message text-center mt-6">
              <p className="text-green-700 font-medium mb-4">Check your email for a password reset link.</p>
              <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">Back to Login</Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className={`appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Email address"
                  disabled={loading}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
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
          <h3 className="text-3xl font-bold mb-4 drop-shadow-md">Reset Your Password</h3>
          <p className="text-lg drop-shadow-md">We'll help you get back into your account.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;