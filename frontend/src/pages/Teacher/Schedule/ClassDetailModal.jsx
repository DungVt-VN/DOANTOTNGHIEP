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
  X,
  User,
  CalendarDays,
  Info,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isoWeek from "dayjs/plugin/isoWeek";
const ClassDetailModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Ngăn click ra ngoài đóng modal
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-start">
          <div>
            <h3 className="text-white text-xl font-bold leading-snug">
              {data.ClassName}
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Mã lớp: #{data.ClassId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Thời gian & Phòng */}
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock size={18} />
                <span className="font-bold text-sm">Thời gian</span>
              </div>
              <p className="text-slate-700 font-semibold">
                {(data.StartTime || "").slice(0, 5)} -{" "}
                {(data.EndTime || "").slice(0, 5)}
              </p>
            </div>
            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <MapPin size={18} />
                <span className="font-bold text-sm">Phòng học</span>
              </div>
              <p className="text-slate-700 font-semibold">
                {data.RoomName || "Chưa xếp"}
              </p>
              <p className="text-xs text-slate-500">{data.Location || "N/A"}</p>
            </div>
          </div>

          {/* Chi tiết khác */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="text-slate-400 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Lịch học trong tuần
                </p>
                <p className="text-slate-700 font-medium">
                  {/* Convert số thành chữ cho đẹp */}
                  {data.Days
                    ? data.Days.replace(/2/g, "Thứ 2")
                        .replace(/3/g, "Thứ 3")
                        .replace(/4/g, "Thứ 4")
                        .replace(/5/g, "Thứ 5")
                        .replace(/6/g, "Thứ 6")
                        .replace(/7/g, "Thứ 7")
                        .replace(/8/g, "CN")
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Info className="text-slate-400 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Thời gian khóa học
                </p>
                <p className="text-slate-700 font-medium">
                  {dayjs(data.ClassStartDate).format("DD/MM/YYYY")} -{" "}
                  {dayjs(data.ClassEndDate).format("DD/MM/YYYY")}
                </p>
              </div>
            </div>

            {data.TeacherName && (
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Giảng viên phụ trách
                  </p>
                  <p className="text-slate-700 font-medium">
                    {data.TeacherName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Overlay click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default ClassDetailModal;
