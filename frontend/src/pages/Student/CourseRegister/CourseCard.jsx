import React from "react";
import { Tooltip } from "antd";
import { ArrowRight } from "lucide-react";

const CourseCard = ({ course, onClick }) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col h-full transform hover:-translate-y-1"
      onClick={() => onClick(course)}
    >
      {/* --- Top Section: Image & Overlay --- */}
      <div className="h-44 bg-gray-100 relative overflow-hidden">
        <img
          src={
            course.CourseImage ||
            "https://placehold.co/600x400/f1f5f9/94a3b8?text=EduCenter"
          }
          alt={course.CourseName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Subject Tag */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-md text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
            {course.Subject}
          </span>
        </div>

        {/* Teachers Avatars */}
        {course.Teachers && course.Teachers.length > 0 && (
          <div className="absolute bottom-3 left-3 flex -space-x-2">
            {course.Teachers.slice(0, 3).map((t, idx) => (
              <Tooltip key={idx} title={t.FullName}>
                <img
                  src={
                    t.Avatar ||
                    `https://ui-avatars.com/api/?name=${t.FullName}&background=random`
                  }
                  alt={t.FullName}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                />
              </Tooltip>
            ))}
            {course.Teachers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-white/90 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                +{course.Teachers.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Quick View Button */}
        <div className="absolute bottom-3 right-3 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-transform">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* --- Bottom Section: Info --- */}
      <div className="p-5 flex flex-col flex-1">
        <Tooltip title={course.CourseName}>
          <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {course.CourseName}
          </h3>
        </Tooltip>

        <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">
          {course.Description || "Thông tin chi tiết đang cập nhật."}
        </p>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Học phí gốc
            </p>
            <p className="text-base font-bold text-indigo-700">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(course.BaseTuitionFee)}
            </p>
          </div>
          {course.OpenClassesCount > 0 && (
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              {course.OpenClassesCount} lớp mở
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;