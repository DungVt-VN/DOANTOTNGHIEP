import React, { useEffect, useState, useContext } from "react";
import { Button, Row, Col, Skeleton, Tag, Tooltip } from "antd";
import {
  Calendar,
  ArrowRight,
  User,
  MapPin,
  BookOpen,
  Layout,
  Clock,
  RotateCcw, // Icon reload
  Plus,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";
import getStatusColor from "@/js/getStatusInfo";
import RefreshButton from "@/components/RefreshButton";
import CommonButton from "@/components/CommonButton";

const today = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const StudentClasses = () => {
  const { currentUser } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await api.get(
        `/classes/student/classes/${currentUser.UserId}`
      );
      setClasses(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp:", error);
    } finally {
      // Thêm chút delay giả lập để người dùng cảm nhận được nút reload đã hoạt động
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [currentUser]);

  const formatTime = (start, end) =>
    `${start?.slice(0, 5)} - ${end?.slice(0, 5)}`;

  // --- SUB-COMPONENT: CLASS CARD (Style cũ nhưng chuẩn hóa) ---
  // --- SUB-COMPONENT: CLASS CARD (Redesigned matching Image) ---
  const ClassCard = ({ cls }) => {
    const status = getStatusColor(cls.Status);

    return (
      <div className="group bg-white rounded-2xl border border-blue-200 p-5 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 flex flex-col h-full relative">
        {/* 1. Top Section: Tags & Title */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            {/* Mã học phần: Nền trắng, viền xanh, chữ xanh */}
            <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-600 tracking-wide">
              {cls.CourseName}
            </span>

            {/* Trạng thái: Dùng màu từ helper nhưng style lại cho mềm mại */}
            <Tag
              color={status.color}
              className="m-0 border-none font-bold text-[10px] px-2 py-1 uppercase rounded-md leading-tight opacity-90"
            >
              {status.label}
            </Tag>
          </div>

          {/* Tên lớp học: Chữ to, đậm, màu tối */}
          <Tooltip title={cls.ClassName}>
            <h3 className="text-lg font-bold text-slate-800 leading-snug line-clamp-2 min-h-[56px] group-hover:text-blue-600 transition-colors">
              {cls.ClassName}
            </h3>
          </Tooltip>
        </div>

        {/* 2. Teacher Section: Có đường kẻ mờ ngăn cách */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <User size={20} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">
              Giảng viên
            </p>
            <p className="text-sm font-bold text-slate-700 truncate">
              {cls.TeacherName || "Chưa phân công"}
            </p>
          </div>
        </div>

        {/* 3. Info Grid: Các ô màu xám nhạt (Slate-50) giống ảnh mẫu */}
        <div className="grid grid-cols-2 gap-3 mt-auto mb-5">
          {/* Thời gian */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase">
              <Calendar size={14} />
              <span>Thứ {cls.Days}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs pl-0.5">
              <Clock size={14} className="text-blue-500" />
              {formatTime(cls.StartTime, cls.EndTime)}
            </div>
          </div>

          {/* Phòng học */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase">
              <MapPin size={14} />
              <span>Phòng</span>
            </div>
            <div
              className="flex items-center gap-2 text-slate-700 font-semibold text-xs pl-0.5 truncate"
              title={cls.RoomName}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
              {cls.RoomName || "Online"}
            </div>
          </div>
        </div>

        {/* 4. Footer Button: Full width, bo góc tròn */}
        <Button
          type="primary"
          block
          onClick={() => navigate(`/student/class/${cls.ClassId}`)}
          className="bg-blue-600 hover:bg-blue-700 border-none h-11 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-transform active:scale-[0.98]"
        >
          Vào lớp học <ArrowRight size={18} strokeWidth={2.5} />
        </Button>
      </div>
    );
  };

  // --- SKELETON ---
  const ClassSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 h-[300px] flex flex-col overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100 h-24">
        <div className="flex justify-between mb-2">
          <Skeleton.Button active size="small" className="!w-16 !h-5" />
          <Skeleton.Button active size="small" className="!w-16 !h-5" />
        </div>
        <Skeleton.Input active block size="small" className="!w-full" />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <Skeleton.Avatar active size="default" />
          <Skeleton.Input active size="small" className="!w-32" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Skeleton.Button active block className="!h-12" />
          <Skeleton.Button active block className="!h-12" />
        </div>
      </div>
      <div className="p-3 border-t border-gray-100">
        <Skeleton.Button active block className="!h-9" />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        {/* Left: Date, Title & Description */}
        <div>
          <p className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wide first-letter:uppercase">
            {today}
          </p>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Layout className="text-blue-600" size={32} strokeWidth={2.5} />
            Lớp học của tôi
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium max-w-2xl">
            Quản lý và truy cập danh sách các lớp học phần bạn đang tham gia.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <RefreshButton
            onClick={() => fetchClasses(true)}
            loading={loading} // Sử dụng state refreshing riêng để icon quay
            tooltip="Cập nhật danh sách"
          />

          <CommonButton
            text="Đăng ký lớp mới"
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => navigate("/student/register-class")}
            className="h-[40px] px-5"
          />
        </div>
      </div>

      {/* 2. CONTENT GRID */}
      {loading ? (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <ClassSkeleton />
            </Col>
          ))}
        </Row>
      ) : classes.length > 0 ? (
        <Row gutter={[20, 20]}>
          {classes.map((cls) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={cls.ClassId}>
              <ClassCard cls={cls} />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300 p-12 shadow-sm text-center min-h-[400px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-slate-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Chưa có lớp học nào
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Bạn chưa đăng ký lớp học phần nào cho kỳ này.
          </p>
          <Button
            type="primary"
            onClick={() => navigate("/student/register-class")}
            className="bg-blue-600"
          >
            Đăng ký ngay
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentClasses;
