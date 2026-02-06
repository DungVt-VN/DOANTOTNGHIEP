import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  Pagination,
  Spin,
  Tag,
  Badge,
} from "antd";
import {
  User,
  MapPin,
  Search,
  LayoutList,
  Filter,
  X,
  Clock,
  CheckCircle2,
  CalendarDays,
  Info,
} from "lucide-react";
import dayjs from "dayjs";

const { Option } = Select;

// --- HELPER: Status Color ---
const getStatusColor = (status) => {
  switch (status) {
    case "Recruiting":
      return { color: "cyan", label: "Đang tuyển sinh" };
    case "Active":
      return { color: "blue", label: "Đang hoạt động" };
    case "Finished":
      return { color: "green", label: "Đã kết thúc" };
    case "Upcoming":
      return { color: "orange", label: "Sắp khai giảng" };
    case "Cancelled":
      return { color: "red", label: "Đã hủy" };
    default:
      return { color: "default", label: "Chưa xác định" };
  }
};

const ClassListModal = ({
  visible,
  onClose,
  course,
  classes,
  loading,
  registeringId,
  onRegister,
}) => {
  // --- States ---
  const [searchText, setSearchText] = useState("");
  const [sortType, setSortType] = useState("date_asc");
  const [filterDay, setFilterDay] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (visible) {
      setSearchText("");
      setSortType("date_asc");
      setFilterDay("all");
      setCurrentPage(1);
    }
  }, [visible, course]);

  // --- Helpers ---
  const formatDays = (daysStr) => {
    if (!daysStr) return "";
    const days = String(daysStr)
      .split(",")
      .map((d) => d.trim());
    const formatted = days.map((day) => {
      const d = day.toLowerCase();
      if (["cn", "8", "sun", "sunday"].includes(d)) return "CN";
      return d;
    });
    if (formatted.length === 1) {
      return formatted[0] === "CN" ? "Chủ Nhật" : `Thứ ${formatted[0]}`;
    }
    return `Thứ ${formatted.join(", ")}`;
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(price));

  const formatDate = (dateString) => {
    if (!dateString) return "--/--";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  // --- Filtering & Sorting ---
  let processedClasses = [...classes];

  if (searchText) {
    const lowerText = searchText.toLowerCase();
    processedClasses = processedClasses.filter(
      (c) =>
        c.ClassName.toLowerCase().includes(lowerText) ||
        c.TeacherName?.toLowerCase().includes(lowerText),
    );
  }

  if (filterDay !== "all") {
    processedClasses = processedClasses.filter((c) => {
      if (!c.Days) return false;
      const daysArray = String(c.Days)
        .split(",")
        .map((d) => d.trim());
      return daysArray.includes(filterDay);
    });
  }

  processedClasses.sort((a, b) => {
    if (sortType === "price_asc")
      return parseFloat(a.TuitionFee) - parseFloat(b.TuitionFee);
    if (sortType === "price_desc")
      return parseFloat(b.TuitionFee) - parseFloat(a.TuitionFee);
    return new Date(a.StartDate) - new Date(b.StartDate);
  });

  const totalItems = processedClasses.length;
  const paginatedClasses = processedClasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={850}
      centered
      destroyOnHidden
      title={null}
      styles={{
        content: { padding: 0, borderRadius: "16px", overflow: "hidden" },
        body: { padding: 0 },
      }}
      closeIcon={
        <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </div>
      }
    >
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-6 pt-6 pb-4 flex gap-4 items-center">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 overflow-hidden">
            {course?.CourseImage ? (
              <img
                src={course.CourseImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <LayoutList size={24} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge status="processing" color="blue" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {course?.Subject}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
              {course?.CourseName}
            </h3>
          </div>
        </div>

        {/* Filters */}
        {!loading && classes.length > 0 && (
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            <Input
              prefix={<Search size={14} className="text-gray-400" />}
              placeholder="Tìm tên lớp hoặc GV..."
              className="w-full sm:w-64 text-sm rounded-lg"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={sortType}
              onChange={setSortType}
              className="w-36"
              size="middle"
              options={[
                { value: "date_asc", label: "Mới nhất" },
                { value: "price_asc", label: "Giá thấp" },
                { value: "price_desc", label: "Giá cao" },
              ]}
            />
            <Select
              value={filterDay}
              onChange={setFilterDay}
              className="w-32"
              suffixIcon={<Filter size={12} />}
            >
              <Option value="all">Mọi ngày</Option>
              <Option value="2">Thứ 2</Option>
              <Option value="3">Thứ 3</Option>
              <Option value="4">Thứ 4</Option>
              <Option value="5">Thứ 5</Option>
              <Option value="6">Thứ 6</Option>
              <Option value="7">Thứ 7</Option>
              <Option value="CN">Chủ Nhật</Option>
            </Select>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="bg-gray-50 px-6 py-4 min-h-[300px] max-h-[60vh] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center gap-3 py-10">
            <Spin />
            <span className="text-gray-400 text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : paginatedClasses.length > 0 ? (
          <div className="space-y-3">
            {paginatedClasses.map((cls) => {
              // --- LOGIC TRẠNG THÁI ---
              const isFull = cls.Enrolled >= cls.MaxStudents;
              const isRegistered =
                Boolean(cls.IsRegistered) ||
                cls.IsRegistered === 1 ||
                cls.IsRegistered === "1";
              const isProcessing = registeringId === cls.ClassId;
              const statusInfo = getStatusColor(cls.Status);

              // Logic cho phép đăng ký:
              // 1. Phải là 'Recruiting' hoặc 'Upcoming'
              // 2. Chưa full
              // 3. Chưa đăng ký
              const canRegister =
                (cls.Status === "Recruiting" || cls.Status === "Upcoming") &&
                !isFull &&
                !isRegistered;

              // Màu sắc badge sĩ số
              let capacityColor =
                "text-emerald-600 bg-emerald-50 border-emerald-100";
              if (isFull)
                capacityColor = "text-red-600 bg-red-50 border-red-100";
              else if (cls.Enrolled >= cls.MaxStudents - 5)
                capacityColor =
                  "text-orange-600 bg-orange-50 border-orange-100";

              return (
                <div
                  key={cls.ClassId}
                  className={`bg-white p-5 rounded-xl border transition-all hover:shadow-md relative group flex flex-col gap-3
                    ${isRegistered ? "border-emerald-200 ring-1 ring-emerald-50" : "border-gray-100 hover:border-blue-200"}
                  `}
                >
                  {/* Row 1: Time, Status, Capacity */}
                  <div className="flex justify-between items-start">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-100">
                      <Clock size={16} />
                      <span>
                        {formatDays(cls.Days)} • {formatTime(cls.StartTime)} -{" "}
                        {formatTime(cls.EndTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Badge Trạng thái Lớp (Active/Recruiting...) */}
                      <Tag
                        color={statusInfo.color}
                        className="mr-0 border-0 font-semibold rounded-md"
                      >
                        {statusInfo.label}
                      </Tag>

                      {/* Sĩ số */}
                      {!isRegistered && !isFull && (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-md border ${capacityColor}`}
                        >
                          {cls.Enrolled}/{cls.MaxStudents} chỗ
                        </span>
                      )}

                      {/* Tag Trạng thái user */}
                      {isRegistered && (
                        <Tag
                          icon={<CheckCircle2 size={12} />}
                          color="success"
                          className="m-0 border-0 bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md"
                        >
                          Đã đăng ký
                        </Tag>
                      )}
                      {!isRegistered && isFull && (
                        <Tag color="error" className="m-0 rounded-md font-bold">
                          Hết chỗ
                        </Tag>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Info */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {cls.ClassName}
                    </h4>

                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="truncate">
                          {cls.TeacherName || "Chưa cập nhật GV"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate">
                          {cls.RoomName}{" "}
                          {cls.RoomLocation ? `- ${cls.RoomLocation}` : ""}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <CalendarDays size={14} className="text-gray-400" />
                        <span>
                          {formatDate(cls.StartDate)} -{" "}
                          {formatDate(cls.EndDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-50 w-full" />

                  {/* Row 3: Price & Action */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Học phí
                      </p>
                      <p className="text-lg font-bold text-indigo-600">
                        {formatPrice(cls.TuitionFee)}
                      </p>
                    </div>

                    <Button
                      type="primary"
                      // Logic Disable:
                      // 1. Không thể đăng ký (canRegister == false)
                      // 2. HOẶC đang loading lớp khác
                      disabled={
                        !canRegister || (registeringId && !isProcessing)
                      }
                      loading={isProcessing}
                      onClick={() => onRegister(cls)}
                      className={`font-semibold shadow-none px-6 h-10 rounded-lg transition-all border-none
                        ${
                          !canRegister
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" // Disabled style
                            : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 shadow-md hover:shadow-blue-200" // Active style
                        }`}
                    >
                      {isRegistered
                        ? "Đã ghi danh"
                        : isFull
                          ? "Lớp đầy"
                          : cls.Status === "Active"
                            ? "Đang diễn ra"
                            : cls.Status === "Finished"
                              ? "Đã kết thúc"
                              : cls.Status === "Cancelled"
                                ? "Đã hủy"
                                : "Đăng ký ngay"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">Không tìm thấy lớp học nào.</p>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSearchText("");
                setFilterDay("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {!loading && totalItems > pageSize && (
        <div className="py-4 border-t border-gray-100 bg-white flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={setCurrentPage}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}
    </Modal>
  );
};

export default ClassListModal;
