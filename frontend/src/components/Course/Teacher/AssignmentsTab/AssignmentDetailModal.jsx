import React from "react";
import { Modal, Button, Tag, Progress, Divider } from "antd";
import {
  FileText,
  CheckCircle2,
  Paperclip,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  X,
} from "lucide-react";
import dayjs from "dayjs";

// --- Components Badge (Đã style lại nhẹ nhàng hơn) ---
export const TypeBadge = ({ type }) => {
  const isQuiz = type === "quiz";
  return (
    <Tag
      color={isQuiz ? "blue" : "purple"}
      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-0 text-sm font-medium"
    >
      {isQuiz ? <CheckCircle2 size={14} /> : <FileText size={14} />}
      {isQuiz ? "Trắc nghiệm" : "Tự luận"}
    </Tag>
  );
};

export const StatusBadge = ({ status }) => {
  const isActive = status === "active";
  return (
    <Tag
      color={isActive ? "success" : "default"}
      className="px-2.5 py-0.5 rounded-full border-0 text-sm font-medium"
    >
      {isActive ? "Đang mở" : "Nháp"}
    </Tag>
  );
};

// --- Component hiển thị File đính kèm ---
const AttachmentCard = ({ url }) => {
  if (!url) return null;
  // Lấy tên file giả định từ URL hoặc hiển thị mặc định
  const fileName = url.split("/").pop() || "Tài liệu đính kèm";

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-500 shadow-sm">
          <FileText size={20} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-slate-700 truncate max-w-[300px]">
            {fileName}
          </span>
          <span className="text-xs text-slate-500">Nhấn để tải xuống</span>
        </div>
      </div>
      <Button
        type="primary"
        shape="circle"
        icon={<Download size={16} />}
        href={url}
        target="_blank"
        className="bg-blue-600 hover:bg-blue-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

const AssignmentDetailModal = ({ open, onCancel, data }) => {
  if (!data) return null;

  const dueDate = dayjs(data.DueDate);
  const isExpired = dueDate.isBefore(dayjs());
  const percent =
    data.TotalStudents > 0
      ? Math.round((data.SubmittedCount / data.TotalStudents) * 100)
      : 0;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" size="large" onClick={onCancel}>
          Đóng
        </Button>,
      ]}
      width={650}
      centered
      destroyOnClose
      closeIcon={
        <div className="p-1 rounded-full hover:bg-slate-100 transition-colors">
          <X size={20} className="text-slate-500" />
        </div>
      }
    >
      <div className="pt-2">
        {/* 1. HEADER: Icon + Title + Badges */}
        <div className="flex gap-5 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
              data.Type === "quiz"
                ? "bg-blue-50 border-blue-100 text-blue-600"
                : "bg-purple-50 border-purple-100 text-purple-600"
            }`}
          >
            {data.Type === "quiz" ? (
              <CheckCircle2 size={32} />
            ) : (
              <FileText size={32} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-2">
              {data.Title}
            </h2>
            <div className="flex items-center gap-2">
              <TypeBadge type={data.Type} />
              <StatusBadge status={data.Status} />
            </div>
          </div>
        </div>

        {/* 2. STATS GRID: Date & Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card: Hạn nộp */}
          <div
            className={`p-4 rounded-xl border ${
              isExpired
                ? "bg-red-50 border-red-100"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Calendar size={14} /> Thời hạn nộp bài
            </div>
            <div className="flex items-center justify-between">
              <div
                className={`text-lg font-bold ${
                  isExpired ? "text-red-600" : "text-slate-700"
                }`}
              >
                {dueDate.format("HH:mm - DD/MM/YYYY")}
              </div>
              {isExpired && (
                <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-white px-2 py-1 rounded-md shadow-sm">
                  <AlertCircle size={12} /> Đã hết hạn
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isExpired
                ? `Đã quá hạn ${dayjs().diff(dueDate, "day")} ngày`
                : `Còn ${dueDate.diff(dayjs(), "day")} ngày nữa`}
            </div>
          </div>

          {/* Card: Tiến độ */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Clock size={14} /> Tiến độ lớp học
              </div>
              <span className="text-xs font-medium text-slate-600">
                {data.SubmittedCount} / {data.TotalStudents} học viên
              </span>
            </div>
            <Progress
              percent={percent}
              strokeColor={percent === 100 ? "#10b981" : "#3b82f6"}
              trailColor="#f1f5f9"
              strokeWidth={10}
            />
          </div>
        </div>

        {/* 3. ATTACHMENT SECTION (If exists) */}
        {data.FileUrl && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Paperclip size={16} /> Tài liệu đính kèm
            </h4>
            <AttachmentCard url={data.FileUrl} />
          </div>
        )}

        <Divider className="my-6" />

        {/* 4. DESCRIPTION */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-3">
            Mô tả / Hướng dẫn
          </h4>
          <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
            {data.Description || (
              <span className="italic text-slate-400">
                Chưa có mô tả cho bài tập này.
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignmentDetailModal;
