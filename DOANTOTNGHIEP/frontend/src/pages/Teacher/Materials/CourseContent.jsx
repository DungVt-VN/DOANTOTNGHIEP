import React, {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Tabs, Spin, message, Modal, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import api from "@/utils/axiosInstance";
import LessonModal from "@/components/Course/Teacher/CuriculumModal/LessonModal";
import ChapterModal from "@/components/Course/Teacher/CuriculumModal/ChapterModal";
import ChapterPane from "@/components/Course/Teacher/CourseContent/ChapterPane";
import ChapterTabLabel from "@/components/Course/Teacher/CourseContent/ChapterTabLabel";
import EmptyContentState from "@/components/Course/Teacher/CourseContent/EmptyContentState";
import { removeVietnameseTones } from "@/js/Helper";

const CourseContent = forwardRef(({ courseId, onDeleteMaterial }, ref) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);

  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- MODAL STATES ---
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // --- 1. FETCH DATA ---
  const fetchContent = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await api.get(`/courses/course-chapter/${courseId}`);
      setContent(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải nội dung:", err);
      message.error("Không thể tải nội dung khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useImperativeHandle(ref, () => ({
    triggerAddChapter: () => {
      setEditingChapter(null);
      setIsChapterModalOpen(true);
    },
    refresh: () => {
      setLoading(true);
      fetchContent();
    },
  }));

  useEffect(() => {
    setLoading(true);
    fetchContent();
  }, [fetchContent]);

  const filteredContent = useMemo(() => {
    if (!searchTerm || !content || content.length === 0) return content;
    const normalizedTerm = removeVietnameseTones(searchTerm);

    return content.filter((chapter) => {
      const title = removeVietnameseTones(
        chapter.Title || chapter.ChapterTitle || ""
      );
      const desc = removeVietnameseTones(chapter.Description || "");
      return title.includes(normalizedTerm) || desc.includes(normalizedTerm);
    });
  }, [content, searchTerm]);

  // --- HANDLERS: CHƯƠNG (CHAPTER) ---
  const handleSaveChapter = async (values) => {
    try {
      if (editingChapter) {
        await api.put(`/courses/course-chapter`, {
          ...values,
          CourseChapterId: editingChapter.CourseChapterId,
          CourseId: courseId,
        });
        message.success("Cập nhật chương thành công");
      } else {
        await api.post(`/courses/course-chapter`, {
          ...values,
          CourseId: courseId,
        });
        message.success("Tạo chương mới thành công");
      }
      setIsChapterModalOpen(false);
      fetchContent();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu chương");
    }
  };

  const handleDeleteChapter = (courseChapterId) => {
    Modal.confirm({
      title: "Xóa chương này?",
      content: "Toàn bộ bài học trong chương sẽ bị xóa vĩnh viễn.",
      okText: "Xóa ngay",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/courses/course-chapter/${courseChapterId}`);
          message.success("Đã xóa chương");
          fetchContent();
        } catch (err) {
          message.error("Lỗi khi xóa chương");
        }
      },
    });
  };

  // --- HANDLERS: BÀI HỌC (LESSON) ---
  const handleAddLesson = (chapterId) => {
    setEditingLesson(null);
    setSelectedChapterId(chapterId);
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (lesson, chapterId) => {
    setEditingLesson(lesson);
    setSelectedChapterId(chapterId);
    setIsLessonModalOpen(true);
  };

  // --- HÀM LƯU BÀI HỌC (ĐÃ CHỈNH SỬA CHO KHỚP API MỚI) ---
  const handleSaveLesson = async (submitData) => {
    setIsSubmitting(true);
    try {
      if (editingLesson) {
        const updatePayload = {
          ...submitData,
          LessonId: editingLesson.LessonId,
        };
        await api.put(`/chapters/lessons`, updatePayload);
        message.success("Cập nhật bài học thành công");
      } else {
        await api.post(`/chapters/lessons`, submitData);
        message.success("Thêm bài học thành công");
      }

      setIsLessonModalOpen(false);
      setRefreshKey((prev) => prev + 1); 
      fetchContent(); // Reload số lượng bài học
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu bài học");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = (lessonId) => {
    Modal.confirm({
      title: "Xóa bài học này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/chapters/lessons/${lessonId}`);
          message.success("Đã xóa bài học");
          setRefreshKey((prev) => prev + 1);
          fetchContent();
        } catch (err) {
          message.error("Lỗi khi xóa bài học");
        }
      },
    });
  };

  // --- RENDER (Giữ nguyên UI) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spin />
        <div className="mt-3 text-gray-500 text-sm">Đang tải nội dung...</div>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return (
      <EmptyContentState
        onCreateFirstChapter={() => {
          setEditingChapter(null);
          setIsChapterModalOpen(true);
        }}
        modalProps={{
          open: isChapterModalOpen,
          onClose: () => setIsChapterModalOpen(false),
          onFinish: handleSaveChapter,
          initialValues: editingChapter,
          existingChapters: [],
        }}
      />
    );
  }

  const items = filteredContent.map((chapter, index) => ({
    key: chapter.CourseChapterId,
    label: <ChapterTabLabel chapter={chapter} index={index} />,
    children: (
      <div className="h-full overflow-hidden">
        <ChapterPane
          chapter={chapter}
          refreshTrigger={refreshKey}
          onEditChapter={(c) => {
            setEditingChapter(c);
            setIsChapterModalOpen(true);
          }}
          onDeleteChapter={handleDeleteChapter}
          onAddLesson={handleAddLesson}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
          onDeleteMaterial={onDeleteMaterial}
        />
      </div>
    ),
  }));

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[750px] overflow-hidden flex flex-col">
        <Tabs
          tabPosition="left"
          className="h-full py-0 teacher-curriculum-tabs"
          items={items}
          renderTabBar={(props, DefaultTabBar) => (
            <div className="flex flex-col h-full bg-slate-50/60 border-r border-slate-200 w-[280px] relative">
              <div className="p-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/80">
                <Input
                  prefix={
                    <SearchOutlined className="text-slate-400 text-lg transition-colors group-hover:text-blue-500" />
                  }
                  placeholder="Tìm kiếm chương..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="rounded-lg border-slate-200 shadow-sm hover:border-blue-400 focus:border-blue-500 transition-all py-2 text-sm font-medium bg-white"
                />
                <div className="mt-2 flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Danh sách chương
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {items.length > 0 ? (
                  <DefaultTabBar
                    {...props}
                    style={{
                      background: "transparent",
                      border: "none",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 animate-fadeIn">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <SearchOutlined className="text-xl opacity-50" />
                    </div>
                    <span className="text-sm font-medium">
                      Không tìm thấy chương nào
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none z-10" />
            </div>
          )}
        />
      </div>

      <ChapterModal
        open={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        onFinish={handleSaveChapter}
        initialValues={editingChapter}
        existingChapters={content}
      />

      <LessonModal
        open={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onFinish={handleSaveLesson}
        chapterId={selectedChapterId}
        initialValues={editingLesson}
        submitting={isSubmitting}
      />

      <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

          .teacher-curriculum-tabs { height: 100%; }
          .teacher-curriculum-tabs .ant-tabs-nav { margin: 0 !important; width: 100% !important; }
          
          .teacher-curriculum-tabs .ant-tabs-content-holder { 
              border-left: none !important; 
              height: 100% !important;
              overflow: hidden; 
          }
          .teacher-curriculum-tabs .ant-tabs-content { height: 100% !important; }
          .teacher-curriculum-tabs .ant-tabs-tabpane { height: 100% !important; padding: 0 !important; }

          .teacher-curriculum-tabs .ant-tabs-ink-bar { display: none !important; }

          .teacher-curriculum-tabs .ant-tabs-tab {
            padding: 12px 14px !important;
            margin: 0 !important;
            border-radius: 10px !important;
            border: 1px solid transparent !important;
            background: transparent;
            transition: all 0.2s ease-in-out !important;
            justify-content: flex-start !important;
            width: 100%;
          }
          .teacher-curriculum-tabs .ant-tabs-tab:hover {
            background-color: #fff !important;
            color: #3b82f6 !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            transform: translateY(-1px);
          }
          .teacher-curriculum-tabs .ant-tabs-tab-active {
            background-color: #fff !important;
            border: 1px solid #bfdbfe !important;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06) !important;
          }
          .teacher-curriculum-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #2563eb !important;
            font-weight: 600 !important;
          }

          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        `}</style>
    </>
  );
});

export default CourseContent;
