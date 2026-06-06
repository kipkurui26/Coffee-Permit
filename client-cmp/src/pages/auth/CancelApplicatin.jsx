import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance, { fetchCsrfToken } from "../../utils/AxiosInstance";
import { useToast } from "../../context/ToastContext";
import { GiCoffeeBeans } from 'react-icons/gi';
import coffeeImage from '../../assets/coffee.jpg';

const CancelApplication = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");
  const { showToast } = useToast();

  const handleCancel = async () => {
    setStatus("loading");
    try {
      await fetchCsrfToken();
      await axiosInstance.post(`/societies/cancel-application/${token}/`);
      setStatus("success");
      setMessage("Society Registration successfully canceled");
    } catch (err) {
      setStatus("error");
      if (err.response && err.response.data && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage("An error occurred. Please try again later.");
      }
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
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 text-center">Cancel Application</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">Are you sure you want to cancel your permit application?</p>
          </div>
          {status === "idle" && (
            <div className="mt-6 flex flex-col items-center space-y-4">
              <button
                onClick={handleCancel}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 cursor-pointer"
              >
                Yes, Cancel Application
              </button>
              <Link to="/login" className="text-amber-700 hover:text-amber-600 text-sm font-medium">Back to Login</Link>
            </div>
          )}
          {status === "loading" && <p className="text-center mt-6 text-gray-700">Processing your request...</p>}
          {status !== "idle" && status !== "loading" && (
            <div className="text-center mt-6">
              <p className={status === "success" ? "text-green-700 font-medium mb-4" : "text-red-700 font-medium mb-4"}>{message}</p>
              <Link to="/login" className="font-medium text-amber-700 hover:text-amber-600">Back to Login</Link>
            </div>
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
          <h3 className="text-3xl font-bold mb-4 drop-shadow-md">Manage Your Application</h3>
          <p className="text-lg drop-shadow-md">You can cancel your application if you no longer wish to proceed.</p>
        </div>
      </div>
    </div>
  );
};

export default CancelApplication;
