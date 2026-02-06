import React from "react";
import { Card, Tag, Button, Progress, Tooltip } from "antd";
import { User, Calendar, Clock, MapPin } from "lucide-react";

const StudentClassItem = ({ cls, onRegister, loading }) => {
  // Logic trạng thái
  const enrolled = cls.Enrolled || 0;
  const capacity = cls.MaxStudents || 30;
  const percent = Math.round((enrolled / capacity) * 100);
  const isFull = enrolled >= capacity;
  const isAlmostFull = !isFull && percent > 80;
  const isRegistered = cls.IsRegistered > 0;

  // Màu sắc
  let progressColor = "#3b82f6"; // Blue
  let statusTag = { color: "success", text: "Đang tuyển" };

  if (isFull) {
    progressColor = "#ef4444"; // Red
    statusTag = { color: "error", text: "Hết chỗ" };
  } else if (isAlmostFull) {
    progressColor = "#f59e0b"; // Orange
    statusTag = { color: "warning", text: "Sắp đầy" };
  }

  // Format
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDays = (days) => (days ? `Thứ ${days}` : "Chưa xếp lịch");

  return (
    <Card
      hoverable
      className="rounded-xl overflow-hidden shadow-sm border-gray-200 flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-white"
      bodyStyle={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Decorative Line */}
      <div
        className={`h-1.5 w-full ${
          isFull
            ? "bg-gray-300"
            : "bg-gradient-to-r from-blue-500 to-indigo-600"
        }`}
      ></div>

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <Tag
            color="blue"
            className="m-0 border-none bg-blue-50 text-blue-700 font-bold rounded px-2 uppercase text-[10px]"
          >
            {cls.Subject || "Lớp học"}
          </Tag>
          <Tag
            color={statusTag.color}
            className="rounded-full px-2 border-none"
          >
            {statusTag.text}
          </Tag>
        </div>

        {/* Tên lớp */}
        <Tooltip title={cls.ClassName}>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-snug line-clamp-2 min-h-[50px] group-hover:text-blue-600 transition-colors">
            {cls.ClassName}
          </h3>
        </Tooltip>

        {/* Info */}
        <div className="space-y-3 mb-5 flex-1 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
              <User size={16} />
            </div>
            <span className="font-medium truncate">
              {cls.TeacherName || "Chưa phân công"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 mt-0.5">
              <Calendar size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-800">
                {formatDays(cls.Days)}
              </span>
              <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                <Clock size={12} /> {cls.StartTime?.slice(0, 5)} -{" "}
                {cls.EndTime?.slice(0, 5)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
              <MapPin size={16} />
            </div>
            <span>{cls.RoomName || "Online"}</span>
          </div>
        </div>

        {/* Sĩ số */}
        <div className="mb-5 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Sĩ số</span>
            <span className="font-bold" style={{ color: progressColor }}>
              {enrolled}/{capacity}
            </span>
          </div>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={progressColor}
            trailColor="#e2e8f0"
            size="small"
            className="m-0"
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
              Học phí
            </p>
            <div className="text-base font-bold text-indigo-700">
              {formatPrice(cls.TuitionFee)}
            </div>
          </div>

          <Button
            type="primary"
            disabled={isFull || isRegistered || loading}
            loading={loading}
            onClick={() => onRegister(cls)}
            className={`shadow-none font-semibold h-10 px-5 rounded-lg transition-all ${
              isRegistered
                ? "bg-green-100 text-green-700 border-none hover:bg-green-100 cursor-default"
                : isFull
                ? "bg-gray-100 text-gray-400 border-none hover:bg-gray-100"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:scale-105"
            }`}
          >
            {isRegistered ? "Đã ĐK" : isFull ? "Đầy" : "Đăng ký"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StudentClassItem;
