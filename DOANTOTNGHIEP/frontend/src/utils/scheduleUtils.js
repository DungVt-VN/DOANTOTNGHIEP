import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { removeVietnameseTones } from "@/js/Helper";

dayjs.extend(isBetween);

/**
 * Tạo danh sách sự kiện hiển thị trên lịch từ danh sách lớp học
 */
export const generateCalendarEvents = (
  classes,
  currentDate,
  selectedTeacher,
  selectedRoom
) => {
  if (!Array.isArray(classes) || classes.length === 0) return [];

  const generatedEvents = [];
  const startRange = currentDate.startOf("month").subtract(7, "day");
  const endRange = currentDate.endOf("month").add(7, "day");

  classes.forEach((cls) => {
    // Filter Logic
    if (selectedTeacher && cls.TeacherId !== selectedTeacher) return;
    if (selectedRoom && cls.RoomId !== selectedRoom) return;
    if (!cls.StartDate || !cls.EndDate || !cls.Days) return;

    const clsStart = dayjs(cls.StartDate).startOf("day");
    const clsEnd = dayjs(cls.EndDate).endOf("day");

    if (clsEnd.isBefore(startRange) || clsStart.isAfter(endRange)) return;

    // Parse Days
    let daysArr = [];
    if (Array.isArray(cls.Days)) {
      daysArr = cls.Days.map((d) => (parseInt(d) === 8 ? 0 : parseInt(d) - 1));
    } else {
      daysArr = String(cls.Days)
        .split(",")
        .map((d) => (parseInt(d) === 8 ? 0 : parseInt(d) - 1));
    }

    // Loop logic
    let loopDate = startRange.clone();
    while (loopDate.isBefore(endRange) || loopDate.isSame(endRange)) {
      if (
        loopDate.isBetween(clsStart, clsEnd, "day", "[]") &&
        daysArr.includes(loopDate.day())
      ) {
        generatedEvents.push({
          id: `${cls.ClassId}-${loopDate.format("YYYYMMDD")}`,
          date: loopDate.clone(),
          ...cls,
        });
      }
      loopDate = loopDate.add(1, "day");
    }
  });
  return generatedEvents;
};

/**
 * Helper search cho Antd Select
 */
export const filterOption = (input, option) =>
  removeVietnameseTones(option?.label ?? "")
    .toLowerCase()
    .includes(removeVietnameseTones(input).toLowerCase());
