import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/common/Navbar";
import Sidebar from "../../components/common/Sidebar";

const AdminDash = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure user is admin
    if (user?.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [user, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} />

        <main className={"flex-1 pt-16 overflow-y-auto"}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDash;
