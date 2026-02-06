import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { Table, Input, Tag, Spin, message, Avatar, Tooltip } from "antd";
import api from "@/utils/axiosInstance";
import { removeVietnameseTones } from "@/js/Helper";

const StudentsTab = ({ classId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho tìm kiếm & phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- 1. FETCH DATA ---
  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await api.get(`/classes/${classId}/students/detail`);
      setStudents(response.data);
    } catch (error) {
      console.error("Lỗi tải danh sách học viên:", error);
      message.error("Không thể tải danh sách học viên.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- 2. FILTER ---
  const filteredStudents = students.filter((s) => {
    const term = removeVietnameseTones(searchTerm.toLowerCase());

    return (
      (s.FullName &&
        removeVietnameseTones(s.FullName.toLowerCase()).includes(term)) ||
      (s.StudentCode &&
        removeVietnameseTones(s.StudentCode.toLowerCase()).includes(term)) ||
      (s.PhoneNo && s.PhoneNo.includes(term)) ||
      (s.Email && removeVietnameseTones(s.Email.toLowerCase()).includes(term))
    );
  });

  // --- 3. CONFIG COLUMNS ---
  const columns = [
    {
      title: "Học viên",
      key: "student",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.Avatar}
            className="bg-blue-100 text-blue-600 border border-blue-200"
            size={40}
          >
            {record.FullName ? record.FullName.charAt(0).toUpperCase() : "U"}
          </Avatar>

          <div>
            <div className="font-semibold text-slate-800">
              {record.FullName}
            </div>
            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-slate-200">
              {record.StudentCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-slate-400" />
            <span className="truncate max-w-[200px]">
              {record.Email || "---"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            {record.PhoneNo || "---"}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "JoinDate",
      key: "JoinDate",
      align: "center",
      width: 150,
      render: (date) => (
        <span className="text-slate-600">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "---"}
        </span>
      ),
    },
    {
      title: "Học phí",
      dataIndex: "IsPaid",
      key: "IsPaid",
      align: "center",
      width: 140,
      render: (isPaid) =>
        isPaid === 1 ? (
          <Tag
            color="success"
            className="flex items-center justify-center gap-1 w-fit mx-auto border-0 bg-green-50 text-green-600"
          >
            <CheckCircle2 size={14} /> Đã đóng
          </Tag>
        ) : (
          <Tag
            color="warning"
            className="flex items-center justify-center gap-1 w-fit mx-auto border-0 bg-orange-50 text-orange-600"
          >
            <AlertCircle size={14} /> Chưa đóng
          </Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "IsLocked",
      key: "IsLocked",
      align: "center",
      width: 140,
      render: (isLocked) =>
        isLocked === 1 ? (
          <Tooltip title="Tài khoản đã bị khóa">
            <Tag
              color="error"
              className="flex items-center justify-center gap-1 w-fit mx-auto"
            >
              <Lock size={12} /> Đã khóa
            </Tag>
          </Tooltip>
        ) : (
          <Tag
            color="blue"
            className="flex items-center justify-center gap-1 w-fit mx-auto"
          >
            <Unlock size={12} /> Hoạt động
          </Tag>
        ),
    },
  ];

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center p-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- STATS SIMPLE --- */}
      <div className="flex gap-4">
        <div className="px-4 py-3 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <User size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">
              Tổng số
            </p>
            <p className="text-lg font-bold text-slate-800">
              {students.length}{" "}
              <span className="text-xs font-normal text-slate-400">
                học viên
              </span>
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-full">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">
              Đã đóng tiền
            </p>
            <p className="text-lg font-bold text-slate-800">
              {students.filter((s) => s.IsPaid === 1).length}{" "}
              <span className="text-xs font-normal text-slate-400">
                học viên
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <h3 className="text-lg font-bold text-slate-800">Danh sách lớp</h3>
          <div className="w-full sm:w-72">
            <Input
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm kiếm học viên..."
              className="rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>
        </div>

        {/* Ant Design Table */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="StudentId" // Sử dụng StudentId từ dữ liệu đầu vào
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredStudents.length,
            onChange: (page) => setCurrentPage(page),
            position: ["bottomRight"],
            showSizeChanger: false,
            className: "px-6 py-4",
          }}
          scroll={{ x: 800 }}
          className="custom-table"
          locale={{
            emptyText: "Chưa có dữ liệu học viên.",
          }}
        />
      </div>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
            background: #f8fafc;
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default StudentsTab;
