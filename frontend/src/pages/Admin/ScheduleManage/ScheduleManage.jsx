import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, Button, message, Spin, DatePicker } from "antd";
import { CalendarDays, RefreshCcw } from "lucide-react";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";

import FilterBar from "@/components/Schedule/DateFilterBar";
import DayDetailModal from "@/components/Schedule/DayDetailModal";
import { generateCalendarEvents } from "@/utils/scheduleUtils";

const ScheduleManage = ({ fixedTeacherId }) => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  useEffect(() => {
    const fetchMetaData = async () => {
      setLoadingMeta(true);
      try {
        const [teacherRes, roomRes] = await Promise.all([
          api.get("/accounts/manage-accounts/teachers"),
          api.get("/classes/all-rooms"),
        ]);
        setTeachers(teacherRes.data || []);
        setRooms(roomRes.data || []);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      } finally {
        setLoadingMeta(false);
      }
    };
    if (fixedTeacherId === null || fixedTeacherId === undefined) {
      fetchMetaData();
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const params = {
        month: currentDate.month() + 1,
        year: currentDate.year(),
        ...((fixedTeacherId || selectedTeacher) && {
          teacherId: fixedTeacherId || selectedTeacher,
        }),

        ...(selectedRoom && { roomId: selectedRoom }),
      };

      const classRes = await api.get("/classes/all-classes-by-month", {
        params,
      });
      setClasses(classRes.data || []);
    } catch (error) {
      console.error("Lỗi tải lịch học:", error);
      message.error("Không thể tải dữ liệu lịch học.");
    } finally {
      setLoadingClasses(false);
    }
  }, [currentDate, selectedTeacher, selectedRoom]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const events = useMemo(() => {
    return generateCalendarEvents(
      classes,
      currentDate,
      selectedTeacher,
      selectedRoom
    );
  }, [classes, currentDate, selectedTeacher, selectedRoom]);

  const dateCellRender = (value) => {
    const dayEvents = events.filter((ev) => ev.date.isSame(value, "day"));
    if (dayEvents.length === 0) return null;

    dayEvents.sort((a, b) =>
      (a.StartTime || "").localeCompare(b.StartTime || "")
    );

    return (
      <div className="flex flex-col gap-1 mt-1">
        {dayEvents.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1 overflow-hidden group"
          >
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                item.Status === "Active" ? "bg-green-500" : "bg-orange-400"
              }`}
            />
            <span className="text-[10px] text-gray-600 truncate font-medium group-hover:text-indigo-600 transition-colors">
              {item.StartTime?.slice(0, 5)} - {item.ClassName}
            </span>
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-[10px] text-indigo-500 pl-2.5 font-medium">
            + {dayEvents.length - 3} lớp nữa
          </div>
        )}
      </div>
    );
  };

  const handleSelectDay = (value, { source }) => {
    if (!value.isSame(currentDate, "month")) {
      setCurrentDate(value);
      return;
    }
    setCurrentDate(value);

    const dayEvents = events.filter((ev) => ev.date.isSame(value, "day"));

    if (dayEvents.length === 0) {
      message.info({
        content: `Ngày ${value.format("DD/MM/YYYY")} không có lịch học nào.`,
        icon: <CalendarDays className="text-indigo-500" size={18} />,
        style: { marginTop: "10vh" },
      });
      return;
    }

    dayEvents.sort((a, b) =>
      (a.StartTime || "").localeCompare(b.StartTime || "")
    );
    setSelectedDayEvents({ date: value, list: dayEvents });
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full bg-gray-50">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white px-5 py-3 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
            <CalendarDays size={20} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-gray-800 m-0 leading-tight">
              Quản lý Thời Khóa Biểu
            </h4>
            <span className="text-xs text-gray-500 font-medium">
              Tháng {currentDate.format("MM/YYYY")}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <DatePicker
            picker="month"
            format="MM/YYYY"
            value={currentDate}
            onChange={(date) => date && setCurrentDate(date)}
            allowClear={false}
            className="w-36 font-medium shadow-sm border-gray-300 hover:border-indigo-400 focus:border-indigo-500"
          />
          <Button
            type="primary"
            ghost
            icon={<RefreshCcw size={16} />}
            onClick={fetchClasses}
            loading={loadingClasses}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      {!fixedTeacherId && (
        <FilterBar
          teachers={teachers}
          rooms={rooms}
          loading={loadingMeta}
          onTeacherChange={setSelectedTeacher}
          onRoomChange={setSelectedRoom}
        />
      )}

      {/* CALENDAR BODY */}
      <div className="flex-1 bg-white p-5 shadow-inner overflow-y-auto flex flex-col">
        <Spin
          spinning={loadingClasses || loadingMeta}
          tip="Đang tải lịch học..."
        >
          <Calendar
            value={currentDate}
            onSelect={handleSelectDay}
            headerRender={() => null}
            cellRender={dateCellRender}
            className="custom-calendar border border-gray-200 rounded-xl h-full shadow-sm"
          />
        </Spin>
      </div>

      <DayDetailModal
        open={!!selectedDayEvents}
        data={selectedDayEvents}
        onClose={() => setSelectedDayEvents(null)}
      />
    </div>
  );
};

export default ScheduleManage;
