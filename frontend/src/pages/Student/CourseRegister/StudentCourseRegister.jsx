import React, { useState, useEffect, useContext } from "react";
import {
  Input,
  Select,
  Modal,
  message,
  Row,
  Col,
  Empty,
  Skeleton,
  Pagination,
  Tooltip,
  Button,
} from "antd";
import {
  Search,
  LayoutList,
  Filter,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";
import dayjs from "dayjs";
import ClassListModal from "@/components/Classes/Student/ClassListModal";

const { Option } = Select;

// --- CourseCard Component ---
const CourseCard = ({ course, onClick }) => (
  <div
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col h-full transform hover:-translate-y-1"
    onClick={() => onClick(course)}
  >
    <div className="h-44 bg-gray-100 relative overflow-hidden">
      <img
        src={
          course.CourseImage ||
          "https://placehold.co/600x400/f1f5f9/94a3b8?text=EduCenter"
        }
        alt={course.CourseName}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Subject Tag */}
      <div className="absolute top-3 right-3">
        <span className="bg-white/95 backdrop-blur-md text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
          {course.Subject}
        </span>
      </div>

      {/* Teachers Avatars (Nếu có) */}
      {course.Teachers && course.Teachers.length > 0 && (
        <div className="absolute bottom-3 left-3 flex -space-x-2">
          {course.Teachers.slice(0, 3).map((t, idx) => (
            <Tooltip key={idx} title={t.FullName}>
              <img
                src={
                  t.Avatar ||
                  `https://ui-avatars.com/api/?name=${t.FullName}&background=random`
                }
                alt={t.FullName}
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
              />
            </Tooltip>
          ))}
          {course.Teachers.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-white/90 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
              +{course.Teachers.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Quick View Button */}
      <div className="absolute bottom-3 right-3 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <button className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-transform">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>

    <div className="p-5 flex flex-col flex-1">
      <Tooltip title={course.CourseName}>
        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {course.CourseName}
        </h3>
      </Tooltip>

      <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">
        {course.Description || "Thông tin chi tiết đang cập nhật."}
      </p>

      <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            Học phí gốc
          </p>
          <p className="text-base font-bold text-indigo-700">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(course.BaseTuitionFee)}
          </p>
        </div>
        {course.OpenClassesCount > 0 && (
          <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            {course.OpenClassesCount} lớp mở
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- MAIN PAGE ---
const StudentCourseRegister = () => {
  const { currentUser } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States
  const [searchText, setSearchText] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all"); // Lọc theo GV
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [classesOfCourse, setClassesOfCourse] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch Data
  const fetchCourses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get("/courses/courses-available");
      console.log(res.data);
      setCourses(res.data);
    } catch (error) {
      console.error(error);
      setCourses([]); // Fallback nếu lỗi
      if (isRefresh) message.error("Không thể làm mới dữ liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Handle Reload
  const handleReload = () => {
    fetchCourses(true);
  };

  // Handle Course Click
  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setModalVisible(true);
    setLoadingClasses(true);
    try {
      const res = await api.get(
        `/student/classes-by-course/${course.CourseId}`
      );
      setClassesOfCourse(res.data);
    } catch (error) {
      console.error(error);
      setClassesOfCourse([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Register Logic (Callback từ Modal)
  const handleRegister = async (cls) => {
    // Logic gọi API đã nằm trong Modal hoặc có thể đẩy ra đây
    // Ở đây ta chỉ cập nhật state UI khi đăng ký thành công
    setClassesOfCourse((prev) =>
      prev.map((c) =>
        c.ClassId === cls.ClassId
          ? { ...c, IsRegistered: 1, Enrolled: c.Enrolled + 1 }
          : c
      )
    );
  };

  // Filter Logic
  const filteredCourses = courses.filter((c) => {
    const matchText = c.CourseName.toLowerCase().includes(
      searchText.toLowerCase()
    );
    const matchSubject = filterSubject === "all" || c.Subject === filterSubject;

    // Logic lọc theo GV (Dựa vào mảng Teachers trong course)
    const teachersList = c.Teachers || [];
    const matchTeacher =
      filterTeacher === "all" ||
      teachersList.some((t) => t.FullName === filterTeacher);

    return matchText && matchSubject && matchTeacher;
  });

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Unique Lists for Filter
  const subjects = [...new Set(courses.map((c) => c.Subject))].filter(Boolean);
  const allTeachers = [
    ...new Set(courses.flatMap((c) => c.Teachers || []).map((t) => t.FullName)),
  ].filter(Boolean);
  const today = dayjs().format("dddd, DD MMMM YYYY");

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide first-letter:uppercase">
            {today}
          </p>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <LayoutList className="text-blue-600" size={32} />
            Đăng ký khóa học
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium max-w-2xl">
            Chọn môn học và lớp phù hợp để bắt đầu hành trình chinh phục tri
            thức.
          </p>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* LEFT: CONTENT */}
        <Col xs={24} lg={18}>
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 sticky top-0 z-10">
            <Input
              placeholder="Tìm tên khóa học..."
              prefix={<Search size={18} className="text-gray-400" />}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500"
              size="large"
              allowClear
            />
            <Select
              defaultValue="all"
              value={filterSubject}
              size="large"
              style={{ width: 160 }}
              onChange={(val) => {
                setFilterSubject(val);
                setCurrentPage(1);
              }}
              className="rounded-lg"
              placeholder="Môn học"
              suffixIcon={<Filter size={16} />}
            >
              <Option value="all">Tất cả môn</Option>
              {subjects.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
            <Select
              defaultValue="all"
              value={filterTeacher}
              size="large"
              style={{ width: 180 }}
              onChange={(val) => {
                setFilterTeacher(val);
                setCurrentPage(1);
              }}
              className="rounded-lg"
              placeholder="Giảng viên"
            >
              <Option value="all">Tất cả GV</Option>
              {allTeachers.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>

            {/* --- NÚT TẢI LẠI --- */}
            <Tooltip title="Cập nhật danh sách">
              <button
                onClick={handleReload}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all duration-200 text-sm font-medium active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed h-[40px]"
              >
                <RefreshCw
                  size={16}
                  className={`${
                    refreshing ? "animate-spin text-blue-600" : ""
                  }`}
                />
                <span className="hidden sm:inline">Tải lại</span>
              </button>
            </Tooltip>
          </div>

          {/* Grid */}
          {loading ? (
            <Row gutter={[24, 24]}>
              {[1, 2, 3].map((i) => (
                <Col xs={24} md={12} xl={8} key={i}>
                  <div className="bg-white h-96 rounded-2xl p-4 flex flex-col gap-4">
                    <Skeleton.Image
                      active
                      className="!w-full !h-40 rounded-xl"
                    />
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </div>
                </Col>
              ))}
            </Row>
          ) : paginatedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedCourses.map((course) => (
                  <CourseCard
                    key={course.CourseId}
                    course={course}
                    onClick={handleCourseClick}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-10">
                <Pagination
                  current={currentPage}
                  total={filteredCourses.length}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            </>
          ) : (
            <div className="bg-white p-16 rounded-xl border border-dashed border-gray-200 text-center">
              <Empty description="Không tìm thấy khóa học nào" />
              <Button
                type="link"
                onClick={() => {
                  setSearchText("");
                  setFilterSubject("all");
                  setFilterTeacher("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </Col>

        {/* RIGHT: SIDEBAR */}
        <Col xs={24} lg={6} className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
              <Info size={20} /> Hướng dẫn
            </h3>
            <div className="space-y-5 relative z-10 text-sm">
              {[
                "Chọn khóa học theo môn hoặc giảng viên.",
                "Xem chi tiết lớp học (Lịch, Phòng, Sĩ số).",
                "Đăng ký giữ chỗ trực tuyến.",
                "Thanh toán học phí tại quầy.",
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-indigo-50 font-medium leading-tight">
                    {text}
                  </span>
                </div>
              ))}
            </div>
            {/* Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </Col>
      </Row>

      {/* MODAL */}
      <ClassListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        course={selectedCourse}
        classes={classesOfCourse}
        loading={loadingClasses}
        onRegister={(cls) => {
          handleRegister(cls);
        }}
      />
    </div>
  );
};

export default StudentCourseRegister;
