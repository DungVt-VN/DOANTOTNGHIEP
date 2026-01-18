import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import AdminHeader from "@/components/Header/AdminHeader";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      <AdminSidebar isSidebarOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
          <Outlet />
        </main>

        {isSidebarOpen && window.innerWidth < 768 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
