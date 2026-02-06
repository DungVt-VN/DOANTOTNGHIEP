import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";
import {
  Empty,
  Button,
  Tag,
  Skeleton,
  message,
  Tooltip,
  Modal,
  Input,
} from "antd";
import {
  Trophy,
  Clock,
  Calendar,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import dayjs from "dayjs";

const QuizList = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal AccessCode
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [selectedQuizJoin, setSelectedQuizJoin] = useState(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!classId || !currentUser?.StudentId) return;
      setLoading(true);
      try {
        const res = await api.get(`/quizzes/class/${classId}`, {
          params: { studentId: currentUser.StudentId },
        });
        setQuizzes(res.data || []);
      } catch (error) {
        message.error("Lỗi tải danh sách bài kiểm tra.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [classId, currentUser]);

  // --- 2. Xử lý "Tham gia" ---
  const handleJoinClick = (quiz) => {
    // Nếu có AccessCode -> Mở Modal nhập mã
    if (quiz.AccessCode && quiz.AccessCode.trim() !== "") {
      setSelectedQuizJoin(quiz);
      setAccessCodeInput("");
      setIsAccessModalOpen(true);
    } else {
      navigate(`/student/quiz/${quiz.QuizId}`);
    }
  };

  const confirmAccessCode = () => {
    if (!selectedQuizJoin) return;
    if (accessCodeInput === selectedQuizJoin.AccessCode) {
      message.success("Mã chính xác!");
      setIsAccessModalOpen(false);
      navigate(`/student/quiz/${selectedQuizJoin.QuizId}`);
    } else {
      message.error("Mã không đúng.");
    }
  };

  // --- 3. Helper: Xử lý trạng thái hiển thị ---
  const getQuizStatusInfo = (quiz) => {
    // Ưu tiên check đã nộp bài trước
    if (quiz.IsSubmitted) {
      return {
        color: "success",
        label: "Đã nộp bài",
        // Hiển thị điểm trực tiếp trên nút
        actionText: `${quiz.Score != null ? quiz.Score : "--"} Điểm`,
        canJoin: false, // Không cho bấm nữa
        icon: <CheckCircle2 size={14} />,
        isSubmitted: true,
      };
    }

    switch (quiz.Status) {
      case "ongoing":
        return {
          color: "processing",
          label: "Đang diễn ra",
          actionText: "Tham gia",
          canJoin: true,
          icon: <PlayCircle size={14} />,
          isSubmitted: false,
        };
      case "finished":
        return {
          color: "default",
          label: "Đã kết thúc",
          actionText: "Đã đóng",
          canJoin: false,
          icon: <Lock size={14} />,
          isSubmitted: false,
        };
      default:
        return {
          color: "warning",
          label: "Sắp diễn ra",
          actionText: "Chưa mở",
          canJoin: false,
          icon: <Clock size={14} />,
          isSubmitted: false,
        };
    }
  };

  // --- 4. Render ---
  if (loading)
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm">
        <Skeleton active />
      </div>
    );
  if (!quizzes.length) return <Empty description="Chưa có bài kiểm tra nào" />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4 flex items-center justify-between">
        <span>Danh sách bài kiểm tra</span>
        <span className="text-xs font-normal bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-100">
          {quizzes.length} bài
        </span>
      </h3>

      <div className="flex flex-col gap-3">
        {quizzes.map((quiz) => {
          const statusInfo = getQuizStatusInfo(quiz);

          return (
            <div
              key={quiz.QuizId}
              className="group relative flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all bg-white"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${statusInfo.isSubmitted ? "bg-green-100 text-green-600" : "bg-purple-50 text-purple-600"}`}
                >
                  {statusInfo.isSubmitted ? (
                    <Trophy size={24} />
                  ) : (
                    <PlayCircle size={24} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-800 text-base truncate group-hover:text-purple-700 transition-colors">
                    {quiz.Title}
                  </h4>
                  <Tag
                    bordered={false}
                    color={statusInfo.color}
                    className="flex items-center gap-1 text-[10px] uppercase font-bold m-0"
                  >
                    {statusInfo.icon} {statusInfo.label}
                  </Tag>
                  {quiz.AccessCode && !statusInfo.isSubmitted && (
                    <Tag color="gold" className="text-[10px] font-bold">
                      <Lock size={10} className="inline mr-1" />
                      PASS
                    </Tag>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />{" "}
                    {quiz.DurationMinutes} phút
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />{" "}
                    {quiz.StartTime
                      ? dayjs(quiz.StartTime).format("HH:mm DD/MM")
                      : "--"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 flex items-center justify-end">
                {statusInfo.isSubmitted ? (
                  // Nút hiển thị ĐIỂM (Disabled)
                  <div className="flex flex-col items-end">
                    <Button
                      disabled
                      className="font-black text-green-700 border-green-200 bg-green-50 rounded-xl h-10 px-6 opacity-100"
                    >
                      {statusInfo.actionText}
                    </Button>
                  </div>
                ) : // Các trạng thái khác (Tham gia / Chưa mở / Đã đóng)
                statusInfo.canJoin ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleJoinClick(quiz)}
                    className="bg-purple-600 hover:bg-purple-700 shadow-purple-200 font-bold px-6 h-10 rounded-xl flex items-center gap-2"
                  >
                    {statusInfo.actionText} <ChevronRight size={16} />
                  </Button>
                ) : (
                  <div className="text-right">
                    {quiz.Status === "finished" ? (
                      <Button
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-400 rounded-xl h-10 px-6 font-medium"
                      >
                        Đã đóng
                      </Button>
                    ) : (
                      <Tooltip
                        title={`Mở lúc: ${dayjs(quiz.StartTime).format("HH:mm DD/MM")}`}
                      >
                        <Button
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-500 rounded-xl h-10 px-6 font-medium flex items-center gap-2"
                        >
                          <Lock size={14} /> Chưa mở
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Modal Nhập Mã --- */}
      <Modal
        title="Nhập mã truy cập"
        open={isAccessModalOpen}
        onCancel={() => setIsAccessModalOpen(false)}
        onOk={confirmAccessCode}
        centered
      >
        <Input.Password
          placeholder="Nhập mật khẩu bài thi..."
          value={accessCodeInput}
          onChange={(e) => setAccessCodeInput(e.target.value)}
          onPressEnter={confirmAccessCode}
        />
      </Modal>
    </div>
  );
};

export default QuizList;
