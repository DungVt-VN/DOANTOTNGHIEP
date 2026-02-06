import React, { useState } from "react";
import {
  Search,
  UserCheck,
  UserX,
  User,
  Mail,
  Phone,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { Table, Input, Button, Pagination, Tooltip, Tag } from "antd";

// --- MOCK DATA (Dữ liệu giả lập) ---
const MOCK_STUDENTS = [
  {
    id: 1,
    code: "HV001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    phone: "0901234567",
    joinDate: "2023-09-01",
    status: "active",
    avatar: null,
  },
  {
    id: 2,
    code: "HV002",
    name: "Trần Thị Bích",
    email: "bich.tran@example.com",
    phone: "0912345678",
    joinDate: "2023-09-05",
    status: "active",
    avatar: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: 3,
    code: "HV003",
    name: "Lê Hoàng Nam",
    email: "nam.le@example.com",
    phone: "0987654321",
    joinDate: "2023-10-12",
    status: "reserved",
    avatar: null,
  },
  {
    id: 4,
    code: "HV004",
    name: "Phạm Minh Tuấn",
    email: "tuan.pham@example.com",
    phone: "0933445566",
    joinDate: "2023-08-20",
    status: "dropout",
    avatar: null,
  },
  // Thêm dữ liệu để test phân trang
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: i + 5,
    code: `HV00${i + 5}`,
    name: `Học Viên Mẫu ${i + 1}`,
    email: `student${i + 1}@example.com`,
    phone: `09000000${i}`,
    joinDate: "2023-11-01",
    status: i % 3 === 0 ? "active" : i % 3 === 1 ? "reserved" : "dropout",
    avatar: null,
  })),
];

// --- HELPER: Status Badge ---
const StudentStatusBadge = ({ status }) => {
  let color = "default";
  let text = "Không xác định";
  let icon = <User size={12} />;

  switch (status) {
    case "active":
      color = "success";
      text = "Đang học";
      icon = <UserCheck size={12} />;
      break;
    case "reserved":
      color = "warning";
      text = "Bảo lưu";
      icon = <User size={12} />;
      break;
    case "dropout":
      color = "default";
      text = "Đã nghỉ";
      icon = <UserX size={12} />;
      break;
    default:
      break;
  }

  return (
    <Tag
      icon={icon}
      color={color}
      className="flex items-center gap-1 w-fit m-0"
    >
      {text}
    </Tag>
  );
};

const StudentsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Lọc học viên
  const filteredStudents = MOCK_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  // Cấu hình cột cho Antd Table
  const columns = [
    {
      title: "Học viên",
      key: "student",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0 overflow-hidden text-sm">
            {record.avatar ? (
              <img
                src={record.avatar}
                alt={record.name}
                className="w-full h-full object-cover"
              />
            ) : (
              record.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{record.name}</div>
            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit">
              {record.code}
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
            {record.email}
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày nhập học",
      dataIndex: "joinDate",
      key: "joinDate",
      align: "center",
      render: (date) => (
        <span className="text-slate-600">
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => <StudentStatusBadge status={status} />,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: () => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Pencil size={16} />}
              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              icon={<Trash2 size={16} />}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            />
          </Tooltip>
          <Tooltip title="Khác">
            <Button
              type="text"
              icon={<MoreVertical size={16} />}
              className="text-slate-400 hover:text-slate-700"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- 1. STATS HEADER --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Tổng học viên
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {MOCK_STUDENTS.length}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <User size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Đang theo học
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {MOCK_STUDENTS.filter((s) => s.status === "active").length}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Bảo lưu / Nghỉ
            </p>
            <h3 className="text-2xl font-bold text-slate-600">
              {MOCK_STUDENTS.filter((s) => s.status !== "active").length}
            </h3>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
            <UserX size={20} />
          </div>
        </div>
      </div>

      {/* --- 2. MAIN CONTENT (TOOLBAR & TABLE) --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar Header (Đồng bộ style) */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách học viên
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
              {filteredStudents.length}
            </span>
          </div>

          <div className="w-64">
            <Input
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm kiếm..."
              className="rounded-lg bg-slate-50 border-slate-200 hover:bg-white focus:bg-white transition-all"
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
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredStudents.length,
            onChange: (page) => setCurrentPage(page),
            position: ["bottomRight"],
            showSizeChanger: false,
            className: "px-6 py-4", // Padding cho pagination
          }}
          scroll={{ x: 800 }}
          className="custom-table"
        />
      </div>

      {/* CSS tùy chỉnh nhỏ để Table đẹp hơn nếu cần */}
      <style>{`
        .custom-table .ant-table-thead > tr > th {
            background: #f8fafc;
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default StudentsTab;
