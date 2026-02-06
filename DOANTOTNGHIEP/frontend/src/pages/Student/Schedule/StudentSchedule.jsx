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

// ================== DAYJS ==================
dayjs.extend(isoWeek);
dayjs.locale("vi");

// ================== MOCK DATA ==================
const MOCK_SCHEDULE = [
  {
    Date: dayjs().format("YYYY-MM-DD"),
    StartTime: "08:00",
    EndTime: "10:00",
    ClassName: "Lập trình Web nâng cao",
    RoomName: "Phòng A203",
    TeacherName: "Nguyễn Văn A",
    AttendanceStatus: "Present",
  },
  {
    Date: dayjs().format("YYYY-MM-DD"),
    StartTime: "13:30",
    EndTime: "15:30",
    ClassName: "Cơ sở dữ liệu",
    RoomName: "Phòng B105",
    TeacherName: "Trần Thị B",
    AttendanceStatus: "Late",
  },
  {
    Date: dayjs().add(1, "day").format("YYYY-MM-DD"),
    StartTime: "09:00",
    EndTime: "11:00",
    ClassName: "Phân tích & thiết kế hệ thống",
    RoomName: "Online",
    TeacherName: "Lê Văn C",
    AttendanceStatus: null,
  },
  {
    Date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    StartTime: "15:00",
    EndTime: "17:00",
    ClassName: "Mạng máy tính",
    RoomName: "Phòng C301",
    TeacherName: "Phạm Văn D",
    AttendanceStatus: "Absent",
  },
];

// ================== SKELETON ==================
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

// ================== COMPONENT ==================
const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ===== WEEK =====
  const startOfWeek = currentDate.startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day"),
  );

  // ===== FETCH =====
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/schedule");
        setSchedule(res.data?.length ? res.data : MOCK_SCHEDULE);
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
        setSchedule(MOCK_SCHEDULE);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchSchedule();
  }, []);

  // ===== HELPERS =====
  const getScheduleForDate = (dateObj) => {
    const dateString = dateObj.format("YYYY-MM-DD");
    return schedule
      .filter((item) => dayjs(item.Date).format("YYYY-MM-DD") === dateString)
      .sort((a, b) => (a.StartTime || "").localeCompare(b.StartTime || ""));
  };

  const getStatusConfig = (status, date) => {
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

    if (isPast)
      return {
        color: "bg-gray-50 border-gray-400 text-gray-500",
        icon: <Clock size={14} />,
        label: "Kết thúc",
      };

    return {
      color: "bg-blue-50 border-blue-500 text-blue-800 hover:bg-blue-100",
      icon: <Calendar size={14} />,
      label: "Sắp học",
    };
  };

  // ===== HANDLERS =====
  const nextWeek = () => setCurrentDate(currentDate.add(1, "week"));
  const prevWeek = () => setCurrentDate(currentDate.subtract(1, "week"));
  const goToday = () => setCurrentDate(dayjs());
  const handleDateChange = (e) =>
    e.target.value && setCurrentDate(dayjs(e.target.value));

  // ================== RENDER ==================
  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Thời khóa biểu
          </h2>
          <p className="text-slate-500 text-sm">
            Tuần {startOfWeek.isoWeek()} ({startOfWeek.format("DD/MM")} -{" "}
            {startOfWeek.add(6, "day").format("DD/MM")})
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <input
              type="date"
              className="pl-9 pr-3 py-2 border rounded-lg text-sm"
              value={currentDate.format("YYYY-MM-DD")}
              onChange={handleDateChange}
            />
            <CalendarDays
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <button
            onClick={goToday}
            className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm"
          >
            <RefreshCw size={14} /> Hôm nay
          </button>

          <div className="flex items-center border rounded-lg p-1">
            <button onClick={prevWeek} className="p-2">
              <ChevronLeft />
            </button>
            <span className="px-3 font-bold text-sm">
              Tuần {startOfWeek.isoWeek()}
            </span>
            <button onClick={nextWeek} className="p-2">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ScheduleSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {weekDays.map((date, idx) => {
              const events = getScheduleForDate(date);
              const isToday = date.isSame(dayjs(), "day");

              return (
                <div
                  key={idx}
                  className={`rounded-xl border flex flex-col ${
                    isToday ? "border-blue-400 bg-blue-50/30" : "bg-white"
                  }`}
                >
                  <div className="p-3 text-center border-b">
                    <div className="text-xs uppercase font-bold">
                      {date.format("dddd")}
                    </div>
                    <div className="font-bold">{date.format("DD")}</div>
                  </div>

                  <div className="p-2 flex-1 flex flex-col gap-2">
                    {events.length ? (
                      events.map((evt, i) => {
                        const status = getStatusConfig(
                          evt.AttendanceStatus,
                          date,
                        );

                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedEvent(evt)}
                            className={`p-3 rounded-lg border-l-4 cursor-pointer ${status.color}`}
                          >
                            <div className="flex justify-between text-xs mb-1">
                              <span>
                                {evt.StartTime} - {evt.EndTime}
                              </span>
                              <span className="flex gap-1 items-center">
                                {status.icon} {status.label}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm mb-1">
                              {evt.ClassName}
                            </h4>

                            <div className="text-xs flex gap-2 opacity-80">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} /> {evt.RoomName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} /> {evt.TeacherName}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center text-gray-300">
                        <BookOpen />
                        <span className="text-xs">Không có lịch</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Modal
        open={!!selectedEvent}
        footer={null}
        onCancel={() => setSelectedEvent(null)}
        centered
        title="Chi tiết buổi học"
      >
        {selectedEvent && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold">{selectedEvent.ClassName}</h3>
            <p>Giảng viên: {selectedEvent.TeacherName}</p>
            <p>Phòng: {selectedEvent.RoomName}</p>
            <p>
              Thời gian: {selectedEvent.StartTime} - {selectedEvent.EndTime}
            </p>
            <Tag>{selectedEvent.AttendanceStatus || "Chưa cập nhật"}</Tag>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentSchedule;
