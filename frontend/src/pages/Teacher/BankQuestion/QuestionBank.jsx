// src/components/QuestionBank/QuestionBank.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "@/context/authContext";
import api from "@/utils/axiosInstance";
import {
  Search,
  Database,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { message } from "antd";
import CourseList from "../Materials/CourseList"; // Đảm bảo đường dẫn đúng
import QuestionBankContent from "./QuestionBankContent";

const QuestionBank = () => {
  const { currentUser } = useContext(AuthContext);
  const contentRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchData = async () => {
    if (!currentUser?.TeacherId) return;
    setLoading(true);
    try {
      const res = await api.get(`/courses`);
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

  const filteredCourses = courses.filter((course) =>
    (course.CourseName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {selectedCourse ? (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => setSelectedCourse(null)}
              className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-500"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <span>Ngân hàng câu hỏi</span>
                <ChevronRight size={14} />
                <span className="font-semibold text-blue-600">
                  {selectedCourse.CourseName}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Quản lý Bài kiểm tra & Câu hỏi
              </h2>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-blue-600" size={28} />
                Ngân hàng câu hỏi
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Soạn thảo câu hỏi, tạo đề thi và phân phối cho các lớp học.
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
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={fetchData}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 shadow-sm transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* BODY */}
      {selectedCourse ? (
        <QuestionBankContent
          ref={contentRef}
          courseId={selectedCourse.CourseId}
        />
      ) : (
        <CourseList
          loading={loading}
          courses={filteredCourses}
          renderStatusBadge={() => {}}
          onSelectCourse={setSelectedCourse}
          onClearSearch={() => setSearchTerm("")}
        />
      )}
    </div>
  );
};

export default QuestionBank;
