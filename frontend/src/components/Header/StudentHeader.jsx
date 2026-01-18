import React, { useContext } from "react";
import {
  Layout,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Tooltip,
  theme,
} from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { Bell, User, LogOut, Lock, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/authContext";

const { Header } = Layout;

const StudentHeader = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext) || {};

  const {
    token: { colorPrimary },
  } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    if (key === "profile") navigate("/student/profile");
    if (key === "logout") {
      if (logout) logout();
      else {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      label: <span className="font-medium">Hồ sơ cá nhân</span>,
      icon: <User size={16} className="text-slate-500" />,
    },
    {
      key: "password",
      label: <span className="font-medium">Đổi mật khẩu</span>,
      icon: <Lock size={16} className="text-slate-500" />,
    },
    { type: "divider" },
    {
      key: "logout",
      label: <span className="font-medium">Đăng xuất</span>,
      icon: <LogOut size={16} />,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        padding: "0 40px 0 24px",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 99,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.03)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        height: 72,
      }}
    >
      {/* --- LEFT: TOGGLE & TITLE --- */}
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          // ClassName: Thêm active:scale-95 để tạo hiệu ứng nhấn thật hơn
          className="flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all rounded-xl active:scale-95"
          style={{
            width: 42,
            height: 42,
            fontSize: 18,
            border: "none", // Loại bỏ viền
            outline: "none", // Loại bỏ outline khi focus
            boxShadow: "none", // Loại bỏ hiệu ứng bóng khi click của Antd
          }}
        />

        {/* Breadcrumb / Title */}
        <div className="hidden md:block h-8 w-[1px] bg-gray-200 mx-2"></div>
      </div>

      {/* --- RIGHT: ACTIONS --- */}
      <Space size={20}>
        {/* 1. NOTIFICATIONS */}
        <Tooltip title="Thông báo">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 cursor-pointer transition-all duration-300 group active:scale-95">
            <Badge count={3} size="small" offset={[2, -2]} color="#ef4444">
              <Bell
                size={22}
                strokeWidth={1.8}
                className="text-slate-500 group-hover:text-blue-600 transition-colors"
              />
            </Badge>
          </div>
        </Tooltip>

        {/* 2. USER PROFILE DROPDOWN */}
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          trigger={["click"]}
          placement="bottomRight"
          arrow={{ pointAtCenter: true }}
        >
          <div className="flex items-center gap-3 pl-2 pr-1 py-1.5 rounded-full cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-300 group select-none active:scale-95">
            {/* User Info Text */}
            <div className="hidden md:flex flex-col items-end leading-tight mr-1">
              <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                {currentUser?.FullName || "Học viên"}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
                {currentUser?.StudentCode || "STUDENT"}
              </span>
            </div>

            {/* Avatar */}
            <Avatar
              size={40}
              src={currentUser?.Avatar}
              className="border-[3px] border-white shadow-sm group-hover:shadow-md transition-all"
              style={{ backgroundColor: colorPrimary }}
              icon={<User size={20} />}
            >
              {currentUser?.FullName?.charAt(0).toUpperCase()}
            </Avatar>

            <ChevronDown
              size={16}
              className="text-slate-300 group-hover:text-slate-500 transition-colors mr-1 hidden sm:block"
            />
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default StudentHeader;
