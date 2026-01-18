import React from "react";
import { Layout, Menu, theme, Button, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CreditCard,
  User,
  LogOut,
  GraduationCap,
  Library,
} from "lucide-react";

const { Sider } = Layout;
const { Text } = Typography;

const StudentSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, colorPrimary, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/student/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Tổng quan",
    },
    {
      key: "/student/register-class",
      icon: <Library size={20} />,
      label: "Đăng ký khóa học", 
    },
    {
      key: "/student/classes",
      icon: <BookOpen size={20} />,
      label: "Lớp học của tôi",
    },
    {
      key: "/student/schedule",
      icon: <CalendarDays size={20} />,
      label: "Thời khóa biểu",
    },
    {
      key: "/student/tuition",
      icon: <CreditCard size={20} />,
      label: "Tra cứu học phí",
    },
    {
      key: "/student/profile",
      icon: <User size={20} />,
      label: "Hồ sơ cá nhân",
    },
  ];

  const getActiveKey = () => {
    const path = location.pathname;
    if (path.startsWith("/student/class")) return "/student/classes";
    return path;
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      breakpoint="lg" // Tự động thu gọn khi màn hình < 992px
      collapsedWidth="80" // Thu về dạng icon
      onBreakpoint={(broken) => {
        // Đồng bộ trạng thái với cha khi breakpoint kích hoạt
        setCollapsed(broken);
      }}
      width={260}
      style={{
        background: colorBgContainer,
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: "1px 0 5px rgba(0,0,0,0.03)", // Shadow nhẹ thay vì border cứng
        borderRight: "none",
      }}
    >
      {/* --- 1. BRAND LOGO AREA --- */}
      <div
        className="h-20 flex items-center justify-center mb-4 transition-all duration-300"
        style={{
          borderBottom: `1px dashed ${
            theme.useToken().token.colorBorderSecondary
          }`,
        }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/student/dashboard")}
        >
          {/* Logo Icon Wrapper */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${colorPrimary}, #3b82f6)`,
            }}
          >
            <GraduationCap className="text-white" size={24} />
          </div>

          {/* Logo Text - Hide when collapsed */}
          <div
            className={`flex flex-col transition-opacity duration-200 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            }`}
          >
            <span className="font-bold text-lg leading-tight text-slate-800 tracking-tight">
              EduCenter
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: colorPrimary }}
            >
              Portal
            </span>
          </div>
        </div>
      </div>

      {/* --- 2. MENU ITEMS --- */}
      <div className="flex flex-col justify-between h-[calc(100vh-100px)] px-3 pb-6">
        <Menu
          mode="inline"
          selectedKeys={[getActiveKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="custom-sidebar-menu border-none"
          style={{ background: "transparent" }}
        />

        {/* --- 3. FOOTER LOGOUT --- */}
        <div>
          <div
            className={`px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-opacity duration-300 ${
              collapsed ? "opacity-0 h-0" : "opacity-100"
            }`}
          >
            Hệ thống
          </div>

          <Button
            type="text"
            danger
            block
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="flex items-center justify-start h-11 rounded-xl hover:bg-red-50 transition-all duration-300 group"
            style={{ paddingLeft: collapsed ? 12 : 16 }}
          >
            <LogOut
              size={20}
              className={`transition-transform duration-300 ${
                !collapsed ? "mr-3 group-hover:-translate-x-1" : "mx-auto"
              }`}
            />

            <span
              className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              Đăng xuất
            </span>
          </Button>
        </div>
      </div>

      {/* CSS Injection: Modern Pill Shape Menu */}
      <style jsx="true">{`
        .custom-sidebar-menu .ant-menu-item {
          border-radius: ${borderRadiusLG}px;
          margin-bottom: 8px;
          height: 48px;
          display: flex;
          align-items: center;
          color: #64748b; /* Slate 500 */
          transition: all 0.2s ease;
        }

        /* Hover Effect */
        .custom-sidebar-menu .ant-menu-item:hover {
          color: ${colorPrimary} !important;
          background-color: #f1f5f9 !important; /* Slate 100 */
        }

        /* Active State */
        .custom-sidebar-menu .ant-menu-item-selected {
          background-color: ${colorPrimary}15 !important; /* Primary color with 15% opacity */
          color: ${colorPrimary} !important;
          font-weight: 600;
        }

        /* Icon adjustment inside menu */
        .custom-sidebar-menu .ant-menu-item .ant-menu-item-icon {
          font-size: 20px !important;
        }
      `}</style>
    </Sider>
  );
};

export default StudentSidebar;
