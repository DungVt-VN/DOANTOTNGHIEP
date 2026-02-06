import React, { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  BellRing,
  Star,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { Button, Tooltip } from "antd";
import RefreshButton from "@/components/RefreshButton";

// Config dayjs
dayjs.locale("vi");

// --- 1. COMPONENT CON: THẺ THỐNG KÊ ---
const StatCard = ({ icon, label, value, color, subText }) => (
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
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        {subText && <span className="text-xs text-gray-400">{subText}</span>}
      </div>
    </div>
  </div>
);

// --- 2. COMPONENT CON: MỤC LỊCH HỌC (CA HỌC) ---
const ScheduleItem = ({ className, time, room, teacher }) => {
  const now = dayjs();
  const [start, end] = time.split("-");

  const startTime = dayjs(start, "HH:mm");
  const endTime = dayjs(end, "HH:mm");
  const currentHour = now.format("HH:mm");
  const isFinished = currentHour > end;
  const isActive = currentHour >= start && currentHour <= end;

  let statusText = "Sắp học";
  let statusColor = "bg-blue-50 text-blue-700 border border-blue-100";

  if (isActive) {
    statusText = "Đang học";
    statusColor = "bg-green-50 text-green-700 border border-green-100";
  } else if (isFinished) {
    statusText = "Đã xong";
    statusColor = "bg-gray-50 text-gray-500 border border-gray-100";
  }

  return (
    <div className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors group">
      <div className="w-20 text-center mr-4 bg-slate-100 rounded-lg py-2">
        <span className="block text-sm font-bold text-slate-700">{start}</span>
        <span className="block text-xs text-slate-400">đến {end}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
          {className}
        </h4>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
            <MapPin size={12} /> {room || "Chưa xếp"}
          </span>
          {teacher && (
            <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
              Giáo viên: {teacher}
            </span>
          )}
        </div>
      </div>
      <div className="ml-2">
        <span
          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase whitespace-nowrap ${statusColor}`}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};

// --- 3. COMPONENT CON: THÔNG BÁO ---
const NotificationItem = ({ title, date, type }) => (
  <div className="flex gap-3 mb-4 last:mb-0 items-start">
    <div
      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
        type === "alert" ? "bg-red-500" : "bg-indigo-500"
      }`}
    />
    <div>
      <p className="text-sm text-gray-700 font-medium leading-snug hover:text-indigo-600 cursor-pointer transition-colors">
        {title}
      </p>
      <p className="text-xs text-gray-400 mt-1">{date}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const StudentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState({
    stats: { activeClasses: 0, pendingAssignments: 0 },
    todaySchedule: [],
    urgentTasks: [],
  });

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      if (!currentUser) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const res = await api.get(`/student/dashboard-stats`);
        if (res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const today = dayjs().format("dddd, DD MMMM YYYY");

  // Loading toàn trang lần đầu
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        {/* Left Side: Chào hỏi */}
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide first-letter:uppercase">
            {today}
          </p>
          <h1 className="text-3xl font-bold text-gray-800">
            Chào {currentUser?.FullName || "Bạn"}! 👋
          </h1>
          <p className="text-slate-600 mt-2">
            Sẵn sàng cho buổi học hôm nay chưa?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton
            onClick={fetchDashboard}
            loading={refreshing}
            minSpinTime={500}
          />
          <Link
            to="/student/schedule"
            className="hidden md:flex h-10 items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all border border-indigo-100 bg-white shadow-sm hover:shadow active:scale-95"
          >
            Xem lịch tuần này <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* STATS CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<BookOpen size={24} />}
          label="Lớp đang theo học"
          value={data?.stats?.activeClasses || 0}
          subText="khóa"
          color="bg-indigo-600"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          label="Bài tập về nhà"
          value={data?.stats?.pendingAssignments || 0}
          subText="bài chưa nộp"
          color={
            (data?.stats?.pendingAssignments || 0) > 0
              ? "bg-rose-500"
              : "bg-emerald-500"
          }
        />
        <StatCard
          icon={<Star size={24} />}
          label="Điểm kiểm tra gần nhất"
          value="9.0"
          subText="Toán (15p)"
          color="bg-amber-500"
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: NỘI DUNG CHÍNH (Chiếm 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Block 1: Ca học hôm nay */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Loading overlay nhẹ khi refresh */}
            {refreshing && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Ca học hôm
                nay
              </h3>
              <MoreHorizontal
                size={20}
                className="text-gray-400 cursor-pointer hover:text-gray-600"
              />
            </div>
            <div>
              {data?.todaySchedule?.length > 0 ? (
                data.todaySchedule.map((item, index) => (
                  <ScheduleItem
                    key={index}
                    className={item.ClassName}
                    time={`${item.StartTime?.slice(0, 5)}-${item.EndTime?.slice(
                      0,
                      5
                    )}`}
                    room={item.RoomName}
                    teacher={item.TeacherName}
                  />
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex bg-slate-100 p-4 rounded-full mb-3 text-slate-400">
                    <Calendar size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Hôm nay bạn không có lịch học.
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Hãy dành thời gian ôn bài hoặc làm bài tập nhé!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Block 2: BÀI TẬP & NHẮC NHỞ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Loading overlay */}
            {refreshing && (
              <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-[1px]"></div>
            )}

            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-rose-500" /> Bài tập cần nộp
              </h3>
              <Link
                to="/student/assignments"
                className="text-xs text-indigo-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <div>
              {data?.urgentTasks?.length > 0 ? (
                data.urgentTasks.map((task) => {
                  const daysLeft = dayjs(task.DueDate).diff(dayjs(), "day");
                  const isUrgent = daysLeft < 1;

                  return (
                    <div
                      key={task.AssignmentId}
                      className="flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="mr-4">
                        <div
                          className={`p-3 rounded-full ${
                            isUrgent
                              ? "bg-rose-50 text-rose-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          <FileText size={20} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {task.Title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Lớp: {task.ClassName}
                        </p>
                      </div>
                      <div className="text-right min-w-[90px]">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block mb-1 ${
                            isUrgent
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {isUrgent ? "Hạn chót" : `${daysLeft} ngày nữa`}
                        </span>
                        <p className="text-xs text-gray-400">
                          {dayjs(task.DueDate).format("HH:mm DD/MM")}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex bg-emerald-50 p-4 rounded-full mb-3 text-emerald-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Tuyệt vời! Bạn đã hoàn thành hết bài tập.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR WIDGETS (Chiếm 1/3) */}
        <div className="space-y-6">
          {/* Block: Menu Nhanh */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Menu nhanh
            </h3>
            <div className="space-y-3">
              <Link
                to="/student/tuition"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Tra cứu học phí
                </span>
              </Link>

              <Link
                to="/student/register-class"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Đăng ký lớp mới
                </span>
              </Link>

              <Link
                to="/student/schedule"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Clock size={20} />
                </div>
                <span className="font-medium text-gray-700">
                  Thời khóa biểu
                </span>
              </Link>
            </div>
          </div>

          {/* Block: Thông báo */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <BellRing size={16} /> Thông báo
              </h3>
              <Link
                to="/student/notifications"
                className="text-xs text-indigo-600 hover:underline"
              >
                Chi tiết
              </Link>
            </div>

            <div className="space-y-4">
              <NotificationItem
                title="Lịch nghỉ lễ Quốc Khánh 2/9"
                date="20/08/2024"
                type="info"
              />
              <NotificationItem
                title="Nhắc nhở: Đóng học phí tháng 9"
                date="25/08/2024"
                type="alert"
              />
              <NotificationItem
                title="Khai giảng lớp Luyện thi IELTS 6.5+"
                date="22/08/2024"
                type="info"
              />
              <NotificationItem
                title="Có kết quả thi thử Toán 12"
                date="18/08/2024"
                type="info"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
