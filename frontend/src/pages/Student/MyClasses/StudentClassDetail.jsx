import React, { useEffect, useState, useContext } from "react";
import { Skeleton, message, Empty } from "antd";
import { useParams } from "react-router-dom";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";

// Import Components đã tách
import ClassHeader from "./components/ClassHeader";
import ClassOverview from "./components/ClassOverview";
import TeacherWidget from "./components/TeacherWidget";
import LearningMode from "./components/LearningMode";
import { DocumentList } from "./components/TabContents";
import ClassAssignments from "@/components/Classes/Student/ClassAssignments"; // Giữ nguyên import cũ của bạn
import QuizList from "./Components/QuizList";

const StudentClassDetail = () => {
  const { classId } = useParams();
  const { currentUser } = useContext(AuthContext);

  // --- STATE ---
  const [rawData, setRawData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/classes/detail-student/${classId}`, {
        params: { userId: currentUser?.UserId },
      });
      setRawData(res.data);

      if (
        res.data.Chapters?.length > 0 &&
        res.data.Chapters[0].lessons?.length > 0
      ) {
        setCurrentLesson(res.data.Chapters[0].lessons[0]);
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể tải dữ liệu lớp học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && currentUser) fetchData();
  }, [classId, currentUser]);

  // --- HANDLERS ---
  const handleSelectLesson = (lessonId) => {
    if (!rawData?.Chapters) return;
    for (const c of rawData.Chapters) {
      const list = c.lessons || [];
      const l = list.find((x) => x.LessonId === lessonId);
      if (l) {
        setCurrentLesson(l);
        break;
      }
    }
  };

  const getAllDocuments = () => {
    if (!rawData?.Chapters) return [];
    return rawData.Chapters.flatMap((c) =>
      (c.lessons || []).flatMap((l) => l.Materials || []),
    );
  };

  // --- RENDER HELPERS ---
  if (loading)
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  if (!rawData)
    return <Empty description="Không tìm thấy dữ liệu" className="mt-20" />;

  // Data Mapping
  const ClassInfo = {
    ClassName: rawData.ClassName,
    Image: rawData.CourseImage,
    Subject: rawData.Subject,
    Status: rawData.Status,
    Description: rawData.Description || `Lớp học ${rawData.CourseName}...`,
    Schedule: {
      StartDate: rawData.StartDate,
      EndDate: rawData.EndDate,
      Days: rawData.Days,
      StartTime: rawData.StartTime,
      EndTime: rawData.EndTime,
      Room: rawData.RoomName,
      Location: rawData.Location,
    },
    Teacher: {
      Name: rawData.TeacherName,
      Avatar: rawData.TeacherAvatar,
      Bio: rawData.TeacherBio,
      Email: rawData.TeacherEmail,
      Phone: rawData.TeacherPhone,
    },
  };

  const Stats = {
    LearningProgress: rawData.LearningProgress || 0,
    TimeProgress: rawData.TimeProgress || 0,
    TotalLessons: rawData.LessonCount || 0,
    CompletedLessons: rawData.LessonCount
      ? Math.round(
          ((rawData.LearningProgress || 0) / 100) * rawData.LessonCount,
        )
      : 0,
    IsPaid: rawData.IsPaid,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-12">
      {/* 1. HEADER */}
      <ClassHeader
        classInfo={ClassInfo}
        stats={Stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assignmentsCount={rawData.Assignments?.length || 0}
        quizzesCount={rawData.Quizzes?.length || 0}
      />

      {/* 2. CONTENT */}
      <div className="container mx-auto px-6 py-8">
        {/* MODE: LEARNING */}
        {activeTab === "learning" && (
          <LearningMode
            currentLesson={currentLesson}
            chapters={rawData.Chapters}
            stats={Stats}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {/* MODE: OTHERS (Dashboard Layout) */}
        {activeTab !== "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 space-y-8">
              {activeTab === "overview" && (
                <ClassOverview
                  classInfo={ClassInfo}
                  stats={Stats}
                  assignments={rawData.Assignments}
                  quizzes={rawData.Quizzes}
                  notifications={rawData.Notifications}
                />
              )}

              {activeTab === "assignments" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4">
                    Danh sách bài tập
                  </h3>
                  <ClassAssignments
                    classId={classId}
                    userId={currentUser.userId}
                  />
                </div>
              )}

              {activeTab === "documents" && (
                <DocumentList documents={getAllDocuments()} />
              )}

              {activeTab === "quizzes" && <QuizList />}
            </div>

            {/* Right Column (Widgets) */}
            <div className="lg:col-span-1">
              <TeacherWidget
                teacher={ClassInfo.Teacher}
                stats={Stats}
                onContinueLearning={() => setActiveTab("learning")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassDetail;
