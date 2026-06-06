import React from "react";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="pt-16 lg:pl-64 transition-all duration-200">
        {children}
      </main>
    </div>
  );
};

export default Layout;
