import React, { useEffect, useState } from "react";
import { Modal, Spin, Tag, Empty, Button } from "antd";
import { Clock, FileText, CheckCircle2, ListChecks, Check } from "lucide-react";
import api from "@/utils/axiosInstance";

const PreviewExamModal = ({ quizId, open, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && quizId) {
      fetchDetail();
    }
  }, [open, quizId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
      ]}
      width={900}
      title={
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText className="text-blue-600" size={20} />
          <span className="text-lg font-semibold text-slate-800">
            Chi tiết đề kiểm tra & Đáp án
          </span>
        </div>
      }
      centered
      className="custom-modal"
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : data ? (
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* --- Header Info --- */}
          <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-100">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              {data.Title}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                <Clock size={16} className="text-orange-500" />
                Thời gian:{" "}
                <b className="text-slate-800">{data.DurationMinutes} phút</b>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                Điểm đạt: <b className="text-slate-800">{data.PassScore}/10</b>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                <ListChecks size={16} className="text-blue-500" />
                Số câu hỏi:{" "}
                <b className="text-slate-800">{data.questions?.length || 0}</b>
              </div>
            </div>
          </div>

          {/* --- Question List --- */}
          <div className="space-y-6">
            {data.questions && data.questions.length > 0 ? (
              data.questions.map((q, index) => (
                <div
                  key={q.QuestionId}
                  className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Nội dung câu hỏi và Tag nằm trên cùng 1 hàng flex */}
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="text-slate-800 text-base leading-relaxed">
                      {/* Nhãn Câu X: */}
                      <span className="font-bold mr-1.5 text-blue-800">
                        Câu {index + 1}:
                      </span>
                      {/* Nội dung câu hỏi (nối liền) */}
                      <span
                        className="font-medium text-slate-700 [&>p]:inline" // [&>p]:inline để ép thẻ p (nếu có) thành inline
                        dangerouslySetInnerHTML={{ __html: q.QuestionContent }}
                      />
                    </div>

                    {/* Tag độ khó nằm bên phải */}
                    <Tag
                      color={
                        q.DifficultyLevel === "Easy"
                          ? "success"
                          : q.DifficultyLevel === "Medium"
                          ? "warning"
                          : "error"
                      }
                      className="m-0 rounded-full px-3 shrink-0 h-fit"
                    >
                      {q.DifficultyLevel}
                    </Tag>
                  </div>

                  {/* Danh sách đáp án */}
                  {q.QuestionType !== "TextInput" && q.Options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-1">
                      {q.Options.map((opt) => {
                        // Xác định đáp án đúng
                        const isCorrect =
                          opt.IsCorrect === true || opt.IsCorrect === 1;

                        return (
                          <div
                            key={opt.OptionId}
                            className={`relative text-sm p-3 pl-4 rounded-lg border flex items-center gap-3 transition-colors ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium ring-1 ring-emerald-500"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {/* Icon trạng thái */}
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${
                                isCorrect
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-white border-slate-300"
                              }`}
                            >
                              {isCorrect && <Check size={12} strokeWidth={3} />}
                            </div>

                            {/* Nội dung đáp án */}
                            <span>{opt.Text || opt.OptionText}</span>

                            {/* Nhãn "Đáp án đúng" */}
                            {isCorrect && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <Empty description="Đề thi chưa có câu hỏi nào" />
            )}
          </div>
        </div>
      ) : (
        <Empty description="Không tìm thấy dữ liệu" />
      )}
    </Modal>
  );
};

export default PreviewExamModal;
