import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";
import { showGlobalToast as exportedShowGlobalToast } from '../utils/AxiosInstance';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    message: "",
    isVisible: false,
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, isVisible: true, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Set global toast function for use outside React
  React.useEffect(() => {
    window.showGlobalToast = showToast;
    return () => {
      window.showGlobalToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        type={toast.type}
      />
    </ToastContext.Provider>
  );
};
