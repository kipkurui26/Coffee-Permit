import React, { useEffect } from 'react';

const typeStyles = {
  success: {
    bg: "bg-green-100 border-green-500 text-green-700",
    icon: (
      <svg className="h-6 w-6 text-green-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: "Success"
  },
  error: {
    bg: "bg-red-100 border-red-500 text-red-700",
    icon: (
      <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Error"
  },
  info: {
    bg: "bg-blue-100 border-blue-500 text-blue-700",
    icon: (
      <svg className="h-6 w-6 text-blue-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
      </svg>
    ),
    title: "Info"
  }
};

const Toast = ({ message, isVisible, onClose, type = "error" }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const { bg, icon, title } = typeStyles[type] || typeStyles.error;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${bg} border-l-4 p-4 rounded shadow-lg`}>
        <div className="flex items-center">
          <div className="py-1">{icon}</div>
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-sm">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
