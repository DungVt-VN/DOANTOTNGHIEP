import React, { useEffect, useState } from "react";
import api from "@/utils/axiosInstance";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
  CalendarDays,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isoWeek from "dayjs/plugin/isoWeek";
import { Badge, Modal, Tag } from "antd";

// --- CẤU HÌNH DAYJS ---
dayjs.extend(isoWeek);
dayjs.locale("vi");

// --- SKELETON LOADING (Giữ nguyên cho đẹp) ---
const ScheduleSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-full">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-gray-100"
      >
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    ))}
  </div>
);

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());

  // State Modal chi tiết (nếu cần)
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- 1. LOGIC NGÀY THÁNG ---
  const startOfWeek = currentDate.startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day")
  );

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        // API này trả về danh sách sự kiện đã "phẳng hóa" theo ngày
        // (bao gồm cả lịch sử điểm danh và lịch tương lai)
        const res = await api.get("/student/schedule");
        setSchedule(res.data);
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchSchedule();
  }, []);

  // --- 3. HELPER: LỌC LỊCH THEO NGÀY CỤ THỂ ---
  const getScheduleForDate = (dateObj) => {
    const dateString = dateObj.format("YYYY-MM-DD");
    return schedule
      .filter((item) => dayjs(item.Date).format("YYYY-MM-DD") === dateString)
      .sort((a, b) => (a.StartTime || "").localeCompare(b.StartTime || ""));
  };

  // --- 4. HELPER: MÀU SẮC & TRẠNG THÁI ---
  const getStatusConfig = (status, date) => {
    // Nếu ngày đã qua mà chưa có trạng thái -> Coi như chưa điểm danh hoặc vắng
    const isPast = date.isBefore(dayjs(), "day");

    if (status === "Present")
      return {
        color: "bg-green-50 border-green-500 text-green-800",
        icon: <CheckCircle size={14} />,
        label: "Có mặt",
      };
    if (status === "Absent")
      return {
        color: "bg-red-50 border-red-500 text-red-800",
        icon: <XCircle size={14} />,
        label: "Vắng",
      };
    if (status === "Late")
      return {
        color: "bg-yellow-50 border-yellow-500 text-yellow-800",
        icon: <AlertTriangle size={14} />,
        label: "Muộn",
      };

    // Chưa diễn ra hoặc chưa điểm danh
    if (isPast)
      return {
        color: "bg-gray-50 border-gray-400 text-gray-500",
        icon: <Clock size={14} />,
        label: "Kết thúc",
      };

    // Mặc định: Sắp học
    return {
      color: "bg-blue-50 border-blue-500 text-blue-800 hover:bg-blue-100",
      icon: <Calendar size={14} />,
      label: "Sắp học",
    };
  };

  // --- 5. HANDLERS ---
  const nextWeek = () => setCurrentDate(currentDate.add(1, "week"));
  const prevWeek = () => setCurrentDate(currentDate.subtract(1, "week"));
  const goToday = () => setCurrentDate(dayjs());
  const handleDateChange = (e) =>
    e.target.value && setCurrentDate(dayjs(e.target.value));

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={28} />
            Thời khóa biểu
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Lịch học tuần: {startOfWeek.format("DD/MM")} -{" "}
            {startOfWeek.add(6, "day").format("DD/MM")}
          </p>
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="date"
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
              onChange={handleDateChange}
              value={currentDate.format("YYYY-MM-DD")}
            />
            <CalendarDays
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>

          <button
            onClick={goToday}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 shadow-sm transition-colors text-sm font-medium"
          >
            <RefreshCw size={14} /> Hôm nay
          </button>

          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 font-bold text-gray-800 min-w-[100px] text-center text-sm">
              Tuần {startOfWeek.isoWeek()}
            </div>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- GRID LỊCH HỌC --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {loading ? (
          <ScheduleSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 min-h-full">
            {weekDays.map((date, index) => {
              const isToday = date.isSame(dayjs(), "day");
              const dailyEvents = getScheduleForDate(date);

              return (
                <div
                  key={index}
                  className={`flex flex-col rounded-xl border transition-all duration-300 h-full min-h-[300px] ${
                    isToday
                      ? "bg-blue-50/30 border-blue-300 ring-1 ring-blue-200"
                      : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  {/* HEADER NGÀY */}
                  <div
                    className={`p-3 text-center border-b rounded-t-xl ${
                      isToday
                        ? "bg-blue-100/50 border-blue-200"
                        : "bg-gray-50/50 border-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase block mb-1 ${
                        isToday ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {date.format("dddd")}
                    </span>
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        isToday
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-700"
                      }`}
                    >
                      {date.format("DD")}
                    </div>
                  </div>

                  {/* BODY: DANH SÁCH BUỔI HỌC */}
                  <div className="p-2 flex-1 flex flex-col gap-2">
                    {dailyEvents.length > 0 ? (
                      dailyEvents.map((evt, idx) => {
                        const statusConfig = getStatusConfig(
                          evt.AttendanceStatus,
                          date
                        );

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedEvent(evt)}
                            className={`p-3 rounded-lg border border-l-[4px] shadow-sm hover:shadow-md cursor-pointer transition-all group active:scale-95 ${statusConfig.color}`}
                          >
                            {/* TIME & STATUS */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider backdrop-blur-sm">
                                <Clock size={10} />
                                {evt.StartTime?.slice(0, 5)} -{" "}
                                {evt.EndTime?.slice(0, 5)}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                {statusConfig.icon} {statusConfig.label}
                              </div>
                            </div>

                            {/* CLASS NAME */}
                            <h4 className="font-bold text-sm leading-tight mb-2 group-hover:underline line-clamp-2">
                              {evt.ClassName}
                            </h4>

                            {/* LOCATION & TEACHER */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                                <MapPin size={12} />
                                <span>{evt.RoomName || "Online"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                                <User size={12} />
                                <span>{evt.TeacherName || "GV"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // TRẠNG THÁI TRỐNG
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 opacity-60 min-h-[150px]">
                        <div className="p-2 bg-gray-50 rounded-full">
                          <BookOpen size={20} />
                        </div>
                        <span className="text-xs font-medium">
                          Không có lịch
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT (Đơn giản) */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar size={20} /> Chi tiết buổi học
          </div>
        }
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        centered
      >
        {selectedEvent && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h3 className="font-bold text-xl text-slate-800 mb-1">
                {selectedEvent.ClassName}
              </h3>
              <p className="text-slate-500 text-sm">
                Ngày: {dayjs(selectedEvent.Date).format("DD/MM/YYYY")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="font-medium">
                    {selectedEvent.StartTime?.slice(0, 5)} -{" "}
                    {selectedEvent.EndTime?.slice(0, 5)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phòng học</p>
                  <p className="font-medium">
                    {selectedEvent.RoomName || "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Giảng viên</p>
                  <p className="font-medium">{selectedEvent.TeacherName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Điểm danh</p>
                  <p className="font-medium">
                    {selectedEvent.AttendanceStatus === "Present" ? (
                      <Tag color="green">Có mặt</Tag>
                    ) : selectedEvent.AttendanceStatus === "Absent" ? (
                      <Tag color="red">Vắng</Tag>
                    ) : selectedEvent.AttendanceStatus === "Late" ? (
                      <Tag color="gold">Muộn</Tag>
                    ) : (
                      <Tag>Chưa cập nhật</Tag>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentSchedule;
