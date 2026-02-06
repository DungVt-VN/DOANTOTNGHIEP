import React from "react";
import { Tag, Button, Popconfirm, Tooltip } from "antd";
import {
  Edit,
  Trash2,
  HelpCircle,
  CheckCircle2,
  CheckSquare,
  FileText,
} from "lucide-react";

const QuestionList = ({ questions, onEdit, onDelete }) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        <HelpCircle size={40} className="mx-auto mb-2 opacity-50" />
        <p>Chưa có câu hỏi nào trong chương này.</p>
      </div>
    );
  }

  // --- MAP TAG THEO ENUM ---
  const renderTypeTag = (type) => {
    switch (type) {
      case "SingleChoice":
        return <Tag color="blue">1 Đáp án</Tag>;
      case "MultipleChoice":
        return <Tag color="cyan">Nhiều đáp án</Tag>;
      case "TextInput":
        return <Tag color="purple">Tự luận</Tag>;
      default:
        return <Tag>Khác</Tag>;
    }
  };

  const renderLevel = (level) => {
    switch (level) {
      case "Easy":
        return <Tag color="green">Dễ</Tag>;
      case "Medium":
        return <Tag color="gold">Trung bình</Tag>;
      case "Hard":
        return <Tag color="red">Khó</Tag>;
      default:
        return null;
    }
  };

  return (
    // THÊM pb-10 ĐỂ TẠO KHOẢNG TRỐNG CUỐI CÙNG
    <div className="space-y-4 pb-10">
      {questions.map((q, idx) => (
        <div
          key={q.QuestionId || idx}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-slate-500 text-xs uppercase bg-slate-100 px-2 py-1 rounded">
                  Câu {idx + 1}
                </span>
                {renderLevel(q.Level)}
                {renderTypeTag(q.Type)}
              </div>

              <div className="text-slate-800 font-medium mb-3 text-base whitespace-pre-line">
                {q.Content}
              </div>

              {/* === HIỂN THỊ ĐÁP ÁN THEO LOẠI === */}

              {/* 1. Tự luận (TextInput) */}
              {q.Type === "TextInput" && q.Answers?.length > 0 && (
                <div className="mt-2 bg-purple-50 p-3 rounded-md border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-1">
                    <FileText size={16} /> Đáp án mẫu:
                  </div>
                  <div className="text-slate-700 text-sm">
                    {q.Answers[0].Content}
                  </div>
                </div>
              )}

              {/* 2. Trắc nghiệm (SingleChoice & MultipleChoice) */}
              {(q.Type === "SingleChoice" || q.Type === "MultipleChoice") &&
                q.Answers && (
                  <div className="grid grid-cols-1 gap-2 mt-3 pl-2 border-l-2 border-slate-100">
                    {q.Answers.map((ans, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 text-sm p-1 rounded ${
                          ans.IsCorrect
                            ? "bg-green-50 text-green-700 font-medium"
                            : "text-slate-600"
                        }`}
                      >
                        {/* Icon check tùy loại */}
                        <div className="mt-0.5">
                          {ans.IsCorrect ? (
                            q.Type === "MultipleChoice" ? (
                              <CheckSquare size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )
                          ) : (
                            <div
                              className={`w-4 h-4 border border-slate-300 ${
                                q.Type === "SingleChoice"
                                  ? "rounded-full"
                                  : "rounded-sm"
                              }`}
                            />
                          )}
                        </div>
                        <span>
                          {String.fromCharCode(65 + i)}. {ans.Content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip title="Sửa">
                <Button
                  size="small"
                  type="text"
                  icon={<Edit size={16} className="text-blue-500" />}
                  onClick={() => onEdit(q)}
                />
              </Tooltip>
              <Button
                size="small"
                type="text"
                icon={<Trash2 size={16} className="text-red-500" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(q.QuestionId);
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
