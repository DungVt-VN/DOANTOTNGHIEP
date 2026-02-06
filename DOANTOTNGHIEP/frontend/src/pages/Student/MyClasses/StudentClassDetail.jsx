import React, { useEffect, useState, useContext } from "react";
import { Skeleton, Breadcrumb, Empty, Badge } from "antd";
import {
  Info,
  BookOpen,
  CheckCircle,
  Home,
  FileText,
  ClipboardList,
  ArrowLeft,
  Download,
  Clock,
  ChevronRight,
  MonitorPlay,
  User,
  MessageSquare,
  FileBadge,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
// import api from "@/utils/axiosInstance"; // Tạm thời chưa dùng API thực
import { AuthContext } from "@/context/authContext";

// Import Custom Components
import ClassOverview from "@/components/Classes/Student/ClassOverview";
import LessonSidebar from "@/components/Classes/Student/LessonSidebar";
import LessonPlayer from "@/components/Classes/Student/LessonPlayer";
import ClassAssignments from "@/components/Classes/Student/ClassAssignments";
import CommonButton from "@/components/CommonButton";
import RefreshButton from "@/components/RefreshButton";

// --- SUB-COMPONENT: DOCUMENT CARD (Grid Layout) ---
const ClassDocuments = ({ documents }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in duration-300">
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <FileText size={20} strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-gray-800">Tài liệu môn học</h3>
    </div>

    {documents && documents.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {documents.map((doc, idx) => (
          <div
            key={idx}
            className="group relative flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
          >
            {/* Icon File Type */}
            <div className="w-12 h-12 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-700 text-sm truncate group-hover:text-blue-700 mb-1">
                {doc.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                  {doc.ext || "FILE"}
                </span>
                <span>•</span>
                <span>{doc.size}</span>
                <span>•</span>
                <span>{doc.date}</span>
              </div>
            </div>

            {/* Action Icon */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Download
                size={18}
                className="text-gray-400 hover:text-blue-600"
              />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="py-12 flex flex-col items-center justify-center">
        <Empty
          description="Chưa có tài liệu nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )}
  </div>
);

// --- SUB-COMPONENT: QUIZ LIST (List Layout) ---
const ClassQuizzes = ({ quizzes }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in fade-in duration-300">
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <ClipboardList size={20} strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-gray-800">
        Bài kiểm tra & Trắc nghiệm
      </h3>
    </div>

    {quizzes && quizzes.length > 0 ? (
      <div className="flex flex-col gap-4">
        {quizzes.map((quiz, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all gap-4 bg-white group"
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div
                className={`mt-0.5 p-2 rounded-full shrink-0 ${
                  quiz.status === "done"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-500"
                }`}
              >
                {quiz.status === "done" ? (
                  <CheckCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>

              <div>
                <h4 className="font-bold text-gray-800 text-base group-hover:text-indigo-700 transition-colors">
                  {quiz.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {quiz.duration} phút
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    Hạn chót:{" "}
                    <span className="text-gray-700 font-bold">
                      {quiz.deadline}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <CommonButton
              text={quiz.status === "done" ? "Xem kết quả" : "Làm bài ngay"}
              variant={quiz.status === "done" ? "default" : "primary"}
              className={`w-full sm:w-auto h-9 text-xs ${
                quiz.status !== "done"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                  : ""
              }`}
              icon={quiz.status !== "done" && <ChevronRight size={14} />}
              iconPosition="right"
            />
          </div>
        ))}
      </div>
    ) : (
      <div className="py-12 flex flex-col items-center justify-center">
        <Empty
          description="Chưa có bài kiểm tra nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )}
  </div>
);

// --- MAIN PAGE ---
const StudentClassDetail = () => {
  const { classId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Data State
  const [classInfo, setClassInfo] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Mock Data
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // --- HÀM TẢI DỮ LIỆU (ĐÃ THÊM MOCK DATA) ---
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // GIẢ LẬP CALL API (Comment phần gọi thật để test UI)
      /*
      const [infoRes, contentRes, assignRes, notiRes] = await Promise.all([
        api.get(`/student/classes/${classId}/info`),
        api.get(`/student/classes/${classId}/content`),
        api.get(`/student/classes/${classId}/assignments`),
        api.get(`/student/classes/${classId}/notifications`),
      ]);
      setClassInfo(infoRes.data);
      setChapters(contentRes.data);
      setAssignments(assignRes.data);
      setNotifications(notiRes.data);
      */

      // --- DỮ LIỆU MẪU (MOCK DATA) ---

      // 1. Thông tin lớp học
      setClassInfo({
        ClassName: "Lập trình Web Front-End (ReactJS)",
        CourseName: "Công Nghệ Phần Mềm",
        TeacherName: "ThS. Nguyễn Văn A",
        Description:
          "Khóa học cung cấp kiến thức nền tảng về ReactJS, Hooks, Redux và Ant Design.",
        Room: "P.301 - Nhà A2",
        Time: "Thứ 2, 4 (07:00 - 11:30)",
        StudentsCount: 45,
      });

      // 2. Nội dung bài học (Chapters & Lessons)
      const mockChaptersData = [
        {
          ChapterId: 1,
          Title: "Chương 1: Tổng quan về ReactJS",
          lessons: [
            {
              LessonId: 101,
              Title: "Giới thiệu & Cài đặt môi trường",
              Type: "video",
              Duration: "45:00",
              VideoUrl: "demo",
            },
            {
              LessonId: 102,
              Title: "JSX và Components",
              Type: "video",
              Duration: "60:00",
              VideoUrl: "demo",
            },
          ],
        },
        {
          ChapterId: 2,
          Title: "Chương 2: Hooks cơ bản",
          lessons: [
            {
              LessonId: 201,
              Title: "useState & useEffect",
              Type: "video",
              Duration: "55:00",
              VideoUrl: "demo",
            },
            {
              LessonId: 202,
              Title: "Demo dự án Todo List",
              Type: "code",
              Duration: "30:00",
              VideoUrl: "demo",
            },
          ],
        },
        {
          ChapterId: 3,
          Title: "Chương 3: Routing & API",
          lessons: [
            {
              LessonId: 301,
              Title: "React Router Dom V6",
              Type: "video",
              Duration: "50:00",
              VideoUrl: "demo",
            },
            {
              LessonId: 302,
              Title: "Axios & Fetch Data",
              Type: "video",
              Duration: "40:00",
              VideoUrl: "demo",
            },
          ],
        },
      ];
      setChapters(mockChaptersData);

      // 3. Bài tập
      setAssignments([
        {
          AssignmentId: 1,
          Title: "Bài tập lớn số 1: Xây dựng Landing Page",
          Description:
            "Sử dụng React và Tailwind CSS để clone giao diện Netflix.",
          Deadline: "2025-10-30T23:59:00",
          Status: "submitted", // submitted, late, pending
          Score: 8.5,
        },
        {
          AssignmentId: 2,
          Title: "Lab 2: Quản lý State",
          Description:
            "Thực hành useState để làm chức năng đếm số và đổi màu nền.",
          Deadline: "2025-11-05T23:59:00",
          Status: "pending",
          Score: null,
        },
      ]);

      // 4. Thông báo
      setNotifications([
        {
          Id: 1,
          Title: "Thông báo nghỉ học bù",
          Content: "Lớp nghỉ thứ 6 tuần này, sẽ học bù vào sáng Chủ Nhật.",
          Date: "2025-10-20",
        },
        {
          Id: 2,
          Title: "Cập nhật tài liệu chương 3",
          Content: "Thầy đã upload slide mới, các em vào tải về xem trước nhé.",
          Date: "2025-10-22",
        },
      ]);

      // 5. Tài liệu (Mock)
      setDocuments([
        {
          name: "Slide bài giảng - Chương 1: Giới thiệu",
          size: "2.4 MB",
          date: "20/10/2025",
          ext: "PDF",
        },
        {
          name: "Source Code Demo - React Hooks",
          size: "1.1 MB",
          date: "22/10/2025",
          ext: "ZIP",
        },
        {
          name: "Ebook Reference Guide 2025",
          size: "5.6 MB",
          date: "23/10/2025",
          ext: "PDF",
        },
        {
          name: "Đề cương ôn tập giữa kỳ",
          size: "500 KB",
          date: "25/10/2025",
          ext: "DOCX",
        },
      ]);

      // 6. Bài kiểm tra (Mock)
      setQuizzes([
        {
          title: "Kiểm tra 15 phút - Chương 1",
          duration: 15,
          deadline: "25/10/2025",
          status: "pending",
        },
        {
          title: "Kiểm tra giữa kỳ (Mid-term)",
          duration: 45,
          deadline: "01/11/2025",
          status: "done",
        },
      ]);

      // Giả lập độ trễ mạng
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Lỗi tải dữ liệu lớp học", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleSelectLesson = (lessonId) => {
    for (const c of chapters) {
      const l = c.lessons.find((x) => x.LessonId === lessonId);
      if (l) {
        setCurrentLesson(l);
        break;
      }
    }
  };

  const getUploadProps = (assignmentId) => ({
    name: "file",
    action: "http://localhost:8800/api/assignments/submit",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    data: { assignmentId },
  });

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: <Info size={18} /> },
    { key: "learning", label: "Bài học", icon: <MonitorPlay size={18} /> },
    { key: "assignments", label: "Bài tập", icon: <CheckCircle size={18} /> },
    { key: "documents", label: "Tài liệu", icon: <FileText size={18} /> },
    { key: "quizzes", label: "Kiểm tra", icon: <ClipboardList size={18} /> },
  ];

  if (loading)
    return (
      <div className="w-full px-6 md:px-8 py-8 min-h-screen bg-slate-50 font-sans">
        <Skeleton active paragraph={{ rows: 2 }} className="mb-8" />
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 w-full">
      {/* 1. HEADER SECTION (Sticky & Full Width) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 w-full shadow-sm">
        <div className="w-full px-6 md:px-8 pt-5 pb-0">
          {/* Row 1: Breadcrumb + Action Buttons */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-5">
            {/* Breadcrumb - Fix lỗi xuống dòng & icon */}
            <Breadcrumb
              className="text-sm font-medium"
              items={[
                {
                  title: (
                    <Link
                      to="/student/dashboard"
                      className="inline-flex items-center gap-1.5 whitespace-nowrap
                 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <span>Trang chủ</span>
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/student/classes"
                      className="inline-flex items-center gap-1.5 whitespace-nowrap
                 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <span>Lớp học của tôi</span>
                    </Link>
                  ),
                },

                {
                  title: (
                    <span className="text-slate-800 font-bold">
                      {classInfo?.ClassName}
                    </span>
                  ),
                },
              ]}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <RefreshButton
                onClick={() => fetchData(true)}
                loading={refreshing}
                tooltip="Tải lại dữ liệu"
              />
              <CommonButton
                text="Quay lại"
                variant="default"
                icon={<ArrowLeft size={16} />}
                onClick={() => navigate("/student/classes")}
                className="h-9 bg-gray-50 border-gray-200 hover:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Title & Metadata */}
          <div className="flex items-center gap-5 mb-6">
            {/* Large Icon Box */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
              <FileBadge size={32} strokeWidth={1.5} />
            </div>

            {/* Title Group */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 leading-tight tracking-tight">
                {classInfo?.ClassName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-100">
                  <BookOpen size={14} /> {classInfo?.CourseName}
                </span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span className="hidden sm:inline">
                  {classInfo?.Semester || "2026"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Modern Tabs (Underline Style) */}
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar border-t border-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                        group relative flex items-center gap-2 pb-3 pt-2 text-sm font-bold transition-all whitespace-nowrap
                        ${
                          activeTab === tab.key
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-slate-800"
                        }
                    `}
              >
                <span
                  className={`p-1 rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-blue-50"
                      : "group-hover:bg-slate-100"
                  }`}
                >
                  {tab.icon}
                </span>
                {tab.label}

                {/* Active Indicator Line */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-blue-600 transition-transform duration-300 ${
                    activeTab === tab.key ? "scale-x-100" : "scale-x-0"
                  }`}
                ></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="w-full px-6 md:px-8 py-8">
        {/* VIEW: LEARNING (Split Layout) */}
        {activeTab === "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
            {/* Sidebar */}
            <div className="lg:col-span-3 xl:col-span-3 h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-slate-700 flex justify-between items-center bg-gray-50/50">
                <span>Nội dung bài học</span>
                <Badge
                  count={chapters.reduce((acc, c) => acc + c.lessons.length, 0)}
                  color="blue"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <LessonSidebar
                  chapters={chapters}
                  currentLesson={currentLesson}
                  onSelectLesson={handleSelectLesson}
                />
              </div>
            </div>

            {/* Player */}
            <div className="lg:col-span-9 xl:col-span-9 h-full overflow-y-auto no-scrollbar rounded-xl border border-gray-200 bg-white shadow-sm relative">
              <LessonPlayer lesson={currentLesson} />
            </div>
          </div>
        )}

        {/* VIEW: OTHERS (Grid Layout) */}
        {activeTab !== "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Main Content) */}
            <div className="lg:col-span-8 2xl:col-span-9 space-y-8">
              {activeTab === "overview" && (
                <ClassOverview
                  classInfo={classInfo}
                  notifications={notifications}
                  loading={loading}
                />
              )}

              {activeTab === "assignments" && (
                <ClassAssignments
                  assignments={assignments}
                  onUpload={getUploadProps}
                />
              )}

              {activeTab === "documents" && (
                <ClassDocuments documents={documents} />
              )}

              {activeTab === "quizzes" && <ClassQuizzes quizzes={quizzes} />}
            </div>

            {/* Right Column (Widgets) */}
            <div className="hidden lg:block lg:col-span-4 2xl:col-span-3 space-y-6 sticky top-48">
              {/* Widget Giảng viên */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider">
                    Giảng viên
                  </h3>
                  <User size={16} className="text-gray-400" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-lg shadow-sm">
                    {classInfo?.TeacherName?.charAt(0) || "T"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate">
                      {classInfo?.TeacherName || "Chưa cập nhật"}
                    </p>
                    <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block border border-blue-100">
                      Giảng viên chính
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex gap-3">
                  <CommonButton
                    variant="default"
                    className="flex-1 h-8 text-xs bg-gray-50 border-gray-200 hover:bg-white hover:border-blue-200"
                    text="Nhắn tin"
                    icon={<MessageSquare size={14} />}
                  />
                  <CommonButton
                    variant="default"
                    className="flex-1 h-8 text-xs bg-gray-50 border-gray-200 hover:bg-white hover:border-blue-200"
                    text="Hồ sơ"
                    icon={<User size={14} />}
                  />
                </div>
              </div>

              {/* Widget Progress */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-6 shadow-lg shadow-blue-100 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                <div className="flex items-end gap-2 mb-3 relative z-10">
                  <span className="text-4xl font-extrabold tracking-tight">
                    25%
                  </span>
                  <span className="text-sm opacity-80 mb-1 font-medium">
                    hoàn thành
                  </span>
                </div>

                <div className="w-full bg-black/20 rounded-full h-2 mb-4 backdrop-blur-sm relative z-10">
                  <div
                    className="bg-white h-2 rounded-full shadow-sm"
                    style={{ width: "25%" }}
                  ></div>
                </div>

                <p className="text-xs opacity-90 leading-relaxed font-medium relative z-10 border-t border-white/10 pt-3">
                  "Học tập là hạt giống của kiến thức, kiến thức là hạt giống
                  của hạnh phúc."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassDetail;
