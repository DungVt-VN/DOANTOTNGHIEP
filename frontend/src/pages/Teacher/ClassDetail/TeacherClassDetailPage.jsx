import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";

// Import Components
import ClassHeader from "@/components/Course/Teacher/ClassHeader";
import OverviewTab from "@/components/Course/Teacher/OverviewTab";
import CurriculumTab from "@/components/Course/Teacher/CurriculumTab";
import StudentsTab from "@/components/Course/Teacher/StudentsTab";
import AssignmentsTab from "@/components/Course/Teacher/AssignmentsTab";

const TeacherClassDetailPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch thông tin cơ bản của lớp (Header + Overview)
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/classes/detail/${classId}`);
        // console.log("Class Detail:", response.data);
        setClassData(response.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu lớp học:", err);
        setError("Không thể tải thông tin lớp học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  // --- RENDER LOADING ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- RENDER ERROR HOẶC NOT FOUND ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
        <p className="mb-4 text-red-500 font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          Quay lại trang trước
        </button>
      </div>
    );
  }

  if (!classData)
    return <div className="text-center mt-10">Không tìm thấy lớp học</div>;

  // --- RENDER CONTENT THEO TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        // Overview cần hiển thị thông tin tổng quan đã lấy được từ API detail
        return <OverviewTab data={classData} />;

      case "curriculum":
        // Curriculum cần CourseId để lấy nội dung chương trình học
        // Và ClassId để (có thể) xem tiến độ của lớp
        return (
          <CurriculumTab classId={classId} courseId={classData.CourseId} />
        );

      case "students":
        // StudentsTab chỉ cần ClassId để gọi API lấy danh sách học sinh
        return <StudentsTab classId={classId} />;

      case "assignments":
        // AssignmentsTab cần ClassId để xem bài tập của lớp này
        // Và CourseId để lấy ngân hàng đề thi nếu cần phân phối thêm
        return (
          <AssignmentsTab classId={classId} courseId={classData.CourseId} />
        );

      default:
        return <OverviewTab data={classData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header hiển thị thông tin chung và Navigation Tabs */}
      <ClassHeader
        classData={classData}
        onBack={() => navigate(-1)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Nội dung chính thay đổi theo Tab */}
      <div className="max-w-7xl mx-auto px-6 py-8">{renderContent()}</div>
    </div>
  );
};

export default TeacherClassDetailPage;
