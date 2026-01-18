import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Database,
  Library,
  FileQuestion,
  Bell,
  ChevronLeft,
} from "lucide-react";
import { AuthContext } from "@/context/authContext";
import TeacherProfileModal from "../UserManagement/User/TeacherProfileModal";

// --- COMPONENT ITEM CON ---
const SidebarItem = ({ icon, text, to, isActive, badge, isCollapsed }) => (
  <li>
    <NavLink
      to={to}
      className={`
        flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group relative
        ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-900/50 font-bold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
        }
        ${isCollapsed ? "justify-center" : "justify-between"} 
      `}
      title={isCollapsed ? text : ""}
    >
      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}
      >
        <span
          className={`${
            isActive ? "text-white" : "text-slate-400 group-hover:text-white"
          }`}
        >
          {icon}
        </span>

        {!isCollapsed && (
          <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300">
            {text}
          </span>
        )}
      </div>

      {badge && (
        <span
          className={`
            bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm
            ${isCollapsed ? "absolute top-2 right-2 w-2 h-2 p-0" : ""} 
          `}
        >
          {!isCollapsed && badge}
        </span>
      )}
    </NavLink>
  </li>
);

// --- COMPONENT TIÊU ĐỀ NHÓM ---
const SidebarSection = ({ title, isCollapsed }) => {
  if (isCollapsed)
    return <div className="my-4 border-t border-slate-700 mx-4"></div>;

  return (
    <div className="mt-4 mb-2 px-3 transition-opacity duration-300">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
        {title}
      </span>
    </div>
  );
};

const TeacherSidebar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. KHỞI TẠO STATE DỰA TRÊN KÍCH THƯỚC BAN ĐẦU
  // Để tránh bị "nhảy" giao diện khi vừa F5 trang
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);

  // 2. LOGIC TỰ ĐỘNG THU VÀO / MỞ RA
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Nếu màn hình nhỏ hơn 1024px -> Thu gọn
        setIsCollapsed(true);
      } else {
        // Nếu màn hình lớn hơn hoặc bằng 1024px -> Mở rộng
        setIsCollapsed(false);
      }
    };

    // Lắng nghe sự kiện resize
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkActive = (linkRoute) => {
    if (linkRoute === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(linkRoute);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <aside
        className={`
          bg-slate-900 text-white h-screen flex flex-col shadow-xl sticky top-0 z-50 font-sans 
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"} 
        `}
      >
        {/* --- HEADER --- */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-950/50 relative">
          <div
            className={`flex items-center gap-2 select-none overflow-hidden transition-all duration-300 ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/30 flex-shrink-0">
              <LayoutDashboard size={20} className="text-white" />
            </div>

            {!isCollapsed && (
              <span className="text-xl font-bold text-white tracking-wide whitespace-nowrap opacity-100 transition-opacity duration-300">
                Edu<span className="text-blue-400">Teacher</span>
              </span>
            )}
          </div>

          {/* Nút Toggle thủ công (Vẫn giữ để người dùng thích thì bấm) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              absolute -right-3 top-1/2 -translate-y-1/2 
              bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full shadow-lg border border-slate-800
              transition-transform duration-300 z-50
              ${isCollapsed ? "rotate-180" : "rotate-0"}
            `}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* --- NAVIGATION LIST --- */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <ul className="space-y-1">
            <SidebarItem
              to="/teacher/dashboard"
              text="Tổng quan"
              icon={<LayoutDashboard size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/dashboard")}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              to="/teacher/notifications"
              text="Thông báo"
              icon={<Bell size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/notifications")}
              isCollapsed={isCollapsed}
            />

            <SidebarSection title="Giảng dạy" isCollapsed={isCollapsed} />

            <SidebarItem
              to="/teacher/schedule"
              text="Lịch dạy"
              icon={<Calendar size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/schedule")}
              isCollapsed={isCollapsed}
            />

            <SidebarItem
              to="/teacher/course"
              text="Khóa học"
              icon={<BookOpen size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/course")}
              isCollapsed={isCollapsed}
            />

            <SidebarSection title="Kho tài nguyên" isCollapsed={isCollapsed} />

            <SidebarItem
              to="/teacher/question-bank"
              text="Ngân hàng câu hỏi"
              icon={<Database size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/question-bank")}
              isCollapsed={isCollapsed}
            />

            <SidebarItem
              to="/teacher/materials"
              text="Kho học liệu"
              icon={<Library size={20} strokeWidth={2} />}
              isActive={checkActive("/teacher/materials")}
              isCollapsed={isCollapsed}
            />
          </ul>
        </nav>

        {/* --- FOOTER --- */}
        <div className="border-t border-slate-800 bg-slate-950/50 p-4">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "flex-col justify-center" : "justify-between"
            }`}
          >
            <div
              onClick={() => setIsProfileOpen(true)}
              className={`flex items-center gap-3 cursor-pointer group select-none ${
                isCollapsed ? "justify-center" : "flex-1 min-w-0"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-slate-800 group-hover:ring-indigo-500 transition-all duration-300">
                  {currentUser?.FullName?.charAt(0) || "T"}
                </div>
                {!isCollapsed && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden transition-all duration-300 group-hover:translate-x-1">
                  <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">
                    {currentUser?.FullName || "Giáo viên"}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate group-hover:text-indigo-400">
                    {currentUser?.Email || "teacher@edu.com"}
                  </span>
                </div>
              )}
            </div>

            <div
              className={`${
                isCollapsed
                  ? "w-full border-t border-slate-800 pt-2 mt-1 flex justify-center"
                  : "border-l border-slate-700 pl-3"
              }`}
            >
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200 group/logout"
                title="Đăng xuất"
              >
                <LogOut
                  size={20}
                  strokeWidth={2}
                  className="group-hover/logout:-translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <TeacherProfileModal
        open={isProfileOpen}
        teacherId={currentUser?.TeacherId}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default TeacherSidebar;
