import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Tag,
  Avatar,
  Input,
  InputNumber,
  message,
  Tooltip,
  Card,
  Spin,
} from "antd";
import {
  Download,
  Save,
  User,
  CheckCircle2,
  Eye,
  XCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";

// ============================================================================
// 1. COMPONENT CON: MODAL CHI TIẾT BÀI LÀM TRẮC NGHIỆM
// ============================================================================
const QuizDetailModal = ({ open, onCancel, resultId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && resultId) {
      fetchQuizDetail();
    } else {
      setDetail(null);
    }
  }, [open, resultId]);

  const fetchQuizDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes/results/${resultId}/detail`);
      setDetail(res.data);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải chi tiết bài làm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-700">
          <FileText size={20} className="text-blue-600" />
          <span>Chi tiết bài làm Trắc nghiệm</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={
        <Button onClick={onCancel} type="primary">
          Đóng
        </Button>
      }
      width={800}
      centered
      destroyOnClose
      zIndex={1050} // Giữ zIndex cao để hiển thị trên modal danh sách
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin tip="Đang tải bài làm..." size="large" />
        </div>
      ) : detail ? (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* HEADER */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                Học viên
              </div>
              <div className="font-bold text-slate-800 text-lg">
                {detail.StudentName}{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({detail.StudentCode})
                </span>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Số câu đúng
                </div>
                <div className="text-lg font-bold text-green-600">
                  {detail.CorrectCount}/{detail.TotalQuestions}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Tổng điểm
                </div>
                <div className="text-2xl font-extrabold text-blue-600">
                  {detail.Score}
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="space-y-4">
            {detail.StudentAnswers?.map((ans, index) => {
              // --- LOGIC MỚI: So sánh nội dung text để xác định đúng/sai ---
              // Sử dụng trim() để loại bỏ khoảng trắng thừa nếu có
              const selectedText = (ans.SelectedOptionText || "").trim();
              const correctText = (ans.CorrectOptionText || "").trim();

              // Kiểm tra: Phải có chọn đáp án VÀ nội dung trùng khớp
              const isAnswerCorrect =
                selectedText.length > 0 && selectedText === correctText;

              return (
                <Card
                  key={index}
                  size="small"
                  // Sử dụng biến isAnswerCorrect thay vì ans.IsCorrect
                  className={`shadow-sm border-l-4 ${
                    isAnswerCorrect ? "border-l-green-500" : "border-l-red-500"
                  }`}
                  bodyStyle={{ padding: "16px" }}
                >
                  {/* Nội dung câu hỏi */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {index + 1}
                    </div>
                    <div className="font-medium text-slate-800 pt-1">
                      {ans.QuestionContent}
                    </div>
                  </div>

                  {/* Đáp án đã chọn */}
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      isAnswerCorrect
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    {isAnswerCorrect ? (
                      <CheckCircle2 size={18} className="flex-shrink-0" />
                    ) : (
                      <XCircle size={18} className="flex-shrink-0" />
                    )}
                    <span className="text-sm">
                      Đã chọn:{" "}
                      <strong>{ans.SelectedOptionText || "(Bỏ trống)"}</strong>
                    </span>
                  </div>

                  {/* Hiển thị đáp án đúng nếu làm sai */}
                  {!isAnswerCorrect && (
                    <div className="mt-2 ml-2 flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span>
                        Đáp án đúng: <strong>{ans.CorrectOptionText}</strong>
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <HelpCircle size={48} className="mx-auto mb-2 opacity-50" />
          <p>Không tìm thấy dữ liệu bài làm.</p>
        </div>
      )}
    </Modal>
  );
};

// ============================================================================
// 2. COMPONENT CHÍNH: QUẢN LÝ BÀI NỘP
// ============================================================================
const SubmissionsModal = ({ open, onCancel, assignment }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradingLoading, setGradingLoading] = useState(null);

  const [quizDetailOpen, setQuizDetailOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);

  useEffect(() => {
    if (open && assignment) {
      fetchSubmissions();
    }
  }, [open, assignment]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/assignments/${assignment.AssignmentId}/submissions`,
      );
      setData(res.data);
    } catch (error) {
      message.error("Lỗi tải danh sách bài nộp");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (record, grade, feedback) => {
    setGradingLoading(record.SubmissionId);
    try {
      await api.put(`/assignments/submissions/${record.SubmissionId}/grade`, {
        grade,
        feedback,
      });
      message.success("Đã lưu điểm");
      fetchSubmissions();
    } catch (error) {
      message.error("Lỗi lưu điểm");
    } finally {
      setGradingLoading(null);
    }
  };

  const handleViewQuizDetail = (record) => {
    const resultId = record.ResultId || record.resultId;
    if (!resultId) {
      message.warning("Học viên này chưa có kết quả bài kiểm tra.");
      return;
    }
    setSelectedResultId(resultId);
    setQuizDetailOpen(true);
  };

  const columns = [
    {
      title: "Học viên",
      key: "Student",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<User />} className="bg-indigo-100 text-indigo-600" />
          <div>
            <div className="font-semibold text-slate-700">{r.FullName}</div>
            <div className="text-xs text-slate-500">{r.Email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Thời gian nộp",
      dataIndex: "SubmissionDate",
      width: 150,
      render: (d) => (
        <span className="text-slate-600">
          {d ? (
            dayjs(d).format("HH:mm DD/MM/YYYY")
          ) : (
            <span className="text-gray-400 italic">Chưa nộp</span>
          )}
        </span>
      ),
    },
    {
      title: "Bài làm",
      key: "File",
      render: (_, r) => {
        // Xử lý Quiz
        if (assignment?.Type === "quiz") {
          return (
            <Tooltip title="Xem chi tiết câu trả lời">
              <Tag
                color="blue"
                className="cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 px-3 py-1 w-fit select-none"
                onClick={() => handleViewQuizDetail(r)}
              >
                <Eye size={14} /> Xem bài làm
              </Tag>
            </Tooltip>
          );
        }
        // Xử lý File Upload
        return r.FileUrl ? (
          <Button
            type="link"
            icon={<Download size={14} />}
            href={r.FileUrl}
            target="_blank"
            className="flex items-center gap-1 p-0 h-auto"
          >
            Tải file
          </Button>
        ) : (
          <span className="text-slate-400 italic text-xs">Chưa có file</span>
        );
      },
    },
    {
      title: "Điểm số (0-10)",
      key: "Grade",
      width: 130,
      render: (_, r) => {
        // --- SỬA LỖI Ở ĐÂY: Kiểm tra đa dạng tên trường điểm ---
        const displayScore = r.Score ?? r.Grade ?? r.QuizScore;

        if (assignment?.Type === "quiz") {
          return (
            <div className="font-bold text-center text-blue-600 text-base">
              {displayScore !== undefined && displayScore !== null
                ? displayScore
                : "--"}
              /10
            </div>
          );
        }
        return (
          <InputNumber
            min={0}
            max={10}
            step={0.5}
            defaultValue={displayScore}
            onChange={(val) => (r.tempGrade = val)}
            className="w-full"
          />
        );
      },
    },
    {
      title: "Nhận xét",
      key: "Feedback",
      render: (_, r) => (
        <Input.TextArea
          placeholder="Nhập lời phê..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          defaultValue={r.Feedback || r.TeacherComment}
          onChange={(e) => (r.tempFeedback = e.target.value)}
          className="text-sm"
        />
      ),
    },
    {
      title: "",
      width: 60,
      align: "center",
      render: (_, r) =>
        assignment?.Type !== "quiz" && (
          <Tooltip title="Lưu điểm & Nhận xét">
            <Button
              type="text"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              icon={<Save size={18} />}
              loading={gradingLoading === r.SubmissionId}
              onClick={() =>
                handleSaveGrade(
                  r,
                  // Cũng dùng logic lấy điểm đa dạng khi lưu
                  r.tempGrade !== undefined
                    ? r.tempGrade
                    : (r.Score ?? r.Grade),
                  r.tempFeedback !== undefined
                    ? r.tempFeedback
                    : r.Feedback || r.TeacherComment,
                )
              }
            />
          </Tooltip>
        ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="text-green-600" size={24} />
            <span>
              Danh sách nộp bài:{" "}
              <span className="font-bold text-blue-600">
                {assignment?.Title}
              </span>
            </span>
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={1000}
        centered
        destroyOnClose
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="SubmissionId"
          loading={loading}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: "Chưa có dữ liệu bài nộp." }}
          scroll={{ x: 800 }}
        />
      </Modal>

      <QuizDetailModal
        open={quizDetailOpen}
        onCancel={() => setQuizDetailOpen(false)}
        resultId={selectedResultId}
      />
    </>
  );
};

export default SubmissionsModal;
