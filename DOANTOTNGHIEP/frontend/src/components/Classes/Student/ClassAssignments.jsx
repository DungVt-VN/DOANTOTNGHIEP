import React from "react";
import { Card, Tag, Button, Upload, message, Empty } from "antd";
import {
  CheckCircle,
  UploadCloud,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";

const ClassAssignments = ({ assignments, onUpload }) => {
  // Xử lý logic upload của Antd
  const handleUploadChange = (info) => {
    if (info.file.status === "done") message.success("Nộp bài thành công");
    else if (info.file.status === "error") message.error("Nộp bài thất bại");
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 flex flex-col items-center justify-center">
        <CheckCircle size={48} className="text-slate-200 mb-4" />
        <p className="text-slate-500">Hiện tại chưa có bài tập nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {assignments.map((item) => {
        const isLate = dayjs(item.DueDate).isBefore(dayjs());
        const isSubmitted =
          item.SubmissionStatus === "Submitted" ||
          item.SubmissionStatus === "Graded";

        return (
          <Card
            key={item.AssignmentId}
            className="shadow-sm border-gray-200 rounded-xl hover:shadow-md transition-shadow flex flex-col h-full"
            bodyStyle={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <h3
                className="font-bold text-slate-800 text-lg m-0 line-clamp-1 flex-1 pr-2"
                title={item.Title}
              >
                {item.Title}
              </h3>
              <Tag
                color={isLate ? "red" : "blue"}
                className="mr-0 flex items-center gap-1 border-none px-2 py-0.5 rounded-md"
              >
                <Clock size={12} /> {dayjs(item.DueDate).format("DD/MM")}
              </Tag>
            </div>

            {/* Description */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex-1">
              <p className="text-slate-600 text-sm line-clamp-3">
                {item.Description || "Không có hướng dẫn chi tiết."}
              </p>
            </div>

            {/* Status & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              {isSubmitted ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-medium text-sm border border-green-100">
                  <CheckCircle size={16} />
                  <span>
                    Đã nộp {item.Score !== null && `• ${item.Score}đ`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium text-sm border border-amber-100">
                  <AlertCircle size={16} /> Chưa nộp
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isSubmitted && (
                  <Upload
                    {...onUpload(item.AssignmentId)}
                    showUploadList={false}
                    onChange={handleUploadChange}
                  >
                    <Button
                      type="primary"
                      size="small"
                      icon={<UploadCloud size={14} />}
                      className="bg-blue-600 shadow-none"
                    >
                      Nộp bài
                    </Button>
                  </Upload>
                )}
                <Button
                  size="small"
                  type="text"
                  className="text-slate-500 hover:text-blue-600"
                >
                  Chi tiết
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ClassAssignments;
