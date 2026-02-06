import React from "react";
import {
  BookOpen,
  CheckCircle,
  Trophy,
  Clock,
  Star,
  Calendar,
  MonitorPlay,
  AlertCircle,
} from "lucide-react";

// --- HELPER: Format Day ---
const formatDay = (day) => {
  const d = String(day).trim();
  if (d === "8") return "Chủ nhật";
  return `Thứ ${d}`;
};

// --- HELPER: Format Date ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

// Sub-component StatCard
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={color.replace("bg-", "text-")} />
    </div>
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ClassOverview = ({
  classInfo,
  stats,
  assignments,
  quizzes,
  notifications,
}) => {
  // --- TÍNH TOÁN X/Y ---

  // 1. Bài tập: Đếm số bài đã nộp (SubmissionStatus có dữ liệu)
  const totalAssignments = assignments?.length || 0;
  const submittedAssignments =
    assignments?.filter((a) => a.SubmissionStatus).length || 0;

  // 2. Bài kiểm tra: Đếm số bài đã làm (StudentScore không phải null)
  const totalQuizzes = quizzes?.length || 0;
  const completedQuizzes =
    quizzes?.filter((q) => q.StudentScore !== null).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Bài học */}
        <StatCard
          icon={BookOpen}
          label="Bài học"
          value={`${stats.CompletedLessons}/${stats.TotalLessons}`}
          color="bg-blue-500"
        />

        {/* Bài tập (x/y) */}
        <StatCard
          icon={CheckCircle}
          label="Bài tập"
          value={`${submittedAssignments}/${totalAssignments}`}
          color="bg-green-500"
        />

        {/* Bài kiểm tra (x/y) */}
        <StatCard
          icon={Trophy}
          label="Bài kiểm tra"
          value={`${completedQuizzes}/${totalQuizzes}`}
          color="bg-yellow-500"
        />

        {/* Thời gian */}
        <StatCard
          icon={Clock}
          label="Thời gian"
          value={`${stats.TimeProgress}%`}
          color="bg-purple-500"
        />
      </div>

      {/* 2. Description & Info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400" size={20} /> Thông
          tin lớp học
        </h3>
        <div className="prose max-w-none text-gray-600 text-sm leading-relaxed mb-6">
          {classInfo.Description}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {/* --- CỘT LỊCH HỌC (ĐÃ SỬA) --- */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">
                Lịch học
              </p>
              {/* Thứ & Giờ */}
              <p className="font-semibold text-sm text-gray-700">
                {formatDay(classInfo.Schedule.Days)} (
                {classInfo.Schedule.StartTime?.slice(0, 5)} -{" "}
                {classInfo.Schedule.EndTime?.slice(0, 5)})
              </p>
              {/* Ngày bắt đầu - Ngày kết thúc (MỚI THÊM) */}
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(classInfo.Schedule.StartDate)} -{" "}
                {formatDate(classInfo.Schedule.EndDate)}
              </p>
            </div>
          </div>

          {/* --- CỘT PHÒNG HỌC --- */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
              <MonitorPlay size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">
                Phòng học
              </p>
              <p className="font-semibold text-sm text-gray-700">
                {classInfo.Schedule.Room} - {classInfo.Schedule.Location}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} /> Thông báo mới
          </h3>
          <div className="space-y-4">
            {notifications.slice(0, 3).map((noti) => (
              <div
                key={noti.NotiId}
                className="flex gap-3 items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {noti.Title}
                  </h4>
                  <p className="text-gray-500 text-xs mt-1">{noti.Message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassOverview;
