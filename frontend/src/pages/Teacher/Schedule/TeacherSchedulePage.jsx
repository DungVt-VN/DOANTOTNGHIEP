import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
  CalendarDays, // Import thêm icon này
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isoWeek from "dayjs/plugin/isoWeek";
import ClassDetailModal from "./ClassDetailModal";

// --- CẤU HÌNH DAYJS ---
dayjs.extend(isoWeek);
dayjs.locale("vi");

// --- COMPONENT CON: SKELETON LOADING ---
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

const TeacherSchedulePage = () => {
  const { currentUser } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // State lưu trữ ngày hiện tại đang xem (Mặc định là hôm nay)
  const [currentDate, setCurrentDate] = useState(dayjs());

  // --- STATE CHO MODAL ---
  const [selectedClass, setSelectedClass] = useState(null);

  // --- 1. LOGIC NGÀY THÁNG ---
  const startOfWeek = currentDate.startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day")
  );

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!currentUser?.TeacherId) return;
      setLoading(true);
      try {
        const startDate = startOfWeek.format("YYYY-MM-DD");
        const endDate = startOfWeek.add(6, "day").format("YYYY-MM-DD");

        const res = await api.get("/classes/teacher-schedule-by-week", {
          params: { teacherId: currentUser.TeacherId, startDate, endDate },
        });
        setSchedule(res.data);
      } catch (err) {
        console.error("Lỗi tải lịch:", err);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchSchedule();
  }, [currentUser, currentDate]);

  // --- 3. HELPER: LỌC LỊCH ---
  const getScheduleForDate = (dateObj) => {
    const dayIndex = dateObj.day();
    const dbDayMap = { 0: "8", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7" };
    const targetDay = dbDayMap[dayIndex];

    return schedule
      .filter((classItem) => {
        if (!classItem.Days) return false;
        const daysArray = String(classItem.Days)
          .split(",")
          .map((d) => d.trim());
        return daysArray.includes(targetDay);
      })
      .sort((a, b) =>
        (a.StartTime || "00:00:00").localeCompare(b.StartTime || "00:00:00")
      );
  };

  // Helper: Màu sắc
  const getClassColor = (className) => {
    const colors = [
      "border-l-blue-500 bg-blue-50 text-blue-900 hover:bg-blue-100 group-hover:border-blue-600",
      "border-l-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 group-hover:border-emerald-600",
      "border-l-purple-500 bg-purple-50 text-purple-900 hover:bg-purple-100 group-hover:border-purple-600",
      "border-l-orange-500 bg-orange-50 text-orange-900 hover:bg-orange-100 group-hover:border-orange-600",
      "border-l-pink-500 bg-pink-50 text-pink-900 hover:bg-pink-100 group-hover:border-pink-600",
    ];
    const index = (className || "").length % colors.length;
    return colors[index];
  };

  // --- 4. NAVIGATION & HANDLERS ---
  const nextWeek = () => setCurrentDate(currentDate.add(1, "week"));
  const prevWeek = () => setCurrentDate(currentDate.subtract(1, "week"));
  const goToday = () => setCurrentDate(dayjs());

  // Xử lý khi chọn ngày từ input date
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setCurrentDate(dayjs(selectedDate));
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={28} />
            Lịch giảng dạy
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý thời khóa biểu tuần này ({startOfWeek.format("DD/MM")} -{" "}
            {startOfWeek.add(6, "day").format("DD/MM")}).
          </p>
        </div>

        {/* --- TOOLBAR ĐIỀU HƯỚNG --- */}
        <div className="flex items-center gap-3">
          {/* 1. INPUT CHỌN NGÀY */}
          <div className="relative group">
            <input
              type="date"
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
              onChange={handleDateChange}
              value={currentDate.format("YYYY-MM-DD")} // Hiển thị ngày hiện tại đang chọn
            />
            <CalendarDays
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors"
              size={16}
            />
          </div>

          {/* 2. NÚT HÔM NAY */}
          <button
            onClick={goToday}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 text-sm font-medium shadow-sm transition-colors"
          >
            <RefreshCw size={14} /> Hôm nay
          </button>

          {/* 3. ĐIỀU HƯỚNG TUẦN */}
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 font-bold text-gray-800 min-w-[100px] text-center select-none text-sm">
              Tuần {startOfWeek.isoWeek()}
            </div>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* SCHEDULE GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {loading ? (
          <ScheduleSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 min-h-full">
            {weekDays.map((date, index) => {
              const isToday = date.isSame(dayjs(), "day");
              const dailySchedules = getScheduleForDate(date);

              return (
                <div
                  key={index}
                  className={`flex flex-col rounded-xl border transition-all duration-300 h-full min-h-[300px] ${
                    isToday
                      ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-200"
                      : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <div
                    className={`p-3 text-center border-b rounded-t-xl ${
                      isToday
                        ? "border-blue-200 bg-blue-100/50"
                        : "border-gray-100 bg-gray-50/50"
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

                  <div className="p-2 flex-1 flex flex-col gap-2">
                    {dailySchedules.length > 0 ? (
                      dailySchedules.map((sch) => (
                        <div
                          key={`${sch.ClassId}-${date.format("DD")}`}
                          onClick={() => setSelectedClass(sch)}
                          className={`p-3 rounded-lg border border-l-[4px] shadow-sm hover:shadow-md cursor-pointer transition-all group active:scale-95 ${getClassColor(
                            sch.ClassName
                          )}`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                              <Clock size={10} />{" "}
                              {(sch.StartTime || "00:00").slice(0, 5)} -{" "}
                              {(sch.EndTime || "00:00").slice(0, 5)}
                            </div>
                          </div>
                          <h4 className="font-bold text-sm leading-tight mb-2 group-hover:underline">
                            {sch.ClassName}
                          </h4>
                          <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                            <MapPin size={12} />{" "}
                            <span>{sch.RoomName || "Chưa xếp"}</span>
                          </div>
                          {sch.Location && (
                            <p className="text-[10px] mt-1 text-gray-500 truncate">
                              {sch.Location}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 opacity-60 min-h-[150px]">
                        <div className="p-2 bg-gray-50 rounded-full">
                          <BookOpen size={20} />
                        </div>
                        <span className="text-xs font-medium">Trống</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClassDetailModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        data={selectedClass}
      />
    </div>
  );
};

export default TeacherSchedulePage;
