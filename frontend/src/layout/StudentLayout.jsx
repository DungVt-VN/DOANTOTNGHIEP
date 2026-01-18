import React, { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import StudentHeader from "@/components/Header/StudentHeader";
import StudentSidebar from "@/components/Sidebar/StudentSidebar";

const { Content } = Layout;

const StudentLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <StudentSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <StudentHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        <div>{children}</div>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
