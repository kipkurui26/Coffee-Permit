import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { GiCoffeeBeans } from 'react-icons/gi';
import axiosInstance, { fetchCsrfToken } from '../../utils/AxiosInstance'
import { useToast } from "../../context/ToastContext";
import coffeeImage from '../../assets/coffee.jpg';
import { FiEye, FiEyeOff } from "react-icons/fi";

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors }, trigger, setValue, getValues, clearErrors } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    axiosInstance.get('/auth/csrf/');

    if (step === 1) {
      setValue('email', formData.email || '');
      setValue('phone', formData.phone || '');

      clearErrors(['firstName', 'lastName', 'societyName', 'county', 'subCounty']);
    } else if (step === 2) {
      setValue('firstName', formData.firstName || '');
      setValue('lastName', formData.lastName || '');
      setValue('societyName', formData.societyName || '');
      setValue('county', formData.county || '');
      setValue('subCounty', formData.subCounty || '');
      clearErrors(['email', 'phone', 'password', 'confirmPassword']);
    }
  }, [step, formData, setValue, clearErrors]);

  const onSubmitStep1 = async (data) => {
    try {
      const isValid = await trigger(['email', 'phone', 'password', 'confirmPassword']);
      if (!isValid) return;

      setFormData(prevData => ({ ...prevData, ...data })); 
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during registration');
    }
  };

  const onSubmitStep2 = async (data) => {
    try {
      setLoading(true);
      setError('');
      await fetchCsrfToken();
      const registrationData = {
        ...formData, 
        phone_no: formData.phone, 
        password2: formData.confirmPassword, 
        first_name: data.firstName,
        last_name: data.lastName,
        society_name: data.societyName,
        county: data.county,
        sub_county: data.subCounty,
      };

      setFormData(prevData => ({
        ...prevData,
        firstName: data.firstName,
        lastName: data.lastName,
        societyName: data.societyName,
        county: data.county,
        subCounty: data.subCounty,
      }));
      
      const response = await axiosInstance.post('/societies/register/', registrationData);
      
      // Redirect to activation page
      navigate('/activation', { 
        state: { 
          email: registrationData.email,
          firstName: data.firstName,
          lastName: data.lastName
        }
      });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.redirect === '/activation') {
        showToast('The provided contact information is already associated with another account.', "error");
        navigate('/activation', {
          state: {
            email: err.response.data.email,
            firstName: err.response.data.firstName,
            lastName: err.response.data.lastName
          }
        });
      } else if (err.response?.data) {
        const errorData = err.response.data;
        let messages = [];
        if (typeof errorData === 'string') {
          messages = [errorData];
        } else {
          Object.values(errorData).forEach(val => {
            if (Array.isArray(val)) {
              messages = messages.concat(val);
            } else if (typeof val === 'string') {
              messages.push(val);
            }
          });
        }
        messages.forEach(msg => showToast(msg, "error"));
      } else {
        showToast('An error occurred during registration', "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form className="mt-6 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmitStep1)}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Phone Number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm pr-10"
                    placeholder="Password"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === watch('password') || 'Passwords do not match'
                    })}
                    className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm pr-10"
                    placeholder="Confirm Password"
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          </form>
        );
      case 2:
        return (
          <form className="mt-6 space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmitStep2)}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="firstName" className="sr-only">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required'
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="First Name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required'
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Last Name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="societyName" className="sr-only">Society Name</label>
                <input
                  id="societyName"
                  type="text"
                  {...register('societyName', {
                    required: 'Society name is required'
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Society Name"
                />
                {errors.societyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.societyName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="county" className="sr-only">County</label>
                <input
                  id="county"
                  type="text"
                  {...register('county', {
                    required: 'County is required'
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="County"
                />
                {errors.county && (
                  <p className="mt-1 text-sm text-red-600">{errors.county.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="subCounty" className="sr-only">Sub County</label>
                <input
                  id="subCounty"
                  type="text"
                  {...register('subCounty', {
                    required: 'Sub county is required'
                  })}
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  placeholder="Sub County"
                />
                {errors.subCounty && (
                  <p className="mt-1 text-sm text-red-600">{errors.subCounty.message}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  // Capture current Step 2 data before going back
                  const currentStep2Data = getValues(['firstName', 'lastName', 'societyName', 'county', 'subCounty']);
                  setFormData(prevData => ({ ...prevData, ...currentStep2Data }));
                  setStep(1);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-amber-50">
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center items-center justify-center p-8 relative"
        style={{ backgroundImage: `url(${coffeeImage})` }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative text-white text-center p-4">
          <h3 className="text-3xl font-bold mb-4 drop-shadow-md">Join Our Coffee Community</h3>
          <p className="text-lg drop-shadow-md">Register today to streamline your coffee movement permits and grow your business.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-4 sm:p-6">
      <div className="flex items-center mb-6 sm:mb-8">
          <GiCoffeeBeans className="h-8 w-8 text-amber-800 flex-shrink-0" />
        <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-800">Coffee Movement Permit</span>
      </div>

        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md border border-amber-200">
        <div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Create a New Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Step {step} of 2
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
              <div className={`w-1/2 h-2 ${step >= 1 ? 'bg-amber-700' : 'bg-gray-200'} rounded-l-full`}></div>
              <div className={`w-1/2 h-2 ${step >= 2 ? 'bg-amber-700' : 'bg-gray-200'} rounded-r-full`}></div>
            </div>
        </div>

        {renderStep()}

  
        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
            <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">
            Sign in
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;