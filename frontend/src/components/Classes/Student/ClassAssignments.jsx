import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Upload,
  message,
  Modal,
  Tag,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import {
  CheckCircle,
  UploadCloud,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Paperclip,
  MessageSquare,
  RefreshCw,
  Download,
  History,
  PlayCircle,
  BookOpen,
  Trophy,
  GraduationCap,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import api from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";

// Cấu hình dayjs
dayjs.extend(relativeTime);
dayjs.locale("vi");

const ClassAssignments = ({ classId, studentId }) => {
  const navigate = useNavigate();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- 1. FETCH DANH SÁCH BÀI TẬP ---
  const fetchAssignments = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await api.get(`/assignments/class/student/${classId}`, {
        params: { studentId },
      });
      // Sắp xếp: Mới nhất lên đầu
      const cleanData = response.data
        .filter((item) => item.Status !== "draft")
        .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

      setAssignments(cleanData);
    } catch (error) {
      console.error("Lỗi tải bài tập:", error);
      message.error("Không thể tải danh sách bài tập.");
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // --- 2. FETCH CHI TIẾT (KHI MỞ MODAL) ---
  const handleOpenDetail = async (item) => {
    // Set data sơ bộ từ list để hiện UI ngay
    setSelectedAssignment(item);
    setIsModalOpen(true);

    // Gọi API lấy chi tiết mới nhất
    try {
      const res = await api.get(`/assignments/submission/${item.AssignmentId}`);
      const { isSubmitted, data } = res.data;

      if (isSubmitted && data) {
        setSelectedAssignment((prev) => ({
          ...prev,
          SubmissionStatus: data.status || "Submitted",
          StudentScore: data.score,
          SubmissionDate: data.submissionDate,
          TeacherComment: data.teacherComment,
          StudentFileUrl: data.fileUrl,
        }));
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết:", error);
    }
  };

  // --- 3. LOGIC XÁC ĐỊNH TRẠNG THÁI ---
  const getStatusConfig = (assignment) => {
    const now = dayjs();
    const dueDate = dayjs(assignment.DueDate);
    const { SubmissionStatus } = assignment;

    // 1. Đã chấm điểm
    if (SubmissionStatus === "Graded") {
      return {
        label: "Đã chấm điểm",
        color: "purple",
        icon: <GraduationCap size={14} />,
        bgClass: "bg-purple-50 text-purple-700 border-purple-200",
        borderClass: "border-l-purple-500",
        canSubmit: false,
      };
    }

    // 2. Đã nộp (Ưu tiên check nộp trước khi check quá hạn)
    if (SubmissionStatus === "Submitted" || SubmissionStatus === "Late") {
      return {
        label: "Đã nộp bài",
        color: "success",
        icon: <CheckCircle size={14} />,
        bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        borderClass: "border-l-emerald-500",
        canSubmit: true, // Vẫn cho nộp lại
      };
    }

    // 3. Quá hạn (Chưa nộp)
    if (now.isAfter(dueDate)) {
      return {
        label: "Quá hạn",
        color: "error",
        icon: <XCircle size={14} />,
        bgClass: "bg-rose-50 text-rose-700 border-rose-200",
        borderClass: "border-l-rose-500",
        canSubmit: false,
      };
    }

    // 4. Đang mở (Chưa nộp)
    return {
      label: "Đang mở",
      color: "processing",
      icon: <Clock size={14} />,
      bgClass: "bg-blue-50 text-blue-700 border-blue-200",
      borderClass: "border-l-blue-500",
      canSubmit: true,
    };
  };

  // --- 4. ACTIONS ---
  const handleUploadFile = async ({ file, onSuccess, onError }) => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", selectedAssignment.AssignmentId);

    try {
      await api.post(`/assignments/submit`, formData);
      message.success("Nộp bài thành công!");
      onSuccess("ok");
      await fetchAssignments(); // Reload list
      handleOpenDetail(selectedAssignment); // Reload modal detail
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Lỗi nộp bài.";
      message.error(errorMsg);
      onError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartQuiz = () => {
    if (selectedAssignment?.QuizId) {
      navigate(`/student/quiz/${selectedAssignment.QuizId}`);
    } else {
      message.error("Không tìm thấy mã bài kiểm tra");
    }
  };

  // --- RENDER ---
  return (
    <div className="p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Bài tập & Kiểm tra
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý tất cả bài tập về nhà và bài kiểm tra của lớp học.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={fetchAssignments}
          loading={loading}
          shape="round"
          className="hover:bg-blue-50 text-blue-600 border-blue-200"
        >
          Làm mới dữ liệu
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      ) : assignments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hiện tại chưa có bài tập nào."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assignments.map((item) => {
            const status = getStatusConfig(item);
            const isQuiz = item.Type === "quiz";
            const hasScore =
              item.StudentScore !== null && item.StudentScore !== undefined;

            return (
              <div
                key={item.AssignmentId}
                onClick={() => handleOpenDetail(item)}
                className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer 
                  hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col
                  ${status.borderClass} border-l-[6px]`}
              >
                {/* --- 1. CARD HEADER: TYPE & STATUS --- */}
                <div className="p-5 pb-0 flex justify-between items-start">
                  {/* Loại bài (Badge) */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap mr-2 uppercase tracking-wide 
                    ${isQuiz ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                  >
                    {isQuiz ? <PlayCircle size={14} /> : <FileText size={14} />}
                    <span>{isQuiz ? "Trắc nghiệm" : "Tự luận"}</span>
                  </div>

                  {/* Badge Trạng thái */}
                  <div
                    className={`flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${status.bgClass}`}
                  >
                    {status.icon}
                    <span>{status.label}</span>
                  </div>
                </div>

                {/* --- 2. CARD BODY: TITLE & INFO --- */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Tiêu đề */}
                  <h3
                    className="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors h-[48px]"
                    title={item.Title}
                  >
                    {item.Title}
                  </h3>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-3"></div>

                  {/* Footer Info Row */}
                  <div className="flex items-end justify-between mt-auto">
                    {/* Bên trái: Hạn nộp */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Hạn nộp
                      </span>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-medium 
                        ${dayjs().isAfter(item.DueDate) && !item.SubmissionStatus ? "text-rose-500" : "text-slate-600"}`}
                      >
                        <Clock size={14} />
                        {dayjs(item.DueDate).format("HH:mm - DD/MM")}
                      </div>
                    </div>

                    {/* Bên phải: Điểm số (Nếu có) */}
                    {hasScore ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          Kết quả
                        </span>
                        <div className="flex items-baseline gap-0.5 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                          <span className="text-xl font-black leading-none">
                            {item.StudentScore}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            /10
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Nếu chưa có điểm nhưng đã nộp -> Hiện trạng thái chờ
                      item.SubmissionStatus && (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                            Trạng thái
                          </span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            Chờ chấm
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Decorative Bottom Bar (Màu theo loại bài) */}
                <div
                  className={`h-1.5 w-0 group-hover:w-full transition-all duration-500 absolute bottom-0 left-0 
                  ${isQuiz ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-gradient-to-r from-blue-400 to-indigo-500"}`}
                ></div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose
        title={
          <div className="text-lg font-bold flex items-center gap-2 text-slate-800 pb-2 border-b">
            {selectedAssignment?.Type === "quiz" ? (
              <PlayCircle className="text-orange-500" />
            ) : (
              <FileText className="text-blue-600" />
            )}
            {selectedAssignment?.Title}
          </div>
        }
      >
        {selectedAssignment &&
          (() => {
            const status = getStatusConfig(selectedAssignment);
            const isQuiz = selectedAssignment.Type === "quiz";
            const isSubmitted = !!selectedAssignment.SubmissionStatus;
            const hasScore =
              selectedAssignment.StudentScore !== null &&
              selectedAssignment.StudentScore !== undefined;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                {/* --- CỘT TRÁI: THÔNG TIN & ĐỀ BÀI (2/3) --- */}
                <div className="md:col-span-2 space-y-5">
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full border ${status.bgClass} font-semibold flex items-center gap-1`}
                    >
                      {status.icon} {status.label}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-1">
                      <Clock size={14} /> Hạn nộp:{" "}
                      {dayjs(selectedAssignment.DueDate).format(
                        "HH:mm - DD/MM/YYYY",
                      )}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <AlertCircle size={18} className="text-blue-500" /> Nội
                      dung & Yêu cầu
                    </h4>
                    <div className="text-slate-600 whitespace-pre-line text-sm leading-7">
                      {selectedAssignment.Description ||
                        "Không có mô tả chi tiết."}
                    </div>
                  </div>

                  {selectedAssignment.FileUrl && (
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-300 transition-colors">
                      <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Paperclip size={16} /> Tài liệu đính kèm
                      </h4>
                      <Button
                        type="default"
                        href={selectedAssignment.FileUrl}
                        target="_blank"
                        icon={<Download size={16} />}
                        block
                        className="flex items-center justify-start gap-2 h-12 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                      >
                        Tải xuống tài liệu tham khảo
                      </Button>
                    </div>
                  )}
                </div>

                {/* --- CỘT PHẢI: KẾT QUẢ & ACTION (1/3) --- */}
                <div className="md:col-span-1 space-y-5">
                  {/* 1. KẾT QUẢ (Điểm số) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-blue-500"></div>
                    <div className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center justify-center gap-1">
                      <Trophy size={14} /> Kết quả
                    </div>
                    <div
                      className={`text-4xl font-black ${
                        hasScore
                          ? "text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-blue-600"
                          : "text-slate-200"
                      }`}
                    >
                      {selectedAssignment.StudentScore ?? "--"}
                      <span className="text-lg font-bold text-slate-300 ml-1">
                        /10
                      </span>
                    </div>
                    {/* Badge trạng thái chấm điểm */}
                    {hasScore ? (
                      <div className="mt-2 text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
                        Đã chấm điểm
                      </div>
                    ) : isSubmitted ? (
                      <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
                        Đang chờ chấm
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-400 font-medium bg-slate-50 inline-block px-2 py-1 rounded">
                        Chưa có điểm
                      </div>
                    )}
                  </div>

                  {/* 2. LỜI PHÊ GIÁO VIÊN */}
                  {selectedAssignment.TeacherComment && (
                    <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-5">
                      <div className="text-xs font-bold uppercase text-purple-600 mb-2 flex items-center gap-1">
                        <MessageSquare size={14} /> Nhận xét
                      </div>
                      <p className="text-purple-900 text-sm italic leading-relaxed">
                        "{selectedAssignment.TeacherComment}"
                      </p>
                    </div>
                  )}

                  {/* 3. KHU VỰC HÀNH ĐỘNG */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-4">
                      Hành động
                    </div>

                    {/* Thông tin đã nộp */}
                    {isSubmitted && (
                      <div className="mb-4 text-sm text-emerald-700 font-medium flex items-start gap-3 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                        <CheckCircle
                          size={18}
                          className="mt-0.5 text-emerald-500"
                        />
                        <div className="flex flex-col">
                          <span>Bạn đã nộp bài này</span>
                          <span className="text-xs text-slate-400 font-normal">
                            Vào lúc:{" "}
                            {dayjs(selectedAssignment.SubmissionDate).format(
                              "HH:mm - DD/MM/YYYY",
                            )}
                          </span>
                          {/* Nếu là Homework, hiện link file bài làm */}
                          {!isQuiz && selectedAssignment.StudentFileUrl && (
                            <a
                              href={selectedAssignment.StudentFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                            >
                              <FileText size={10} /> Xem bài làm của bạn
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NÚT BẤM CHÍNH */}
                    {status.canSubmit ? (
                      isQuiz ? (
                        // === NÚT LÀM QUIZ ===
                        <Button
                          type="primary"
                          block
                          size="large"
                          icon={<PlayCircle size={20} />}
                          className="bg-gradient-to-r from-orange-500 to-red-500 border-none shadow-lg shadow-orange-200 h-12 font-bold text-md hover:scale-[1.02] transition-transform"
                          onClick={handleStartQuiz}
                        >
                          {isSubmitted
                            ? "Làm lại bài kiểm tra"
                            : "Bắt đầu làm bài"}
                        </Button>
                      ) : (
                        // === NÚT NỘP FILE ===
                        <Upload
                          customRequest={handleUploadFile}
                          showUploadList={false}
                          disabled={submitting}
                          className="w-full"
                        >
                          <Button
                            type="primary"
                            block
                            size="large"
                            loading={submitting}
                            icon={<UploadCloud size={20} />}
                            className="bg-blue-600 shadow-lg shadow-blue-200 h-12 font-bold text-md hover:scale-[1.02] transition-transform"
                          >
                            {isSubmitted
                              ? "Nộp lại file khác"
                              : "Nộp bài tập ngay"}
                          </Button>
                        </Upload>
                      )
                    ) : (
                      // === TRẠNG THÁI KHÓA ===
                      !isSubmitted && (
                        <div className="text-center text-rose-500 font-bold bg-rose-50 py-3 rounded-xl border border-rose-100 flex items-center justify-center gap-2">
                          <AlertTriangle size={18} />
                          <span>Đã hết hạn nộp bài</span>
                        </div>
                      )
                    )}

                    {/* Ghi chú */}
                    {status.canSubmit && isSubmitted && !isQuiz && (
                      <div className="text-[11px] text-slate-400 mt-3 text-center flex items-center justify-center gap-1">
                        <History size={12} /> Lưu ý: Bài nộp mới sẽ ghi đè bài
                        cũ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
};

export default ClassAssignments;
