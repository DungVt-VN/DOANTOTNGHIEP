import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  BookOpen,
  Download,
  FilePlus,
  ChevronDown,
  Copy,
  FolderInput,
} from "lucide-react";
import { Modal, message, Dropdown, Button, Spin, Popconfirm } from "antd";
import api from "@/utils/axiosInstance";

// Giả định các Component con vẫn giữ nguyên hoặc bạn tự điều chỉnh props
import ChapterModal from "./CuriculumModal/ChapterModal";
import LessonModal from "./CuriculumModal/LessonModal";
import ImportChapterModal from "./CuriculumModal/ImportChapterModal";
import ChapterItem from "./CuriculumModal/ChapterItem";
import RefreshButton from "@/components/RefreshButton";

const CurriculumTab = ({ classId, courseId }) => {
  // --- STATE ---
  const [chapters, setChapters] = useState([]);
  const [masterChapters, setMasterChapters] = useState([]);
  const [masterLessons, setMasterLessons] = useState([]);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modal States
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isImportChapterModalOpen, setIsImportChapterModalOpen] =
    useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  // Selection & Editing States
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonMode, setLessonMode] = useState("create");
  const [editingChapter, setEditingChapter] = useState(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const classRes = await api.get(`/chapters/chapters/class/${classId}`);
      setChapters(classRes.data.chapters || []);

      if (courseId) {
        const masterRes = await api.get(`/courses/course-chapter/${courseId}`);
        const masterData = masterRes.data.chapters || masterRes.data || [];
        console.log(masterData);
        setMasterChapters(masterData);
        const allMasterLessons = masterData.flatMap((ch) => ch.Lessons || []);
        setMasterLessons(allMasterLessons);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Không thể tải nội dung lớp học.");
    } finally {
      setLoading(false);
    }
  }, [classId, courseId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImportFullCourse = async () => {
    setImporting(true);
    try {
      const res = await api.post("/courses/import", {
        classId,
        courseId,
      });
      message.success(res.data.message);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Lỗi đồng bộ");
    } finally {
      setImporting(false);
    }
  };

  const openCreateChapterModal = () => {
    setEditingChapter(null);
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  // 3. Lưu chương (Tạo mới hoặc Cập nhật)
  const handleSaveChapter = async (values) => {
    console.log(values);
    try {
      if (editingChapter) {
        // --- UPDATE ---
        await api.put(`/chapters/chapters/${editingChapter.CourseChapterId}`, {
          ...values,
          Title: values.Title,
          Description: values.Description,
        });
        message.success(`Đã cập nhật chương: ${values.Title}`);
      } else {
        // --- CREATE ---
        // Route: POST /api/curriculum/chapters
        await api.post("/chapters/chapters", {
          ClassId: classId,
          Title: values.Title,
          Description: values.Description,
          OrderIndex: chapters.length + 1, // Tự tính OrderIndex cơ bản
        });
        message.success(`Đã tạo chương: ${values.Title}`);
      }

      setIsChapterModalOpen(false);
      setEditingChapter(null);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu chương.");
    }
  };

  // 4. Import chương từ Master
  const handleImportChapters = async (selectedMasterChapterIds) => {
    try {
      await api.post("/chapters/import", {
        classId,
        masterChapterIds: selectedMasterChapterIds,
      });
      message.success("Đã nhập chương thành công!");
      setIsImportChapterModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi nhập chương.");
    }
  };

  // 5. Xóa chương
  const handleDeleteChapter = (chapterId) => {
    Modal.confirm({
      title: "Xóa chương này?",
      content: "Hành động này sẽ xóa tất cả bài học bên trong.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/chapters/chapters/${chapterId}`);
          message.success("Đã xóa chương");
          fetchData();
        } catch (error) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  // =========================================================
  // XỬ LÝ LESSON (BÀI HỌC)
  // =========================================================

  const openLessonModal = (chapterId, mode = "create") => {
    const targetChapterId =
      chapterId || (chapters.length > 0 ? chapters[0].ChapterId : null);

    if (!targetChapterId) {
      message.warning("Vui lòng tạo chương trước.");
      return;
    }

    setEditingLesson(null);
    setSelectedChapterId(targetChapterId);
    setLessonMode(mode);
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setSelectedChapterId(lesson.ChapterId);
    setLessonMode("edit");
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (values) => {
    try {
      if (lessonMode === "import") {
        // Route: POST /api/chapters/lessons/import
        await api.post("/chapters/lessons/import", {
          classId,
          chapterId: selectedChapterId,
          masterLessonIds: values.lessonIds,
        });
        message.success("Đã nhập bài học!");
      } else if (lessonMode === "edit") {
        // Route: PUT /api/chapters/lessons (Có upload file nếu cần)
        // Lưu ý: Nếu dùng FormData (upload file) thì axios call sẽ khác một chút
        // Ở đây giả định dùng JSON hoặc component LessonModal đã xử lý FormData
        await api.put(`/chapters/lessons`, {
          ...values,
          LessonId: editingLesson.LessonId,
          ClassId: classId,
          ChapterId: selectedChapterId,
        });
        message.success("Đã cập nhật bài học!");
      } else {
        // Route: POST /api/chapters/lessons
        await api.post("/chapters/lessons", {
          ...values,
          ClassId: classId,
          ChapterId: selectedChapterId,
        });
        message.success("Đã tạo bài học mới!");
      }

      setIsLessonModalOpen(false);
      setEditingLesson(null);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu bài học");
    }
  };

  const handleDeleteLesson = (lessonId) => {
    Modal.confirm({
      title: "Xóa bài học?",
      content: "Bạn có chắc chắn muốn xóa bài học này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          // Route: DELETE /api/chapters/lessons/:lessonId
          await api.delete(`/chapters/lessons/${lessonId}`);
          message.success("Đã xóa bài học");
          fetchData();
        } catch (error) {
          message.error("Lỗi khi xóa bài học");
        }
      },
    });
  };

  const addChapterMenu = {
    items: [
      {
        key: "1",
        label: "Tạo thủ công",
        icon: <FilePlus size={16} />,
        onClick: openCreateChapterModal,
      },
      {
        key: "2",
        label: "Nhập từ Kho học liệu",
        icon: <FolderInput size={16} />,
        onClick: () => setIsImportChapterModalOpen(true),
      },
    ],
  };

  if (loading && chapters.length === 0)
    return (
      <div className="flex justify-center p-10">
        <Spin size="large" />
      </div>
    );

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Nội dung đào tạo</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý chương trình học của lớp.
          </p>
        </div>

        <div className="flex gap-3">
          <Popconfirm
            title="Đồng bộ lộ trình mẫu?"
            description="Sao chép toàn bộ nội dung từ kho mẫu vào lớp này."
            onConfirm={handleImportFullCourse}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              loading={importing}
              className="flex items-center gap-2 h-10 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition-all shadow-sm"
            >
              <Copy size={18} /> Đồng bộ lộ trình mẫu
            </Button>
          </Popconfirm>
          <Dropdown menu={addChapterMenu} trigger={["click"]}>
            <Button
              type="primary"
              className="flex items-center gap-2 h-10 px-4 bg-blue-600 rounded-lg font-semibold shadow-md"
            >
              <Plus size={18} /> Thêm chương{" "}
              <ChevronDown size={14} className="text-blue-200" />
            </Button>
          </Dropdown>
          <RefreshButton
            tooltip="Tải lại"
            onClick={fetchData}
            loading={loading}
          />
        </div>
      </div>

      {/* CONTENT LIST */}
      <div className="space-y-5">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <ChapterItem
              key={chapter.ChapterId || index}
              chapter={chapter}
              index={index}
              // Actions
              onAddLesson={(chapId, mode) => openLessonModal(chapId, mode)}
              onEditChapter={() => handleEditChapter(chapter)}
              onDeleteChapter={() =>
                handleDeleteChapter(chapter.CourseChapterId)
              }
              onEditLesson={handleEditLesson}
              onDeleteLesson={(lesson) => handleDeleteLesson(lesson.LessonId)}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <BookOpen size={32} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-slate-600 font-medium text-lg">
              Chưa có nội dung
            </h3>
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={openCreateChapterModal}>Tạo chương mới</Button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Modal Tạo/Sửa Chương */}
      <ChapterModal
        open={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapter(null);
        }}
        onFinish={handleSaveChapter}
        initialValues={editingChapter}
      />

      {/* Modal Import Chương từ Kho */}
      <ImportChapterModal
        open={isImportChapterModalOpen}
        onClose={() => setIsImportChapterModalOpen(false)}
        onFinish={handleImportChapters}
        masterChapters={masterChapters}
      />

      {/* Modal Tạo/Sửa/Import Bài học */}
      <LessonModal
        open={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setEditingLesson(null);
        }}
        onFinish={handleSaveLesson}
        chapterId={selectedChapterId}
        mode={lessonMode}
        masterLessons={masterLessons}
        initialValues={editingLesson}
      />
    </div>
  );
};

export default CurriculumTab;
