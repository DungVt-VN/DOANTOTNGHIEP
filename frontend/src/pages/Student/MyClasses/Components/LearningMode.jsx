import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { Badge, Progress, message, Breadcrumb } from "antd";
import {
  ListVideo,
  Home,
  AlertTriangle,
  FileVideo,
  PlayCircle,
} from "lucide-react";

import LessonSidebar from "./LessonSidebar";
import LessonResources from "./LessonResources";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";

// --- 1. Helper: Kiểm tra URL ---
const isValidUrl = (urlString) => {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

const LearningMode = ({ chapters, stats }) => {
  // STATE: Active Lesson
  const [activeLesson, setActiveLesson] = useState(null);

  // STATE: Danh sách ID bài đã học (Dùng mảng số nguyên)
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  const { currentUser } = useContext(AuthContext);

  // REF: Ngăn spam API (Khóa gọi API khi đang xử lý)
  const markingRef = useRef(false);

  // --- 2. Effect: Chọn bài đầu tiên ---
  useEffect(() => {
    if (chapters && chapters.length > 0 && !activeLesson) {
      const firstLesson = chapters[0]?.lessons?.[0];
      if (firstLesson) setActiveLesson(firstLesson);
    }
  }, [chapters]);

  // --- 3. Effect: Lấy tiến độ ban đầu ---
  useEffect(() => {
    const fetchProgress = async () => {
      if (!currentUser?.userId) return;
      try {
        const response = await api.get(
          `/chapters/progress/${currentUser.userId}`,
        );
        if (response.data.success) {
          // QUAN TRỌNG: Ép kiểu sang Number để so sánh chính xác
          const ids = response.data.completedLessonIds.map((id) => Number(id));
          setCompletedLessonIds(ids);
          console.log("Tiến độ đã tải:", ids);
        }
      } catch (error) {
        console.error("Lỗi lấy tiến độ:", error);
      }
    };
    fetchProgress();
  }, [currentUser]);

  // Reset biến khóa API khi đổi bài học
  useEffect(() => {
    markingRef.current = false;
  }, [activeLesson]);

  // --- 4. Logic tìm Chapter ---
  const currentChapter = useMemo(() => {
    if (!activeLesson || !chapters) return null;
    return chapters.find((c) =>
      c.lessons.some((l) => l.LessonId === activeLesson.LessonId),
    );
  }, [chapters, activeLesson]);

  // --- 5. HÀM QUAN TRỌNG: Đánh dấu hoàn thành ---
  const markLessonAsComplete = async () => {
    if (!activeLesson || !currentUser?.userId) return;

    const currentId = Number(activeLesson.LessonId);

    // 1. Kiểm tra xem đã hoàn thành chưa (tránh gọi lại)
    if (completedLessonIds.includes(currentId)) return;

    // 2. Kiểm tra xem có đang gọi API không (tránh spam)
    if (markingRef.current) return;

    try {
      markingRef.current = true; // Khóa lại

      // Optimistic Update: Cập nhật UI ngay lập tức
      setCompletedLessonIds((prev) => [...prev, currentId]);
      message.success("Đã hoàn thành bài học!");

      // Gọi API thực tế
      await api.post(`/chapters/progress`, {
        userId: currentUser.userId,
        lessonId: currentId,
        isCompleted: true,
      });
    } catch (error) {
      console.error("Lỗi lưu tiến độ:", error);
      // Nếu lỗi thì bỏ tích xanh đi
      setCompletedLessonIds((prev) => prev.filter((id) => id !== currentId));
      markingRef.current = false; // Mở khóa để thử lại
    }
  };

  // --- 6. HÀM QUAN TRỌNG: Xử lý tiến độ video ---
  const handleTimeUpdate = (e) => {
    const { currentTime, duration } = e.target;

    // Kiểm tra duration hợp lệ (tránh NaN)
    if (duration && duration > 0) {
      const progressPercent = (currentTime / duration) * 100;

      // NGƯỠNG HOÀN THÀNH: Nếu xem trên 85% thì tính là đã học xong
      if (progressPercent > 85) {
        markLessonAsComplete();
      }
    }
  };

  // --- 7. Render Player ---
  const renderPlayerContent = () => {
    if (!activeLesson) {
      return (
        <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
          <PlayCircle size={48} className="opacity-50" />
          <p>Đang tải nội dung...</p>
        </div>
      );
    }

    if (!activeLesson.VideoUrl) {
      return (
        <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
          <FileVideo size={48} className="opacity-50" />
          <p>Bài học này không có video</p>
        </div>
      );
    }

    if (!isValidUrl(activeLesson.VideoUrl)) {
      return (
        <div className="flex flex-col items-center justify-center text-red-400 gap-3 p-4 text-center">
          <AlertTriangle size={48} className="opacity-80" />
          <div>
            <p className="font-semibold text-lg">Video không khả dụng</p>
            <p className="text-xs text-slate-600 mt-2 font-mono bg-black/50 px-2 py-1 rounded">
              URL: {activeLesson.VideoUrl}
            </p>
          </div>
        </div>
      );
    }

    // VIDEO PLAYER CHÍNH
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <video
          // Key quan trọng để reset video khi đổi bài
          key={activeLesson.VideoUrl}
          className="w-full h-full object-contain"
          controls
          autoPlay
          controlsList="nodownload"
          // Gắn sự kiện theo dõi thời gian để tính %
          onTimeUpdate={handleTimeUpdate}
          // Backup: Gắn sự kiện khi kết thúc
          onEnded={markLessonAsComplete}
        >
          <source src={activeLesson.VideoUrl} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ thẻ video.
        </video>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 p-4">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[600px]">
        {/* --- LEFT: PLAYER --- */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pr-2">
          {/* Video Container */}
          <div className="bg-black rounded-2xl shadow-lg overflow-hidden aspect-video relative border border-slate-800 z-10 flex items-center justify-center">
            {renderPlayerContent()}
          </div>

          {/* Title Info */}
          <div className="mt-5">
            <div className="mb-2">
              <Breadcrumb
                items={[
                  {
                    title: (
                      <span className="flex items-center gap-1">
                        <Home size={14} /> Khóa học
                      </span>
                    ),
                  },
                  { title: currentChapter?.Title || "Unit" },
                ]}
              />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                {activeLesson?.Title || "Chọn bài học"}
              </h1>
              {/* Hiển thị badge ĐÃ XEM cạnh tiêu đề */}
              {completedLessonIds.includes(Number(activeLesson?.LessonId)) && (
                <Badge count="Đã học" style={{ backgroundColor: "#52c41a" }} />
              )}
            </div>

            <p className="text-slate-500 text-sm mt-1">
              Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
            </p>
          </div>

          <LessonResources lesson={activeLesson} />
          <div className="h-10"></div>
        </div>

        {/* --- RIGHT: SIDEBAR --- */}
        <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl shrink-0 h-full overflow-hidden sticky top-4">
          <div className="p-5 border-b border-gray-100 bg-white z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <ListVideo className="text-indigo-600" size={22} />
                <span>Nội dung khóa học</span>
              </div>
              <Badge
                count={`${stats?.CompletedLessons || 0}/${stats?.TotalLessons || 0}`}
                style={{
                  backgroundColor: "#EEF2FF",
                  color: "#4F46E5",
                  borderColor: "#C7D2FE",
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Tiến độ hoàn thành</span>
                <span>{stats?.LearningProgress || 0}%</span>
              </div>
              <Progress
                percent={stats?.LearningProgress || 0}
                showInfo={false}
                strokeColor={{ "0%": "#6366f1", "100%": "#a855f7" }}
                size="small"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2">
            <LessonSidebar
              chapters={chapters}
              currentLesson={activeLesson}
              onSelectLesson={setActiveLesson}
              completedLessonIds={completedLessonIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningMode;
