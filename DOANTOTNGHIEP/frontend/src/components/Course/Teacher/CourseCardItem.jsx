import React, { useState } from "react";
import {
  ChevronDown,
  Users,
  Layers,
  Clock,
  Calendar,
  MapPin,
  Banknote,
  Info,
  CalendarRange,
  ArrowRight,
} from "lucide-react";

// --- HELPER FORMAT TIỀN TỆ ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// --- HELPER FORMAT NGÀY ---
const formatDate = (dateString) => {
  if (!dateString) return "..";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const CourseCardItem = ({ course, renderStatusBadge, navigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. CHUẨN HÓA DỮ LIỆU
  const info = course;
  const classes = course.Classes || [];

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
        isExpanded
          ? "border-blue-300 ring-2 ring-blue-50/50 shadow-md"
          : "border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1"
      }`}
    >
      {/* ==================================================================================
          PHẦN 1: HEADER CARD (ẢNH BÌA & THÔNG TIN CHÍNH)
      ================================================================================== */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer group relative flex-shrink-0"
      >
        {/* --- ẢNH BÌA --- */}
        <div className="h-44 relative bg-slate-100">
          <img
            src={
              info.CourseImage ||
              "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop"
            }
            alt={info.CourseName}
            className="w-full h-full object-cover transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>

          {/* Badge Môn học */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm">
              {info.Subject || "Môn học"}
            </span>
          </div>

          {/* Badge Học phí */}
          {info.BaseTuitionFee > 0 && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/90 backdrop-blur-md text-xs font-bold text-white shadow-sm">
                <Banknote size={12} /> {formatCurrency(info.BaseTuitionFee)}
              </span>
            </div>
          )}

          {/* Thông tin chính */}
          <div className="absolute rounded-t-2xl bottom-3 left-4 right-4 text-white">
            <h3
              className="font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm mb-1"
              title={info.CourseName}
            >
              {info.CourseName}
            </h3>

            <div className="text-[11px] text-slate-300 mb-2 flex items-start gap-1">
              {/* Icon: Thêm shrink-0 để không bị méo, mt-0.5 để căn đều với dòng đầu tiên */}
              <Info size={12} className="shrink-0 mt-0.5" />

              {/* Text: Áp dụng line-clamp-2 tại đây */}
              <span className="line-clamp-2">
                {info.Description || "Không có mô tả thêm"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
              <span className="flex items-center gap-1">
                <Layers size={14} className="text-blue-400" /> {info.ClassCount}{" "}
                Lớp
              </span>

              <span className="w-1 h-1 bg-slate-500 rounded-full"></span>

              <span className="flex items-center gap-1">
                <Users size={14} className="text-orange-400" />{" "}
                {info.TotalStudents} Học viên
              </span>
            </div>
          </div>
        </div>

        {/* Thanh trạng thái loading (Optional visual effect) */}
        <div className="h-0.5 rounded-t-2xl bg-slate-100 w-full overflow-hidden">
          <div
            className={`h-full bg-blue-500 transition-all duration-500 ${
              isExpanded ? "w-full" : "w-0"
            }`}
          ></div>
        </div>
      </div>

      {/* ==================================================================================
          PHẦN 2: FOOTER TOGGLE
      ================================================================================== */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between cursor-pointer group/footer hover:bg-blue-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold transition-colors ${
              isExpanded
                ? "text-blue-600"
                : "text-slate-500 group-hover/footer:text-blue-600"
            }`}
          >
            {isExpanded ? "Thu gọn danh sách" : "Xem danh sách lớp học"}
          </span>
          {!isExpanded && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-600 font-bold">
              {classes.length}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-300 group-hover/footer:text-blue-500 ${
            isExpanded ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </div>

      {/* ==================================================================================
          PHẦN 3: DANH SÁCH LỚP HỌC
      ================================================================================== */}
      <div
        className={`bg-white transition-all duration-500 ease-in-out origin-top ${
          isExpanded
            ? "max-h-[600px] opacity-100 overflow-y-auto custom-scrollbar border-t border-gray-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-3 space-y-3">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div
                key={cls.ClassId}
                // --- SỰ KIỆN CLICK CHUYỂN HƯỚNG ---
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacher/course/class/${cls.ClassId}`);
                }}
                className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group/item relative"
              >
                {/* Dòng 1: Tên + Status */}
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <h4
                      className="font-bold text-slate-700 text-sm group-hover/item:text-blue-600 transition-colors"
                      title={cls.ClassName}
                    >
                      {cls.ClassName || cls.CourseName}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Mã lớp: #{cls.ClassId} • Sĩ số: {cls.StudentCount}
                    </p>
                  </div>
                  {renderStatusBadge && renderStatusBadge(cls.Status)}
                </div>

                {/* Dòng 2: Grid thông tin chi tiết */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  {/* Ngày trong tuần */}
                  <div className="flex items-center gap-1.5" title="Lịch học">
                    <Calendar size={13} className="text-orange-500" />
                    <span className="truncate">
                      {cls.Days ? cls.Days.replace(/Thứ /g, "T") : "Chưa xếp"}
                    </span>
                  </div>

                  {/* Giờ học */}
                  <div className="flex items-center gap-1.5" title="Giờ học">
                    <Clock size={13} className="text-blue-500" />
                    <span>
                      {cls.StartTime?.slice(0, 5)} - {cls.EndTime?.slice(0, 5)}
                    </span>
                  </div>

                  {/* Thời gian khóa học */}
                  <div
                    className="flex items-center gap-1.5 col-span-2"
                    title="Thời gian khóa học"
                  >
                    <CalendarRange size={13} className="text-purple-500" />
                    <span className="truncate font-medium text-slate-600">
                      {formatDate(cls.StartDate)} - {formatDate(cls.EndDate)}
                    </span>
                  </div>

                  {/* Phòng học */}
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin size={13} className="text-emerald-500" />
                    <span className="truncate">
                      {cls.RoomName || "Chưa xếp phòng"}{" "}
                      {cls.Location ? `- ${cls.Location}` : ""}
                    </span>
                  </div>
                </div>

                {/* Mũi tên Action */}
                <div className="absolute right-4 bottom-4 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all duration-300 text-blue-600">
                  <ArrowRight size={18} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 italic flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <Layers size={20} />
              </div>
              <p>Chưa có lớp học phần nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCardItem;
