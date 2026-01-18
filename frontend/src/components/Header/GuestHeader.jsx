import React, { useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";

// --- Logic & Context ---
import { isTokenValid } from "@/js/Helper";
import { AuthContext } from "@/context/authContext";

// --- Material UI Components ---
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";

// --- Icons ---
import SchoolIcon from "@mui/icons-material/School";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Logout from "@mui/icons-material/Logout";
import Person from "@mui/icons-material/Person";
import Settings from "@mui/icons-material/Settings";

// --- Styled Components (Giữ nguyên) ---
const Container = styled.div`
  /* Container cho menu */
`;

const SlickBar = styled.ul`
  color: var(--white);
  display: flex;
  flex-direction: row;
  background-color: var(--white);
  align-items: center;
  height: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Item = styled(NavLink)`
  color: var(--black);
  cursor: pointer;
  display: flex;
  padding: 1rem 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: rgb(147 51 234);
    border-bottom: 2px solid rgb(209 213 219);
  }

  &.active {
    border-bottom: 2px solid rgb(37 99 235);
    color: rgb(147 51 234);
  }
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #2563eb;
  gap: 8px;

  &:hover {
    opacity: 0.9;
  }
`;

const BrandName = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: -webkit-linear-gradient(45deg, #2563eb, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const GuestHeader = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // State cho Menu Dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Kiểm tra điều kiện đăng nhập hợp lệ
  const isLoggedIn = currentUser && isTokenValid();

  // Xử lý mở menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Xử lý đóng menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Xử lý Logout
  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/");
  };

  // Xử lý chuyển trang Profile
  const handleProfile = () => {
    handleClose();
    navigate("/profile"); 
  };

  return (
    <div className="navbar mx-10 shadow-sm">
      <div className="navbar-container flex justify-between items-center h-16">
        {/* LOGO */}
        <div className="logo">
          <LogoContainer to="/">
            <SchoolIcon sx={{ fontSize: 32, color: "#2563eb" }} />
            <BrandName>EduCenter</BrandName>
          </LogoContainer>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex items-center">
          <Container className="hidden md:block">
            <SlickBar>
              <Item
                to="/"
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="mx-2">Trang chủ</span>
              </Item>

              <Item
                to="/courses"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="mx-2">Khóa học</span>
              </Item>
              <Item
                to="/contact"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="mx-2">Liên hệ</span>
              </Item>
            </SlickBar>
          </Container>

          {/* RIGHT SIDE CONTENT (CONDITIONAL RENDERING) */}
          <div className="content ml-8 flex items-center gap-3">
            {isLoggedIn ? (
              // --- TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP ---
              <>
                {/* Chuông thông báo */}
                <IconButton size="large" aria-label="show new notifications">
                  <Badge badgeContent={4} color="error">
                    <NotificationsIcon sx={{ color: "#64748b" }} />
                  </Badge>
                </IconButton>

                {/* Avatar & Dropdown Trigger */}
                <Tooltip title="Tài khoản">
                  <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{ ml: 1 }}
                    aria-controls={open ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                  >
                    <Avatar
                      sx={{ width: 40, height: 40, bgcolor: "#2563eb" }}
                      src={currentUser?.img || ""} // Nếu có ảnh thì hiện, không thì hiện chữ cái đầu
                      alt={currentUser?.UserName}
                    >
                      {/* Fallback: Chữ cái đầu của tên */}
                      {currentUser?.UserName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Dropdown Menu */}
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={open}
                  onClose={handleClose}
                  onClick={handleClose}
                  disableScrollLock={true}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                      mt: 1.5,
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem onClick={handleProfile}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    Thông tin cá nhân
                  </MenuItem>

                  <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    Cài đặt
                  </MenuItem>

                  <Divider />

                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Đăng xuất
                  </MenuItem>
                </Menu>
              </>
            ) : (
              // --- TRƯỜNG HỢP CHƯA ĐĂNG NHẬP (GUEST) ---
              <>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "#2563eb",
                      color: "#2563eb",
                      "&:hover": {
                        borderColor: "#1d4ed8",
                        backgroundColor: "#eff6ff",
                      },
                    }}
                  >
                    Đăng nhập
                  </Button>
                </Link>

                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#2563eb",
                      "&:hover": {
                        backgroundColor: "#1d4ed8",
                      },
                    }}
                  >
                    Đăng ký ngay
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestHeader;
