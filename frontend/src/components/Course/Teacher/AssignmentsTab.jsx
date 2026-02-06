import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  CheckCircle2,
  Calendar,
  BarChart3,
  Clock,
  User,
  Users,
} from "lucide-react";
import {
  Table,
  Button,
  Progress,
  Modal,
  message,
  Tag,
  Tooltip,
  Empty,
} from "antd";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";

// Import Components
import AssignmentDetailModal from "./AssignmentsTab/AssignmentDetailModal";
import AssignmentFormModal from "./AssignmentsTab/AssignmentFormModal";
import SubmissionsModal from "./AssignmentsTab/SubmissionsModal";

// --- HELPER COMPONENTS ---
const AssignmentTypeIcon = ({ type }) => {
  const isQuiz = type === "quiz";
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        isQuiz ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
      }`}
    >
      {isQuiz ? <CheckCircle2 size={20} /> : <FileText size={20} />}
    </div>
  );
};

const AssignmentsTab = ({ classId, courseId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  // Đã xóa state searchTerm

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [submissionItem, setSubmissionItem] = useState(null);

  // 1. Fetch Data (Đã xóa params search)
  const fetchAssignments = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get(`/assignments/class/${classId}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách bài tập");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // --- STATS CALCULATION ---
  const totalAssignments = data.length;
  const activeAssignments = data.filter((d) => d.Status === "active").length;
  const avgProgress =
    totalAssignments > 0
      ? Math.round(
          (data.reduce((acc, curr) => {
            const rate =
              curr.TotalStudents > 0
                ? curr.SubmittedCount / curr.TotalStudents
                : 0;
            return acc + rate;
          }, 0) /
            totalAssignments) *
            100,
        )
      : 0;

  // 2. Handlers
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      const payload = {
        classId,
        title: values.title,
        description: values.description || "",
        dueDate: values.dueDate.toISOString(),
        type: values.type,
        status: values.status,
        fileUrl: values.fileUrl,
        quizId: values.quizId,
      };

      if (values.type === "quiz" && values.quizId && !editingItem) {
        await api.post("/assignments/quiz", payload);
      } else {
        if (editingItem) {
          await api.put(`/assignments/${editingItem.AssignmentId}`, payload);
        } else {
          await api.post("/assignments", payload);
        }
      }

      message.success("Lưu thành công!");
      setIsFormOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi lưu bài tập.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xóa bài tập này?",
      content:
        "Hành động này không thể hoàn tác. Tất cả bài làm của học sinh cũng sẽ bị xóa.",
      okText: "Xóa ngay",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/assignments/${id}`);
          message.success("Đã xóa bài tập");
          fetchAssignments();
        } catch (e) {
          message.error("Lỗi khi xóa bài tập");
        }
      },
    });
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Bài tập",
      key: "Title",
      width: 350,
      render: (_, r) => (
        <div
          className="flex items-start gap-3 cursor-pointer group"
          onClick={() => {
            setViewItem(r);
            setIsDetailOpen(true);
          }}
        >
          <AssignmentTypeIcon type={r.Type} />
          <div>
            <div className="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
              {r.Title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                {r.Type === "quiz" ? "Trắc nghiệm" : "Tự luận"}
              </span>
              {r.Status === "draft" && (
                <Tag
                  bordered={false}
                  className="text-xs bg-slate-100 text-slate-500 m-0"
                >
                  Nháp
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Hạn nộp",
      dataIndex: "DueDate",
      width: 200,
      render: (d) => {
        const date = dayjs(d);
        const isExpired = date.isBefore(dayjs());
        return (
          <div
            className={`flex items-center gap-2 ${
              isExpired ? "text-red-500" : "text-slate-600"
            }`}
          >
            <Calendar size={16} />
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {date.format("HH:mm, DD/MM")}
              </span>
              {isExpired && (
                <span className="text-[10px] font-bold uppercase bg-red-50 px-1 rounded w-fit">
                  Đã kết thúc
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Tiến độ nộp bài",
      key: "Progress",
      render: (_, r) => {
        const percent =
          r.TotalStudents > 0
            ? Math.round((r.SubmittedCount / r.TotalStudents) * 100)
            : 0;
        return (
          <div className="w-full max-w-[180px]">
            <div className="flex justify-between text-xs mb-1 text-slate-500">
              <span>
                Đã nộp: <b>{r.SubmittedCount}</b>/{r.TotalStudents}
              </span>
              <span className="font-bold">{percent}%</span>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={percent === 100 ? "#10b981" : "#3b82f6"}
              trailColor="#f1f5f9"
            />
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      align: "right",
      width: 140, // Tăng width để chứa đủ nút
      render: (_, r) => (
        <div className="flex justify-end gap-1">
          {/* NÚT MỚI: XEM DANH SÁCH NỘP BÀI */}
          <Tooltip title="Danh sách nộp bài & Chấm điểm">
            <Button
              type="text"
              icon={<Users size={16} />}
              className="text-slate-400 hover:text-green-600 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                setSubmissionItem(r);
                setIsSubmissionsOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Pencil size={16} />}
              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(r);
                setIsFormOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(r.AssignmentId);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Tổng bài tập
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {totalAssignments}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Đang mở (Active)
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {activeAssignments}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Tỉ lệ nộp bài
            </p>
            <h3 className="text-2xl font-bold text-purple-600">
              {avgProgress}%
            </h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar Header (Đã xóa Input Search) */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách bài tập
            </h3>
            <p className="text-sm text-slate-500">
              Quản lý bài tập về nhà và bài kiểm tra
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Nút Tạo mới */}
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-500 border-none shadow-md font-medium rounded-lg flex items-center"
            >
              Tạo mới
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="AssignmentId"
          loading={loading}
          pagination={{
            pageSize: 5,
            showTotal: (total) => (
              <span className="text-slate-500">
                Tổng <b>{total}</b> bài tập
              </span>
            ),
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-slate-500">Chưa có bài tập nào.</span>
                    <Button type="dashed" onClick={() => setIsFormOpen(true)}>
                      Tạo bài tập đầu tiên
                    </Button>
                  </div>
                }
              />
            ),
          }}
          className="custom-table"
        />
      </div>

      {/* --- MODALS --- */}
      <AssignmentFormModal
        open={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onFinish={handleFormSubmit}
        initialValues={editingItem}
        loading={formLoading}
        courseId={courseId}
      />
      <SubmissionsModal
        open={isSubmissionsOpen}
        onCancel={() => setIsSubmissionsOpen(false)}
        assignment={submissionItem}
      />
      <AssignmentDetailModal
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        data={viewItem}
      />

      {/* CSS Override cho Table Header đẹp hơn */}
      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          text-transform: uppercase !important;
          padding-top: 16px !important;
          padding-bottom: 16px !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          padding-top: 16px !important;
          padding-bottom: 16px !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default AssignmentsTab;
