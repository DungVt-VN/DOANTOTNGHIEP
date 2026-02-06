import React, { useContext, useEffect, useState } from "react";
import api from "@/utils/axiosInstance";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  BookOpen,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isoWeek from "dayjs/plugin/isoWeek";
import { Modal, Tag, Tooltip, Skeleton, Button } from "antd";
import { AuthContext } from "@/context/authContext";

// ================== CONFIG ==================
dayjs.extend(isoWeek);
dayjs.locale("vi");

const STATUS_CONFIG = {
  Present: {
    color: "green",
    icon: <CheckCircle2 size={14} />,
    label: "Có mặt",
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-800",
  },
  Absent: {
    color: "red",
    icon: <XCircle size={14} />,
    label: "Vắng",
    bg: "bg-red-50",
    border: "border-red-500",
    text: "text-red-800",
  },
  Late: {
    color: "gold",
    icon: <AlertTriangle size={14} />,
    label: "Muộn",
    bg: "bg-yellow-50",
    border: "border-yellow-500",
    text: "text-yellow-800",
  },
  Upcoming: {
    color: "blue",
    icon: <Calendar size={14} />,
    label: "Sắp tới",
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-800",
  },
  Finished: {
    color: "default",
    icon: <Clock size={14} />,
    label: "Kết thúc",
    bg: "bg-gray-50",
    border: "border-gray-400",
    text: "text-gray-500",
  },
};

// ================== SKELETON LOADING ==================
const ScheduleSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-full">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-gray-100"
      >
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    ))}
  </div>
);

// ================== MAIN COMPONENT ==================
const StudentSchedule = () => {
  const { currentUser } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ===== WEEK LOGIC =====
  const startOfWeek = currentDate.startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day"),
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      // Đảm bảo có studentId trước khi gọi API
      if (!currentUser?.StudentId && !currentUser?.studentId) return;

      setLoading(true);
      try {
        const startDate = startOfWeek.format("YYYY-MM-DD");
        const endDate = startOfWeek.add(6, "day").format("YYYY-MM-DD");

        const res = await api.get("/classes/student-schedule-by-week", {
          params: {
            studentId: currentUser.StudentId || currentUser.studentId,
            startDate,
            endDate,
          },
        });

        setSchedule(res.data || []);
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
        setSchedule([]);
      } finally {
        // Giả lập delay nhỏ để hiệu ứng loading mượt hơn
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchSchedule();
  }, [currentDate, currentUser]); // Thêm dependencies để reload khi đổi tuần/user

  // ===== HELPERS =====
  // Hàm lọc sự kiện cho từng ngày (Sử dụng logic ClassName/StartDate/EndDate của bạn)
  const getEventsForDay = (day) => {
    const dateString = day.format("YYYY-MM-DD");
    // Logic lọc dựa trên API trả về (Giả sử API trả về list các buổi học cụ thể hoặc list lớp học lặp lại)
    // Nếu API trả về list Class (lặp lại theo thứ):
    const dayOfWeek = day.day() === 0 ? 8 : day.day() + 1; // CN là 8

    return schedule
      .filter((cls) => {
        // 1. Kiểm tra ngày học nằm trong khoảng thời gian của lớp
        const isWithinRange =
          dayjs(cls.ClassStartDate).format("YYYY-MM-DD") <= dateString &&
          dayjs(cls.ClassEndDate).format("YYYY-MM-DD") >= dateString;
        // 2. Kiểm tra thứ trong tuần (cls.Days: "2,4,6")
        const isCorrectDay = cls.Days.split(",").includes(dayOfWeek.toString());

        return isWithinRange && isCorrectDay;
      })
      .sort((a, b) => a.StartTime.localeCompare(b.StartTime));
  };

  const getStatus = (evt, date) => {
    // Logic xác định trạng thái hiển thị
    const now = dayjs();
    // Tạo object thời gian kết thúc của buổi học
    const eventEnd = dayjs(`${date.format("YYYY-MM-DD")} ${evt.EndTime}`);

    if (evt.AttendanceStatus) return STATUS_CONFIG[evt.AttendanceStatus]; // Đã điểm danh
    if (now.isAfter(eventEnd)) return STATUS_CONFIG.Finished; // Đã qua giờ
    return STATUS_CONFIG.Upcoming; // Chưa tới giờ
  };

  // ===== HANDLERS =====
  const nextWeek = () => setCurrentDate(currentDate.add(1, "week"));
  const prevWeek = () => setCurrentDate(currentDate.subtract(1, "week"));
  const goToday = () => setCurrentDate(dayjs());
  const handleDateChange = (e) =>
    e.target.value && setCurrentDate(dayjs(e.target.value));

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col h-screen overflow-hidden">
      {/* --- HEADER (Giữ nguyên) --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <CalendarDays className="text-indigo-600" />
            Thời khóa biểu
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Tuần {startOfWeek.isoWeek()} ({startOfWeek.format("DD/MM")} -{" "}
            {startOfWeek.add(6, "day").format("DD/MM")})
          </p>
        </div>

        <div className="flex gap-3 items-center bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <div className="relative">
            <input
              type="date"
              className="pl-9 pr-3 py-2 border-none bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
              value={currentDate.format("YYYY-MM-DD")}
              onChange={handleDateChange}
            />
            <Calendar
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <button
            onClick={goToday}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Hôm nay
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- GRID LỊCH HỌC --- */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ScheduleSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 pb-4">
            {weekDays.map((date, idx) => {
              const events = getEventsForDay(date);
              const isToday = date.isSame(dayjs(), "day");

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border flex flex-col transition-all duration-300 ${
                    isToday
                      ? "border-indigo-300 bg-indigo-50/30 ring-2 ring-indigo-100 shadow-md"
                      : "bg-white border-slate-200 hover:shadow-sm"
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-3 text-center border-b ${isToday ? "border-indigo-200 bg-indigo-100/50" : "border-slate-100"}`}
                  >
                    <div
                      className={`text-xs uppercase font-bold mb-1 ${isToday ? "text-indigo-600" : "text-slate-400"}`}
                    >
                      {date.format("dddd")}
                    </div>
                    <div
                      className={`text-lg font-extrabold ${isToday ? "text-indigo-700" : "text-slate-700"}`}
                    >
                      {date.format("DD")}
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="p-2 flex-1 flex flex-col gap-2 min-h-[150px]">
                    {events.length > 0 ? (
                      events.map((evt, i) => {
                        const status = getStatus(evt, date);
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              setSelectedEvent({
                                ...evt,
                                dateStr: date.format("DD/MM/YYYY"),
                              })
                            }
                            className={`
                                relative p-3 rounded-xl border-l-[3px] cursor-pointer transition-all duration-200
                                hover:-translate-y-0.5 hover:shadow-md bg-white shadow-sm border border-slate-100
                                ${status.border.replace("border-", "border-l-")} 
                            `}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                {evt.StartTime?.slice(0, 5)}
                              </span>
                              <Tooltip title={status.label}>
                                <div className={status.text}>{status.icon}</div>
                              </Tooltip>
                            </div>

                            <h4 className="font-bold text-xs text-slate-800 line-clamp-2 mb-1.5 leading-snug">
                              {evt.ClassName}
                            </h4>

                            <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <MapPin size={10} /> {evt.RoomName}
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={10} /> {evt.TeacherName}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center text-slate-300 opacity-60">
                        <BookOpen
                          size={24}
                          className="mb-1"
                          strokeWidth={1.5}
                        />
                        <span className="text-[10px] font-medium">Trống</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT (Đã fix lỗi 2 nền) --- */}
      <Modal
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        title={null} // Tắt title mặc định
        closeIcon={null} // Tắt nút X mặc định
        centered
        width={420}
        styles={{
          content: { padding: 0, overflow: "hidden", borderRadius: "16px" },
        }} // Reset padding của content về 0
      >
        {selectedEvent && (
          <div className="flex flex-col h-full">
            {" "}
            {/* Container chính */}
            {/* 1. Custom Header (Màu xanh) */}
            <div className="bg-indigo-600 p-6 text-white relative">
              {/* Nút đóng */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <XCircle size={20} />
              </button>

              {/* Ngày tháng */}
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} /> {selectedEvent.dateStr}
              </div>

              {/* Tên lớp học */}
              <h3 className="text-xl font-bold leading-tight mb-1 text-white">
                {selectedEvent.ClassName}
              </h3>

              {/* Tên môn học */}
              <p className="text-indigo-100 text-sm opacity-90 font-medium">
                {selectedEvent.CourseName}
              </p>
            </div>
            {/* 2. Custom Body (Màu trắng) */}
            <div className="p-6 bg-white flex flex-col gap-6">
              {/* Info Block: Thời gian & Ảnh */}
              <div className="flex items-start gap-4">
                {selectedEvent.CourseImage && (
                  <img
                    src={selectedEvent.CourseImage}
                    alt="Course"
                    className="w-16 h-16 rounded-xl object-cover shadow-sm border border-slate-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Tag
                    color="blue"
                    className="mb-2 border-0 bg-blue-50 text-blue-700 font-bold"
                  >
                    {selectedEvent.Subject || "Môn học"}
                  </Tag>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Clock size={16} className="text-indigo-500" />
                    <span>
                      {selectedEvent.StartTime?.slice(0, 5)} -{" "}
                      {selectedEvent.EndTime?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Block: Chi tiết */}
              <div className="space-y-3">
                {/* Phòng học */}
                <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      Phòng học
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {selectedEvent.RoomName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {selectedEvent.Location || "Khu vực chính"}
                    </p>
                  </div>
                </div>

                {/* Giảng viên */}
                <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-purple-500 shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      Giảng viên
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {selectedEvent.TeacherName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono">
                  ID: {selectedEvent.ClassId}
                </span>
                <Button
                  type="primary"
                  className="bg-indigo-600 h-9 px-6 rounded-lg font-semibold shadow-md shadow-indigo-200"
                  onClick={() => setSelectedEvent(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentSchedule;
