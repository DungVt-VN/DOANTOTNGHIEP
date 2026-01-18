import React, { useEffect, useState, forwardRef } from "react";
import { Spin, message, Empty, Button, Input } from "antd";
import { Search, Plus, Layers, FileQuestion } from "lucide-react"; // Cập nhật Import
import api from "@/utils/axiosInstance";

// Đảm bảo đường dẫn import đúng với dự án của bạn
import QuestionList from "@/components/BankQuestion/QuestionList";
import QuestionModal from "@/components/BankQuestion/QuestionModal";
import { removeVietnameseTones } from "@/js/Helper";
import { AppAlert } from "@/components/AppAlert";

const QuestionManager = forwardRef(({ courseId }, ref) => {
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [activeChapterId, setActiveChapterId] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // 1. Fetch Chapters (Lấy danh sách chương)
  const fetchChapters = async () => {
    try {
      const res = await api.get(`/courses/course-chapter/${courseId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setChapters(data);
      if (data.length > 0 && !activeChapterId) {
        setActiveChapterId(data[0].CourseChapterId);
      }
    } catch (err) {
      message.error("Lỗi tải danh sách chương");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Questions (Lấy câu hỏi và Map dữ liệu)
  const fetchQuestions = async () => {
    if (!activeChapterId) return;
    setLoadingQuestions(true);
    try {
      const res = await api.get(`/questions/by-chapter/${activeChapterId}`);
      const mappedQuestions = res.data.map((q) => ({
        ...q,
        Content: q.QuestionContent,
        Level: q.DifficultyLevel,
        Type: q.QuestionType,
        Answers: q.Options?.map((opt) => ({
          ...opt,
          Content: opt.OptionText,
          IsCorrect: !!opt.IsCorrect,
        })),
      }));
      setQuestions(mappedQuestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  useEffect(() => {
    fetchQuestions();
  }, [activeChapterId]);

  // 3. Save Question
  const handleSaveQuestion = async (values) => {
    try {
      const payload = {
        CourseChapterId: activeChapterId,
        QuestionContent: values.Content,
        QuestionType: values.Type,
        DifficultyLevel: values.Level,
        MediaType: "None",
        Answers: values.Answers.map((ans) => ({
          OptionText: ans.Content,
          IsCorrect: ans.IsCorrect,
        })),
      };

      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.QuestionId}`, payload);
        message.success("Cập nhật câu hỏi thành công");
      } else {
        await api.post(`/questions`, payload);
        message.success("Thêm câu hỏi mới thành công");
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi lưu câu hỏi");
    }
  };

  // 4. Delete Question
  const handleDeleteQuestion = (id) => {
    AppAlert.confirmDelete({
      title: "Xóa câu hỏi này?",
      content:
        "Câu hỏi này sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục không?",
      onOk: async () => {
        try {
          await api.delete(`/questions`, { data: { ids: [id] } });
          message.success("Đã xóa câu hỏi");
          fetchQuestions();
        } catch (err) {
          console.error(err);
          message.error("Lỗi khi xóa câu hỏi");
        }
      },
    });
  };

  // --- RENDER ---
  if (loading)
    return (
      <div className="p-10 text-center">
        <Spin size="large" />
      </div>
    );
  if (chapters.length === 0)
    return (
      <Empty description="Môn học này chưa có chương nào" className="mt-20" />
    );

  return (
    <>
      <div className="h-full w-full flex flex-row bg-white border border-slate-200 shadow-sm overflow-hidden rounded-lg">
        {/* --- LEFT SIDEBAR: DANH SÁCH CHƯƠNG --- */}
        <div className="w-[280px] flex flex-col border-r border-slate-200 bg-slate-50 shrink-0">
          {/* Sidebar Header */}
          <div className="flex flex-col justify-center px-5 py-5 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-[15px] uppercase tracking-wide">
              <Layers size={18} />
              <span>Mục lục</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1.5 pl-7">
              Tổng số: {chapters.length} chương
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chapters.map((chapter, index) => {
              const isActive = activeChapterId === chapter.CourseChapterId;
              const indexStr = (index + 1).toString().padStart(2, "0");

              return (
                <div
                  key={chapter.CourseChapterId}
                  onClick={() => setActiveChapterId(chapter.CourseChapterId)}
                  className={`
                    group flex items-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-all duration-200 border
                    ${
                      isActive
                        ? "bg-white border-blue-200 shadow-[0_4px_12px_rgba(37,99,235,0.08)]"
                        : "bg-transparent border-transparent hover:bg-slate-200/50"
                    }
                  `}
                >
                  {/* Số thứ tự */}
                  <div
                    className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-200 text-slate-500 group-hover:bg-white"
                    }
                  `}
                  >
                    {indexStr}
                  </div>

                  {/* Tên chương */}
                  <div className="flex flex-col items-start overflow-hidden w-full">
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 text-slate-400">
                      Chương {index + 1}
                    </span>
                    <span
                      className={`
                      truncate w-full text-sm font-medium leading-tight text-left
                      ${isActive ? "text-blue-700" : "text-slate-600"}
                    `}
                    >
                      {chapter.Title || "Chương chưa đặt tên"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- RIGHT CONTENT: NỘI DUNG CÂU HỎI --- */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Toolbar Header (ĐÃ CHỈNH SỬA) */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4 shrink-0 bg-white">
            {/* Left: Tiêu đề */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileQuestion size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 m-0 leading-tight">
                  Danh sách câu hỏi
                </h2>
                <p className="text-xs text-slate-500 m-0">
                  Quản lý kho dữ liệu câu hỏi
                </p>
              </div>
            </div>

            {/* Right: Search & Action */}
            <div className="flex items-center gap-3">
              <Input
                prefix={<Search size={16} className="text-slate-400" />}
                placeholder="Tìm nội dung câu hỏi..."
                className="w-full rounded-lg py-2 bg-slate-50 border-slate-200 hover:bg-white focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <Button
                type="primary"
                icon={<Plus size={18} />}
                className="bg-blue-600 hover:!bg-blue-500 shadow-md shadow-blue-200 h-10 px-5 font-medium flex items-center"
                onClick={() => {
                  setEditingQuestion(null);
                  setIsModalOpen(true);
                }}
              >
                Tạo câu hỏi
              </Button>
            </div>
          </div>

          {/* List câu hỏi */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/30">
            {loadingQuestions ? (
              <div className="flex flex-col items-center justify-center h-40">
                <Spin />
                <span className="text-slate-400 text-xs mt-2">
                  Đang tải câu hỏi...
                </span>
              </div>
            ) : (
              <QuestionList
                questions={questions.filter((q) =>
                  removeVietnameseTones(q.Content || "").includes(
                    removeVietnameseTones(searchTerm)
                  )
                )}
                onEdit={(q) => {
                  setEditingQuestion(q);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteQuestion}
              />
            )}
          </div>
        </div>
      </div>

      <QuestionModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onFinish={handleSaveQuestion}
        initialValues={editingQuestion}
      />
    </>
  );
});

export default QuestionManager;
