import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import {
  Users,
  BookOpen,
  FileCheck,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  PlusCircle,
  Bell,
  MoreHorizontal,
} from "lucide-react";

// --- COMPONENT CON: THẺ THỐNG KÊ ---
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div
      className={`p-4 rounded-full ${color} text-white shadow-lg shadow-${color.replace(
        "bg-",
        ""
      )}/30`}
    >
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  </div>
);

// --- COMPONENT CON: MỤC LỊCH DẠY ---
const ScheduleItem = ({ className, time, room, status }) => {
  // Status color logic
  const statusColors = {
    upcoming: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    finished: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="w-16 text-center mr-4">
        <span className="block text-sm font-bold text-gray-800">
          {time.split("-")[0]}
        </span>
        <span className="block text-xs text-gray-500">
          {time.split("-")[1]}
        </span>
      </div>
      <div className="flex-1 border-l-2 border-blue-500 pl-4">
        <h4 className="font-bold text-gray-800 text-sm">{className}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} /> {room}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              statusColors[status] || statusColors.upcoming
            }`}
          >
            {status === "active"
              ? "Đang diễn ra"
              : status === "finished"
              ? "Đã xong"
              : "Sắp tới"}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CON: HOẠT ĐỘNG GẦN ĐÂY ---
const ActivityItem = ({ title, time, type }) => (
  <div className="flex gap-3 mb-4 last:mb-0 items-start">
    <div
      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
        type === "submission" ? "bg-green-500" : "bg-blue-500"
      }`}
    />
    <div>
      <p className="text-sm text-gray-700 font-medium leading-tight">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{time}</p>
    </div>
  </div>
);

const TeacherDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeClasses: 0,
    totalStudents: 0,
    pendingGrading: 0,
  });

  // State giả lập cho Lịch dạy & Hoạt động (Thay bằng API thật sau này)
  const [todaysSchedule, setTodaysSchedule] = useState([
    {
      id: 1,
      className: "Toán 10A1 - Đại số",
      time: "08:00-09:30",
      room: "P.101",
      status: "finished",
    },
    {
      id: 2,
      className: "Toán 11B2 - Hình học",
      time: "09:45-11:15",
      room: "Lab 2",
      status: "active",
    },
    {
      id: 3,
      className: "Luyện thi ĐH - Nhóm 1",
      time: "14:00-16:00",
      room: "P.205",
      status: "upcoming",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/teacher/stats/${currentUser.TeacherId}`);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (currentUser?.TeacherId) fetchStats();
  }, [currentUser]);

  // Lấy ngày hiện tại
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">
            {today}
          </p>
          <h1 className="text-3xl font-bold text-gray-800">
            Xin chào, Giảng viên {currentUser?.FullName} 👋
          </h1>
          <p className="text-slate-600 mt-2">
            Chúc bạn một ngày giảng dạy hiệu quả!
          </p>
        </div>
        <Link
          to="/teacher/schedule"
          className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
        >
          Xem lịch đầy đủ <ArrowRight size={18} />
        </Link>
      </div>

      {/* STATS CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<BookOpen size={24} />}
          label="Lớp đang phụ trách"
          value={stats.activeClasses}
          color="bg-blue-600"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Tổng số học sinh"
          value={stats.totalStudents}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<FileCheck size={24} />}
          label="Bài tập cần chấm"
          value={stats.pendingGrading}
          color="bg-amber-500"
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: LỊCH DẠY (Chiếm 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Block: Lịch hôm nay */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" /> Lịch dạy hôm
                nay
              </h3>
              <MoreHorizontal
                size={20}
                className="text-gray-400 cursor-pointer"
              />
            </div>
            <div>
              {todaysSchedule.length > 0 ? (
                todaysSchedule.map((item) => (
                  <ScheduleItem key={item.id} {...item} />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Hôm nay không có lịch dạy nào.
                </div>
              )}
            </div>
          </div>

          {/* Block: Gợi ý hoặc Tin tức (Optional) */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Ngân hàng câu hỏi mới?</h3>
              <p className="text-indigo-100 text-sm mb-4 max-w-md">
                Hệ thống vừa cập nhật thêm tính năng Import câu hỏi từ Excel.
                Hãy thử tạo đề thi nhanh hơn ngay hôm nay.
              </p>
              <Link
                to="/teacher/question-bank"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
              >
                Thử ngay
              </Link>
            </div>
            {/* Decoration circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR WIDGETS (Chiếm 1/3) */}
        <div className="space-y-6">
          {/* Block: Truy cập nhanh */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Truy cập nhanh
            </h3>
            <div className="space-y-3">
              <Link
                to="/teacher/assignments"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <PlusCircle size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Tạo bài tập mới
                </span>
              </Link>

              <Link
                to="/teacher/question-bank"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <BookOpen size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Soạn ngân hàng câu hỏi
                </span>
              </Link>

              <Link
                to="/teacher/schedule"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Clock size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Xem thời khóa biểu tuần
                </span>
              </Link>
            </div>
          </div>

          {/* Block: Hoạt động gần đây */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                Hoạt động mới
              </h3>
              <Link
                to="/teacher/notifications"
                className="text-xs text-blue-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-4">
              <ActivityItem
                title="Nguyễn Văn A vừa nộp bài tập Toán"
                time="10 phút trước"
                type="submission"
              />
              <ActivityItem
                title="Hệ thống thông báo bảo trì"
                time="1 giờ trước"
                type="system"
              />
              <ActivityItem
                title="Lớp 11B2 có lịch học bù"
                time="2 giờ trước"
                type="system"
              />
              <ActivityItem
                title="Trần Thị B vừa nộp bài tập Lý"
                time="3 giờ trước"
                type="submission"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
