import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Filter, RefreshCw } from "lucide-react";

import CourseSkeleton from "@/components/Skeletons/CourseSkeleton";
import CourseCardItem from "@/components/Course/Teacher/CourseCardItem"; // Đảm bảo đường dẫn đúng

// --- COMPONENT CHÍNH ---
const TeacherSubjects = () => {
  const { currentUser } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    if (!currentUser?.TeacherId) return;

    setLoading(true);
    try {
      const res = await api.get(`/courses`);
      // Đảm bảo dữ liệu luôn là mảng
      const data = Array.isArray(res.data)
        ? res.data
        : Object.values(res.data || {});
      setCourses(data);
    } catch (err) {
      console.error("Lỗi tải môn học:", err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // --- 2. HÀM LẤY TRẠNG THÁI & RENDER BADGE ---
  const getStatusInfo = (status) => {
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

  const renderStatusBadge = (status) => {
    const { color, label } = getStatusInfo(status);
    const colorStyles = {
      cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 ring-1 ring-cyan-100",
      blue: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100",
      green:
        "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100",
      orange:
        "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100",
      red: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100",
      default: "bg-gray-50 text-gray-500 border-gray-200",
    };
    const styleClass = colorStyles[color] || colorStyles.default;

    return (
      <span
        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase border ${styleClass}`}
      >
        {label}
      </span>
    );
  };

  // --- 3. LOGIC LỌC ---
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();

    // Lấy tên khóa học an toàn
    // Hỗ trợ cả cấu trúc phẳng (CourseName) và lồng nhau (courseInfo.CourseName)
    const courseName = (
      course.CourseName ||
      course.courseInfo?.CourseName ||
      ""
    ).toLowerCase();

    // Lấy danh sách lớp an toàn
    const classList = course.Classes || course.classes || [];

    const isCourseMatch = courseName.includes(searchLower);

    const isClassMatch = classList.some((cls) =>
      (cls.ClassName || cls.CourseName || "")
        .toLowerCase()
        .includes(searchLower)
    );

    return isCourseMatch || isClassMatch;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={28} />
            Môn học giảng dạy
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý các bộ môn và lớp học phần bạn đang phụ trách.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* SEARCH BOX */}
          <div className="relative flex-1 md:w-72 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm môn học, lớp học..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* REFRESH BUTTON */}
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 active:scale-95 transition-transform shadow-sm"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {filteredCourses.map((course) => (
            <CourseCardItem
              key={
                course.CourseId || course.courseInfo?.CourseId || Math.random()
              }
              course={course}
              renderStatusBadge={renderStatusBadge}
              navigate={navigate}
            />
          ))}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Filter className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-600">
            Không tìm thấy kết quả
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {searchTerm
              ? `Không có môn nào khớp với "${searchTerm}"`
              : "Bạn chưa có lớp học nào."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-blue-600 font-medium hover:underline text-sm"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherSubjects;
