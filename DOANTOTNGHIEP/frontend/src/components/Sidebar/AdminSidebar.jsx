import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  GraduationCap,
  LayoutList,
  LogOut,
  Lock,
} from "lucide-react";
import { AuthContext } from "@/context/authContext";
import ChangePasswordModal from "../UserManagement/Admin/ChangePasswordModal"; // Import Modal vừa tạo

const SidebarItem = ({ icon, text, to, isOpen }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center p-3 rounded-lg cursor-pointer transition-colors
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-slate-800 hover:text-white"
        }
      `}
    >
      {icon}
      <span
        className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isOpen ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        {text}
      </span>
    </NavLink>
  </li>
);

const AdminSidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-10`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          {isSidebarOpen ? (
            <span className="text-xl font-bold text-blue-400">
              EduCenter Admin
            </span>
          ) : (
            <span className="font-bold text-xl">EA</span>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2 px-3">
            <SidebarItem
              to="/admin/dashboard"
              icon={<BookOpen size={20} />}
              text="Tổng quan"
              isOpen={isSidebarOpen}
            />

            <SidebarItem
              to="/admin/manage-courses"
              icon={<LayoutList size={20} />}
              text="Danh sách Khóa học"
              isOpen={isSidebarOpen}
            />

            <SidebarItem
              to="/admin/manage-teachers"
              icon={<GraduationCap size={20} />}
              text="Giảng viên"
              isOpen={isSidebarOpen}
            />

            <SidebarItem
              to="/admin/manage-students"
              icon={<Users size={20} />}
              text="Học viên"
              isOpen={isSidebarOpen}
            />

            <SidebarItem
              to="/admin/tuition"
              icon={<DollarSign size={20} />}
              text="Học phí"
              isOpen={isSidebarOpen}
            />

            <SidebarItem
              to="/admin/schedule"
              icon={<Calendar size={20} />}
              text="Lịch dạy"
              isOpen={isSidebarOpen}
            />
          </ul>
        </nav>

        {/* Footer Actions: Đổi mật khẩu & Đăng xuất */}
        <div className="p-3 border-t border-slate-700 space-y-1">
          {/* Nút Đổi mật khẩu */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className={`
              flex items-center w-full p-3 rounded-lg transition-all duration-200 group
              text-slate-400 hover:text-white hover:bg-slate-800
            `}
          >
            <Lock
              size={20}
              className="text-slate-400 group-hover:text-white transition-colors"
            />
            <span
              className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
                isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              Đổi mật khẩu
            </span>
          </button>

          {/* Nút Đăng xuất */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full p-3 rounded-lg transition-all duration-200 group
              text-slate-400 hover:text-white hover:bg-red-600
            `}
          >
            <LogOut
              size={20}
              className="text-slate-400 group-hover:text-white transition-colors"
            />
            <span
              className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
                isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default AdminSidebar;
