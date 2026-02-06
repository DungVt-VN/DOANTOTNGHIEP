import React from "react";
import { Modal, Timeline, Tag, Button, Empty } from "antd";
import { Clock, MapPin, User, Calendar as CalendarIcon, X } from "lucide-react";

// 1. Helper lấy Tag Antd theo trạng thái
const getStatusTag = (status) => {
  switch (status) {
    case "Recruiting":
      return (
        <Tag color="cyan" className="m-0 border-0">
          Đang tuyển sinh
        </Tag>
      );
    case "Active":
      return (
        <Tag color="blue" className="m-0 border-0">
          Đang hoạt động
        </Tag>
      );
    case "Upcoming":
      return (
        <Tag color="orange" className="m-0 border-0">
          Sắp khai giảng
        </Tag>
      );
    case "Finished":
      return (
        <Tag color="green" className="m-0 border-0">
          Đã kết thúc
        </Tag>
      );
    case "Cancelled":
      return (
        <Tag color="red" className="m-0 border-0">
          Đã hủy
        </Tag>
      );
    default:
      return <Tag className="m-0">{status}</Tag>;
  }
};

// 2. Helper lấy màu sắc (Hex cho Timeline & Class Tailwind cho Strip)
const getStatusColor = (status) => {
  switch (status) {
    case "Recruiting":
      return {
        hex: "#13c2c2",
        bgClass: "bg-cyan-500",
        textClass: "text-cyan-600",
      };
    case "Active":
      return {
        hex: "#2563eb",
        bgClass: "bg-blue-600",
        textClass: "text-blue-600",
      }; // blue-600
    case "Upcoming":
      return {
        hex: "#f97316",
        bgClass: "bg-orange-500",
        textClass: "text-orange-500",
      };
    case "Finished":
      return {
        hex: "#22c55e",
        bgClass: "bg-green-500",
        textClass: "text-green-600",
      };
    case "Cancelled":
      return {
        hex: "#ef4444",
        bgClass: "bg-red-500",
        textClass: "text-red-500",
      };
    default:
      return {
        hex: "#9ca3af",
        bgClass: "bg-gray-400",
        textClass: "text-gray-500",
      };
  }
};

const DayDetailModal = ({ open, data, onClose }) => {
  if (!data) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      closeIcon={
        <div className="bg-gray-100 p-1 rounded-full hover:bg-gray-200 transition">
          <X size={18} />
        </div>
      }
      className="rounded-2xl overflow-hidden [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:rounded-2xl"
    >
      {/* HEADER TÙY CHỈNH */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <CalendarIcon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold m-0 text-white leading-tight">
              Lịch học chi tiết
            </h3>
            <p className="m-0 text-indigo-100 text-sm opacity-90 font-medium">
              {data.date.format("dddd, DD/MM/YYYY")}
            </p>
          </div>
        </div>
      </div>

      {/* BODY TIMELINE */}
      <div className="p-6 bg-gray-50 max-h-[65vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Tiến độ trong ngày
          </span>
          <Tag
            color="blue"
            className="m-0 rounded-full px-3 border-none bg-blue-100 text-blue-700 font-bold"
          >
            {data.list?.length || 0} Lớp học
          </Tag>
        </div>

        {data.list && data.list.length > 0 ? (
          <Timeline
            className="mt-2"
            items={data.list.map((item, index) => {
              // Lấy màu sắc dựa trên trạng thái
              const { hex, bgClass, textClass } = getStatusColor(item.Status);
              const isCancelled = item.Status === "Cancelled";

              return {
                color: hex, // Màu của dấu chấm tròn Timeline
                children: (
                  <div className="mb-6 group">
                    {/* Time Label & Status Tag */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className={`font-bold text-sm ${textClass}`}>
                        {item.StartTime?.slice(0, 5)} -{" "}
                        {item.EndTime?.slice(0, 5)}
                      </span>
                      {getStatusTag(item.Status)}
                    </div>

                    {/* Class Card */}
                    <div
                      className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
                        isCancelled ? "opacity-75 grayscale-[0.3]" : ""
                      }`}
                    >
                      {/* Decorative colored strip based on Status */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${bgClass}`}
                      />

                      <div className="pl-3">
                        <h4 className="font-bold text-gray-800 text-base mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {item.ClassName}
                        </h4>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <User
                              size={15}
                              className="text-gray-400 mt-0.5 shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                                Giáo viên
                              </span>
                              <span className="font-medium text-gray-700 line-clamp-1">
                                {item.FullName || item.TeacherName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin
                              size={15}
                              className="text-gray-400 mt-0.5 shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                                Phòng học
                              </span>
                              <span className="font-medium text-gray-700 line-clamp-1">
                                {item.RoomName || "Chưa xếp"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              };
            })}
          />
        ) : (
          <Empty description="Không có dữ liệu lớp học" className="py-10" />
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
        <Button type="default" onClick={onClose} className="hover:bg-gray-50">
          Đóng cửa sổ
        </Button>
      </div>
    </Modal>
  );
};

export default DayDetailModal;
