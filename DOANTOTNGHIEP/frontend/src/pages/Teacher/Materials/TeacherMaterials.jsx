import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import {
  Search,
  Library,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button, message } from "antd";

// Import Components con
import CourseList from "./CourseList";
import CourseContent from "./CourseContent";

const TeacherMaterials = () => {
  const { currentUser } = useContext(AuthContext);
  const contentRef = useRef(null); // Ref để gọi hàm của component con

  // States
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  // --- FETCH DATA LIST ---
  const fetchData = async () => {
    if (!currentUser?.TeacherId) return;
    setLoading(true);
    try {
      const res = await api.get(`/courses`);
      console.log(res);
      const data = Array.isArray(res.data)
        ? res.data
        : Object.values(res.data || {});
      setCourses(data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách khóa học");
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // --- HANDLERS TƯƠNG TÁC COMPONENT CON ---

  // 1. Gọi hàm mở modal "Thêm chương" của con
  const handleAddChapterClick = () => {
    if (contentRef.current) {
      contentRef.current.triggerAddChapter();
    }
  };

  // 2. Gọi hàm reload lại nội dung chi tiết của con
  const handleRefreshContent = () => {
    if (contentRef.current) {
      contentRef.current.refresh();
    }
  };

  // Logic Filter
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.CourseName || "").toLowerCase().includes(searchLower) ||
      (course.Subject || "").toLowerCase().includes(searchLower)
    );
  });

  // Helper Badge
  const renderStatusBadge = (status) => {
    const color = status === "Active" ? "blue" : "gray";
    return (
      <span
        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase border bg-${color}-50 text-${color}-700 border-${color}-200`}
      >
        {status === "Active" ? "Đang hoạt động" : "Bản nháp"}
      </span>
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {selectedCourse ? (
          // === HEADER:  VIEW ===
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => setSelectedCourse(null)}
              className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-500"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <span>Kho học liệu</span>
                <ChevronRight size={14} />
                <span className="font-semibold text-blue-600">
                  {selectedCourse.CourseName}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Quản lý nội dung
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Nút Reload: Style giống trang list */}

              <Button
                type="primary"
                icon={<Plus size={16} />}
                className="bg-blue-600 h-10"
                onClick={handleAddChapterClick}
              >
                Thêm chương
              </Button>
              <button
                onClick={handleRefreshContent}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm h-10 w-10 flex items-center justify-center"
                title="Làm mới nội dung"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        ) : (
          // === HEADER: LIST VIEW ===
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Library className="text-blue-600" size={28} />
                Kho học liệu (Master)
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Quản lý nội dung gốc của các môn học.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72 group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm môn học..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Nút Reload List */}
              <button
                onClick={fetchData}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 shadow-sm"
                title="Làm mới danh sách"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* CONTENT BODY */}
      {selectedCourse ? (
        <CourseContent
          ref={contentRef}
          courseId={selectedCourse.CourseId}
          onDeleteMaterial={() => {}}
        />
      ) : (
        <CourseList
          loading={loading}
          courses={filteredCourses}
          searchTerm={searchTerm}
          renderStatusBadge={renderStatusBadge}
          onSelectCourse={setSelectedCourse}
          onClearSearch={() => setSearchTerm("")}
        />
      )}
    </div>
  );
};

export default TeacherMaterials;
