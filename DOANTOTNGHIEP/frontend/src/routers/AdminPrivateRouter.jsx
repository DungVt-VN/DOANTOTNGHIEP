import React, { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom"; // Import thêm Navigate
import { AuthContext } from "../context/authContext";
import PageNotFound from "../pages/NotFounds/PageNotFound";

const AdminPrivateRouter = () => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.Role === "Admin") {
    return <Outlet />;
  }

  return <PageNotFound />;
};

export default AdminPrivateRouter;
