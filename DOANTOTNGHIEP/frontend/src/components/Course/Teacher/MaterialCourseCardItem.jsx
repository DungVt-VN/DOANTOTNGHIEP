import React from "react";
import { Info, BookOpen, Layers, FileText } from "lucide-react";

const MaterialCourseCardItem = ({ course, renderStatusBadge, navigate }) => {
  // 1. CHUẨN HÓA DỮ LIỆU
  const info = course;

  return (
    <div
      onClick={() => navigate && navigate()}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
    >
      {/* ==================================================================================
          PHẦN 1: ẢNH BÌA & BADGE
      ================================================================================== */}
      <div className="h-40 relative bg-slate-100 overflow-hidden">
        <img
          src={
            info.CourseImage ||
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
          }
          alt={info.CourseName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay gradient nhẹ để text dễ đọc nếu cần */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

        {/* Badge Môn học */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-xs font-bold text-blue-700 shadow-sm border border-white/50">
            {info.Subject || "Môn học"}
          </span>
        </div>

        {/* Badge Trạng thái (Góc phải) */}
        <div className="absolute top-3 right-3">
          {renderStatusBadge && renderStatusBadge(info.Status || "Active")}
        </div>
      </div>

      {/* ==================================================================================
          PHẦN 2: NỘI DUNG CHÍNH
      ================================================================================== */}
      <div className="p-5 flex flex-col flex-1">
        {/* Tên khóa học */}
        <h3
          className="font-bold text-lg text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors"
          title={info.CourseName}
        >
          {info.CourseName}
        </h3>

        {/* Mô tả ngắn */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {info.Description || "Chưa có mô tả cho khóa học này."}
        </p>

        {/* Thông tin thống kê nhỏ (Chương / Bài học) */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5" title="Số chương">
              <Layers size={14} className="text-blue-500" />
              <span className="font-medium text-slate-600">
                {info.ChapterCount || 0} chương
              </span>
            </span>
            <span className="flex items-center gap-1.5" title="Số bài học">
              <FileText size={14} className="text-orange-500" />
              <span className="font-medium text-slate-600">
                {info.LessonCount || 0} bài
              </span>
            </span>
          </div>

          {/* Icon Info nhỏ */}
          <Info
            size={16}
            className="text-slate-300 group-hover:text-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialCourseCardItem;
