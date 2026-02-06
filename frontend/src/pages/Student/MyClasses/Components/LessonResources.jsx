import React, { useMemo } from "react";
import { Tabs, Button, Empty, Tooltip } from "antd";
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  FileImage,
  FileQuestion,
  BookOpen,
} from "lucide-react";

const LessonResources = ({ lesson }) => {
  // 1. Logic phân loại tài liệu (Sử dụng useMemo để tối ưu hiệu năng)
  const { documents, exercises } = useMemo(() => {
    // Nếu không có dữ liệu, trả về 2 mảng rỗng
    if (!lesson || !lesson.Materials || !Array.isArray(lesson.Materials)) {
      return { documents: [], exercises: [] };
    }

    const docs = [];
    const exers = [];

    lesson.Materials.forEach((m) => {
      // Chuẩn hóa Category: Xóa khoảng trắng thừa, chuyển về chữ thường
      // Ví dụ: "Material " -> "material", "Exercise" -> "exercise"
      const category = m.Category
        ? m.Category.toString().trim().toLowerCase()
        : "";

      if (category === "material") {
        docs.push(m);
      } else if (category === "exercise") {
        exers.push(m);
      } else {
        // Nếu Category null hoặc khác 2 loại trên, mặc định đưa vào Documents (tùy logic của bạn)
        // docs.push(m);
      }
    });

    return { documents: docs, exercises: exers };
  }, [lesson]);

  // 2. Hàm chọn Icon dựa trên đuôi file
  const getFileIcon = (fileName) => {
    const safeName = fileName || "";
    const ext = safeName.split(".").pop().toLowerCase();

    if (["xlsx", "xls", "csv"].includes(ext))
      return <FileSpreadsheet size={20} className="text-emerald-600" />;
    if (["pdf", "doc", "docx"].includes(ext))
      return <FileText size={20} className="text-rose-500" />;
    if (["png", "jpg", "jpeg", "gif"].includes(ext))
      return <FileImage size={20} className="text-blue-500" />;
    return <File size={20} className="text-slate-500" />;
  };

  // 3. Hàm render danh sách file
  const renderFileList = (files, emptyText) => {
    if (!files || files.length === 0)
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-slate-400 text-xs">{emptyText}</span>
          }
          className="my-4"
        />
      );

    return (
      <div className="grid grid-cols-1 gap-3">
        {files.map((file, index) => (
          <div
            key={file.LessonMaterialId || index}
            className="flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:border-indigo-300 hover:shadow-md transition-all group cursor-default"
          >
            {/* Icon Box */}
            <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-50 transition-colors">
              {getFileIcon(file.Title || file.FileUrl)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 mr-2">
              <Tooltip title={file.Title} placement="topLeft">
                <h5 className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                  {file.Title}
                </h5>
              </Tooltip>
              <p className="text-xs text-slate-400 mt-0.5">
                {file.CreatedAt
                  ? new Date(file.CreatedAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>

            {/* Download Button */}
            <Button
              type="text"
              icon={<Download size={18} />}
              href={file.FileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
            />
          </div>
        ))}
      </div>
    );
  };

  // 4. Cấu hình Tabs
  const items = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2">
          <BookOpen size={16} /> Giới thiệu
        </span>
      ),
      children: (
        <div className="p-4 bg-white rounded-lg border border-gray-100 text-slate-600 leading-relaxed text-sm min-h-[100px]">
          {lesson?.Description ? (
            <div dangerouslySetInnerHTML={{ __html: lesson.Description }} />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có mô tả chi tiết."
            />
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2">
          <FileText size={16} /> Tài liệu ({documents.length})
        </span>
      ),
      children: renderFileList(documents, "Không có tài liệu tham khảo nào."),
    },
    {
      key: "3",
      label: (
        <span className="flex items-center gap-2">
          <FileQuestion size={16} /> Bài tập ({exercises.length})
        </span>
      ),
      children: renderFileList(exercises, "Không có bài tập thực hành nào."),
    },
  ];

  if (!lesson) return null;

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Tabs
        defaultActiveKey="1"
        items={items}
        type="card"
        className="custom-tabs p-2"
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  );
};

export default LessonResources;
