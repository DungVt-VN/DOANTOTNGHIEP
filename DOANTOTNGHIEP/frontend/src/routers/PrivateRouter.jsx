import React, { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";

const PrivateRouter = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  if (currentUser.Role === "Admin") {
    return <Navigate to="/admin/dashboard" />;
  }
  if (currentUser.Role === "Teacher") {
    return <Navigate to="/teacher/dashboard" />;
  }
  return <Outlet />;
};

export default PrivateRouter;
