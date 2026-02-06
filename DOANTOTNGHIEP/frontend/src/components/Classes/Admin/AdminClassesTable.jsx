import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Space, Popconfirm, message, Tooltip } from "antd";
import { Edit, Trash2, Eye, Plus, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";

const AdminClassesTable = ({ isDashboard = false }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- 1. Fetch Dữ liệu ---
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const endpoint = isDashboard
        ? "/classes/recruiting"
        : "/classes/all-classes";

      const res = await api.get(endpoint);
      setClasses(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách lớp:", error);
      if (!isDashboard) message.error("Không thể tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [isDashboard]);

  // --- 2. Xử lý Xóa ---
  const handleDelete = async (classId) => {
    try {
      await api.delete(`/classes/${classId}`);
      message.success("Đã xóa lớp học thành công");
      fetchClasses();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi xóa lớp học");
    }
  };

  // --- 3. Helper Format ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "Recruiting":
        return <Tag color="cyan">Đang tuyển sinh</Tag>;
      case "Active":
        return <Tag color="blue">Đang hoạt động</Tag>;
      case "Upcoming":
        return <Tag color="orange">Sắp khai giảng</Tag>;
      case "Finished":
        return <Tag color="green">Đã kết thúc</Tag>;
      case "Cancelled":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // --- 4. Cấu hình Cột ---
  const columns = [
    {
      title: "Tên lớp",
      dataIndex: "ClassName",
      key: "ClassName",
      render: (text, record) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-500">
            {record.Days} ({record.StartTime?.slice(0, 5)} -{" "}
            {record.EndTime?.slice(0, 5)})
          </div>
        </div>
      ),
    },
    {
      title: "Giảng viên",
      dataIndex: "TeacherName",
      key: "TeacherName",
      responsive: ["md"],
      render: (text) => (
        <span className="text-gray-600">{text || "Chưa phân công"}</span>
      ),
    },
    {
      title: "Sĩ số",
      key: "students",
      width: 100,
      render: (_, record) => {
        const current = record.CurrentStudents || 0;
        const max = record.MaxStudents;
        const isFull = current >= max;
        return (
          <span
            className={`font-medium ${
              isFull ? "text-red-600" : "text-gray-600"
            }`}
          >
            {current}/{max}
          </span>
        );
      },
    },
    {
      title: "Học phí",
      dataIndex: "TuitionFee",
      key: "TuitionFee",
      responsive: ["lg"],
      render: (fee) => (
        <span className="text-gray-600">{formatCurrency(fee)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm ${isDashboard ? "" : "p-6"}`}
    >
      {/* --- PHẦN TITLE & HEADER --- */}
      <div className="flex justify-between items-center mb-4 px-4 pt-4 md:px-0 md:pt-0">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          {/* Icon thay đổi tùy ngữ cảnh */}
          {isDashboard ? (
            <ListChecks size={20} className="text-blue-600" />
          ) : null}
          {isDashboard ? "Lớp đang tuyển sinh" : "Quản lý lớp học"}
        </h2>

        {!isDashboard && (
          <Button
            type="primary"
            className="bg-blue-600 hover:bg-blue-700"
            icon={<Plus size={18} />}
            onClick={() => navigate("/admin/classes/new")}
          >
            Thêm lớp mới
          </Button>
        )}
      </div>

      {/* --- PHẦN TABLE --- */}
      <Table
        columns={columns}
        dataSource={classes}
        rowKey="ClassId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: false, // Ẩn nút chọn số lượng/trang cho gọn
          size: isDashboard ? "small" : "default", // Dashboard dùng phân trang nhỏ
        }}
        locale={{ emptyText: "Chưa có lớp học nào" }}
        scroll={{ x: 800 }}
        size={isDashboard ? "middle" : "large"}
      />

      {/* Nút Xem tất cả cho Dashboard */}
      {isDashboard && classes.length > 10 && (
        <div className="text-center mt-2 border-t pt-2 border-gray-100 pb-2">
          <Button type="link" onClick={() => navigate("/admin/classes")}>
            Xem toàn bộ danh sách
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminClassesTable;
