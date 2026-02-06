import React, { useState, useEffect, useContext } from "react";
import {
  Input,
  Select,
  message, // Import message để hiển thị thông báo
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
  Info,
  RefreshCw,
  Library,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";
import dayjs from "dayjs";
import ClassListModal from "@/components/Classes/Student/ClassListModal";
import CourseCard from "./CourseCard";

const { Option } = Select;

const StudentCourseRegister = () => {
  const { currentUser } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States Filter & Pagination
  const [searchText, setSearchText] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [classesOfCourse, setClassesOfCourse] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // State mới: ID của lớp đang được xử lý đăng ký (để hiển thị loading spinner)
  const [registeringId, setRegisteringId] = useState(null);

  // Fetch Data
  const fetchCourses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/courses/courses-available");
      setCourses(res.data);
    } catch (error) {
      console.error(error);
      setCourses([]);
      if (isRefresh) message.error("Không thể làm mới dữ liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleReload = () => fetchCourses(true);

  // Handle Course Click
  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setModalVisible(true);
    setClassesOfCourse([]); // Reset data cũ
    setLoadingClasses(true);

    try {
      // Truyền userId vào query để backend check status IsRegistered (nếu backend cần)
      const res = await api.get(
        `/classes/classes-by-course/${course.CourseId}`,
        {
          params: { userId: currentUser?.UserId },
        },
      );
      setClassesOfCourse(res.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách lớp");
      setClassesOfCourse([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // --- LOGIC ĐĂNG KÝ (QUAN TRỌNG) ---
  const handleRegister = async (cls) => {
    // 1. Set loading cho đúng cái nút của lớp đó
    setRegisteringId(cls.ClassId);

    try {
      // 2. Gọi API đăng ký
      await api.post("/classes/register-class", {
        classId: cls.ClassId,
        userId: currentUser.UserId,
      });

      message.success(`Đăng ký lớp ${cls.ClassName} thành công!`);

      // 3. Cập nhật lại UI ngay lập tức (Optimistic Update)
      setClassesOfCourse((prev) =>
        prev.map((c) =>
          c.ClassId === cls.ClassId
            ? {
                ...c,
                IsRegistered: true, // Đổi trạng thái thành đã đăng ký
                Enrolled: c.Enrolled + 1, // Tăng sĩ số lên 1
              }
            : c,
        ),
      );

      // (Tùy chọn) Cập nhật lại list khóa học ở ngoài nếu cần hiển thị số lớp đã đăng ký
      // fetchCourses(true);
    } catch (error) {
      console.error(error);
      // Hiển thị lỗi từ backend trả về (ví dụ: Lớp đầy, Đã đăng ký rồi...)
      message.error(
        error.response?.data || "Đăng ký thất bại, vui lòng thử lại.",
      );
    } finally {
      // 4. Tắt loading
      setRegisteringId(null);
    }
  };

  // Filter Logic
  const filteredCourses = courses.filter((c) => {
    const matchText = c.CourseName.toLowerCase().includes(
      searchText.toLowerCase(),
    );
    const matchSubject = filterSubject === "all" || c.Subject === filterSubject;
    return matchText && matchSubject;
  });

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const subjects = [...new Set(courses.map((c) => c.Subject))].filter(Boolean);
  const today = dayjs().format("dddd, DD MMMM YYYY");

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* ... (Phần Header giữ nguyên) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide first-letter:uppercase">
            {today}
          </p>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Library className="text-blue-600" size={32} /> Đăng ký khóa học
          </h1>
          <p className="text-slate-500 mt-2 text-base font-medium max-w-2xl">
            Chọn môn học và lớp phù hợp để bắt đầu hành trình chinh phục tri
            thức.
          </p>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          {/* ... (Phần Filter Toolbar giữ nguyên) ... */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 sticky top-0 z-10">
            {/* Input Search, Select Subject, Button Reload... */}
            <Input
              placeholder="Tìm tên khóa học..."
              prefix={<Search size={18} className="text-gray-400" />}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 rounded-lg"
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
            >
              <Option value="all">Tất cả môn</Option>
              {subjects.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
            <Tooltip title="Cập nhật danh sách">
              <button
                onClick={handleReload}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all duration-200 text-sm font-medium h-[40px]"
              >
                <RefreshCw
                  size={16}
                  className={`${refreshing ? "animate-spin text-blue-600" : ""}`}
                />{" "}
                <span className="hidden sm:inline">Tải lại</span>
              </button>
            </Tooltip>
          </div>

          {/* Grid Courses */}
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
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </Col>

        {/* ... (Phần Sidebar giữ nguyên) ... */}
        <Col xs={24} lg={6} className="space-y-6">
          {/* Sidebar content */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
              <Info size={20} /> Hướng dẫn
            </h3>
            <div className="space-y-5 relative z-10 text-sm">
              {[
                "Chọn khóa học.",
                "Xem chi tiết lớp.",
                "Đăng ký giữ chỗ.",
                "Thanh toán.",
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
        registeringId={registeringId}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default StudentCourseRegister;
