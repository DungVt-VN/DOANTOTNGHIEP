import React, { useContext } from "react";
import { Menu } from "lucide-react"; // Giữ icon Menu của Lucide cho nút toggle sidebar
import { AuthContext } from "@/context/authContext"; // Import context để lấy thông tin Admin

// --- Material UI Components ---
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";

// --- Material UI Icons ---
import NotificationsIcon from "@mui/icons-material/Notifications";

const AdminHeader = ({ isSidebarOpen, setSidebarOpen }) => {
  const { currentUser } = useContext(AuthContext);

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-10 sticky top-0 z-20">
      {/* 1. Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* 2. Right Side Content */}
      <div className="flex items-center gap-2">
        {/* --- Notifications (Material UI) --- */}
        <Tooltip title="Thông báo">
          <IconButton size="large" aria-label="show new notifications">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon sx={{ color: "#64748b" }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* --- User Avatar (Material UI - No Dropdown) --- */}
        <Tooltip title={currentUser?.UserName || "Admin Account"}>
          <div className="ml-2 cursor-default">
            {" "}
            {/* Bọc div để tránh lỗi ref của Tooltip nếu không dùng IconButton */}
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#2563eb", // Màu xanh chủ đạo
                cursor: "pointer",
              }}
              src={currentUser?.img || ""}
              alt={currentUser?.UserName}
            >
              {/* Fallback: Chữ cái đầu của tên */}
              {currentUser?.UserName?.charAt(0)?.toUpperCase() || "A"}
            </Avatar>
          </div>
        </Tooltip>

        {/* Hiển thị tên Admin bên cạnh (Tùy chọn, cho rõ ràng hơn) */}
        <div className="hidden md:block ml-2 text-sm font-medium text-gray-700">
          {currentUser?.UserName || "Administrator"}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
