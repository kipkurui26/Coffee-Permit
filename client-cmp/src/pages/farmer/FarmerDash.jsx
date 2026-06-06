import React, {useState} from "react";
import Navbar from "../../components/common/Navbar";
import Sidebar from "../../components/common/Sidebar";
import { Outlet } from "react-router-dom";
import DashboardOverview from "./dashboard/DashboardOverview";
import PermitList from "./dashboard/PermitList";

const FarmerDash = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
              {/* <DashboardOverview/> */}
              
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FarmerDash;
