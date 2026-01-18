import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Empty,
  Tag,
  Input,
  Select,
  Pagination,
  Spin,
  Tooltip,
} from "antd";
import {
  User,
  Calendar,
  MapPin,
  Search,
  LayoutList,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
} from "lucide-react";

const { Option } = Select;

const ClassListModal = ({
  visible,
  onClose,
  course,
  classes,
  loading,
  onRegister,
}) => {
  // --- States cho chức năng nội bộ Modal ---
  const [searchText, setSearchText] = useState("");
  const [sortType, setSortType] = useState("date_asc"); // date_asc, price_asc, price_desc
  const [filterDay, setFilterDay] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Số lớp hiển thị trên 1 trang

  // Reset state khi mở modal mới
  useEffect(() => {
    if (visible) {
      setSearchText("");
      setSortType("date_asc");
      setFilterDay("all");
      setCurrentPage(1);
    }
  }, [visible, course]);

  // --- Logic Lọc & Sắp xếp ---
  let processedClasses = [...classes];

  // 1. Tìm kiếm (Theo tên lớp hoặc GV)
  if (searchText) {
    const lowerText = searchText.toLowerCase();
    processedClasses = processedClasses.filter(
      (c) =>
        c.ClassName.toLowerCase().includes(lowerText) ||
        c.TeacherName?.toLowerCase().includes(lowerText)
    );
  }

  // 2. Lọc theo thứ
  if (filterDay !== "all") {
    processedClasses = processedClasses.filter(
      (c) => c.Days && c.Days.includes(filterDay)
    );
  }

  // 3. Sắp xếp
  processedClasses.sort((a, b) => {
    if (sortType === "price_asc") return a.TuitionFee - b.TuitionFee;
    if (sortType === "price_desc") return b.TuitionFee - a.TuitionFee;
    // Mặc định: Ngày khai giảng gần nhất lên đầu
    return new Date(a.StartDate) - new Date(b.StartDate);
  });

  // 4. Phân trang
  const totalItems = processedClasses.length;
  const paginatedClasses = processedClasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // --- Helper Render ---
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnHidden
      title={null}
      styles={{
        content: { padding: 0, borderRadius: "16px", overflow: "hidden" },
      }}
      closeIcon={
        <div className="p-2 rounded-full  transition-all duration-200 group flex items-center justify-center">
          <X
            size={20}
            className="text-slate-400 group-hover:text-slate-600 transition-colors"
            strokeWidth={2.5}
          />
        </div>
      }
    >
      {/* 1. HEADER */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            {course?.CourseImage ? (
              <img
                src={course.CourseImage}
                alt=""
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <LayoutList size={24} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">
              {course?.CourseName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">
                {course?.Subject}
              </span>
              <span className="text-slate-400 text-xs">
                • {classes.length} lớp đang mở
              </span>
            </div>
          </div>
        </div>

        {/* TOOLBAR (Search & Filter) */}
        {!loading && classes.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            <Input
              prefix={<Search size={16} className="text-gray-400" />}
              placeholder="Tìm theo GV, tên lớp..."
              className="w-full sm:w-60 rounded-lg bg-slate-50 border-slate-200"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={sortType}
              onChange={setSortType}
              className="w-40"
              options={[
                { value: "date_asc", label: "Sớm nhất" },
                { value: "price_asc", label: "Học phí thấp nhất" },
                { value: "price_desc", label: "Học phí cao nhất" },
              ]}
            />
            <Select
              value={filterDay}
              onChange={setFilterDay}
              className="w-32"
              suffixIcon={<Filter size={14} />}
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

      {/* 2. BODY CONTENT */}
      <div className="bg-slate-50 p-6 min-h-[300px]">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center py-12 gap-3">
            <Spin size="large" />
            <p className="text-slate-400 text-sm">Đang tải danh sách lớp...</p>
          </div>
        ) : paginatedClasses.length > 0 ? (
          <div className="space-y-3">
            {paginatedClasses.map((cls) => {
              const isFull = cls.Enrolled >= cls.MaxStudents;
              const isRegistered = cls.IsRegistered > 0; // Cần API trả về field này

              return (
                <div
                  key={cls.ClassId}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center group"
                >
                  {/* Left: Time Info */}
                  <div className="min-w-[120px] flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-1">
                    <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        Thứ {cls.Days}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cls.StartTime?.slice(0, 5)} -{" "}
                        {cls.EndTime?.slice(0, 5)}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1 space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                        {cls.ClassName}
                      </h4>
                      {isFull && (
                        <Tag color="error" className="m-0 text-[10px]">
                          Full
                        </Tag>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} /> GV: {cls.TeacherName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {cls.RoomName}
                      </span>
                      <span
                        className={`font-semibold ${
                          isFull ? "text-red-500" : "text-blue-600"
                        }`}
                      >
                        {cls.Enrolled}/{cls.MaxStudents} chỗ
                      </span>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:flex-col sm:items-end sm:gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {formatPrice(cls.TuitionFee)}
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      disabled={isFull || isRegistered}
                      onClick={() => onRegister(cls)}
                      className={`font-medium px-4 rounded-lg shadow-none ${
                        isRegistered
                          ? "bg-green-100 text-green-700 border-green-200"
                          : isFull
                          ? "bg-gray-100 text-gray-400 border-none"
                          : "bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-transform"
                      }`}
                    >
                      {isRegistered
                        ? "Đã đăng ký"
                        : isFull
                        ? "Hết chỗ"
                        : "Đăng ký"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <Empty description="Không tìm thấy lớp học phù hợp." />
          </div>
        )}

        {/* 3. PAGINATION FOOTER */}
        {!loading && totalItems > pageSize && (
          <div className="flex justify-center mt-6">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalItems}
              onChange={(page) => setCurrentPage(page)}
              size="small"
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ClassListModal;
