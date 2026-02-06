import { createContext, useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // --- 1. LOGIN ---
  const login = async (inputs) => {
    try {
      const res = await api.post("/auth/login", inputs);
      const userInfor = res.data.user || res.data;

      setCurrentUser(userInfor);
      localStorage.setItem("user", JSON.stringify(userInfor));

      return userInfor;
    } catch (err) {
      throw err;
    }
  };

  // --- 2. LOGOUT ---
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem("user");
      Cookies.remove("token");
      window.location.href = "/login";
    }
  };

  // --- 3. UPDATE USER (Dùng cho Profile Page) ---
  const updateUser = (data) => {
    const updatedUser = { ...currentUser, ...data };

    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  useEffect(() => {
    const checkLogin = async () => {
      const currentPath = window.location.pathname;
      if (["/login", "/register", "/"].includes(currentPath)) return;

      if (!currentUser) return;

      try {
        await api.get("/auth/check");
      } catch (err) {
        console.log("Phiên đăng nhập hết hạn hoặc Token không hợp lệ.");
        setCurrentUser(null);
        localStorage.removeItem("user");
        Cookies.remove("token");
        window.location.href = "/login";
      }
    };

    checkLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        updateUser,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
