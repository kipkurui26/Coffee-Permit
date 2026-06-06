import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GiCoffeeBeans } from 'react-icons/gi';

const Activation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, firstName, lastName } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Handler for cancel application
  const handleCancel = () => {
    // TODO: Optionally call an API to cancel the application here
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-4 sm:p-6">
      <div className="flex items-center mb-6 sm:mb-8">
        <GiCoffeeBeans className="h-8 w-8 text-amber-700 flex-shrink-0" />
        <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-800">Coffee Movement Permit</span>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md border border-amber-200">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Registration Confirmation
          </h2>
          
          <div className="text-left space-y-4">
            <p className="text-gray-700">
              Dear Applicant, 
            </p>
            
            <p className="text-gray-700">
              Your society registration has been successfully received and is currently under review.
            </p>
            
            <p className="text-gray-700">
              You will receive an email notification at <span className="font-semibold">{email}</span> once your registration has been processed. Please check your inbox regularly for updates.
            </p>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-gray-700">
                Best regards,<br />
                <span className="font-semibold">Muranga County Government</span><br />
                <span className="text-sm text-gray-600">Director of Coffee</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 border border-amber-300 text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Activation;