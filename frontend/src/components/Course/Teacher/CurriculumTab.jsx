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

import ChapterModal from "./CuriculumModal/ChapterModal";
import LessonModal from "./CuriculumModal/LessonModal";
import ImportChapterModal from "./CuriculumModal/ImportChapterModal";
import ChapterItem from "./CuriculumModal/ChapterItem";
import RefreshButton from "@/components/RefreshButton";

const CurriculumTab = ({ classId, courseId }) => {
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

  // --- STATE MỚI: QUẢN LÝ SỬA CHƯƠNG ---
  const [editingChapter, setEditingChapter] = useState(null);

  const fetchData = useCallback(async () => {
    if (!courseId || !classId) return;

    setLoading(true);
    try {
      const [classRes, masterRes] = await Promise.all([
        api.get(`/chapters/chapters/class/${classId}`),
        api.get(`/courses/course-chapter/${courseId}`),
      ]);

      const classData = classRes.data.chapters || classRes.data || [];
      setChapters(classData);

      const masterData = masterRes.data.chapters || masterRes.data || [];
      setMasterChapters(masterData);

      const allMasterLessons = masterData.flatMap((ch) => ch.Lessons || []);
      setMasterLessons(allMasterLessons);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLER: IMPORT FULL COURSE ---
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

  // --- HANDLER: CHAPTERS (TẠO & SỬA) ---

  // 1. Mở modal để tạo mới
  const openCreateChapterModal = () => {
    setEditingChapter(null); // Reset form
    setIsChapterModalOpen(true);
  };

  // 2. Mở modal để sửa (Gọi từ ChapterItem)
  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter); // Đưa dữ liệu cũ vào form
    setIsChapterModalOpen(true);
  };

  // 3. Lưu chương (Xử lý cả Tạo và Sửa)
  const handleSaveChapter = async (values) => {
    try {
      if (editingChapter) {
        // --- LOGIC CẬP NHẬT ---
        await api.put(
          `/curriculum/chapters/${editingChapter.CourseChapterId}`,
          {
            ...values,
            ClassId: classId,
            CourseChapterId: editingChapter.CourseChapterId,
          }
        );
        message.success(`Đã cập nhật chương: ${values.Title}`);
      } else {
        // --- LOGIC TẠO MỚI ---
        await api.post("/curriculum/chapters", {
          ClassId: classId,
          Title: values.Title,
          Description: values.Description,
          OrderIndex: chapters.length + 1,
        });
        message.success(`Đã tạo chương: ${values.Title}`);
      }

      setIsChapterModalOpen(false);
      setEditingChapter(null); // Reset sau khi lưu
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu chương.");
    }
  };

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
      message.error("Lỗi khi nhập chương.");
    }
  };

  const handleDeleteChapter = (chapterId) => {
    Modal.confirm({
      title: "Xóa chương này?",
      content: "Hành động này sẽ xóa tất cả bài học bên trong.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/curriculum/chapters/${chapterId}`);
          message.success("Đã xóa chương");
          fetchData();
        } catch (error) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  // --- HANDLER: LESSONS ---
  const openLessonModal = (chapterId, mode = "create") => {
    const targetChapterId =
      chapterId || (chapters.length > 0 ? chapters[0].CourseChapterId : null);

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
    setSelectedChapterId(lesson.CourseChapterId);
    setLessonMode("edit");
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (values) => {
    try {
      if (lessonMode === "import") {
        await api.post("/curriculum/lessons/import", {
          classId,
          chapterId: selectedChapterId,
          masterLessonIds: values.lessonIds,
        });
        message.success("Đã nhập bài học!");
      } else if (lessonMode === "edit") {
        await api.put(`/curriculum/lessons/${editingLesson.LessonId}`, {
          ...values,
          ClassId: classId,
          ChapterId: selectedChapterId,
          LessonId: editingLesson.LessonId,
        });
        message.success("Đã cập nhật bài học!");
      } else {
        const payload = {
          ...values,
          ClassId: classId,
          ChapterId: selectedChapterId,
        };
        await api.post("/curriculum/lessons", payload);
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
          await api.delete(`/curriculum/lessons/${lessonId}`);
          message.success("Đã xóa bài học");
          fetchData();
        } catch (error) {
          message.error("Lỗi khi xóa bài học");
        }
      },
    });
  };

  const addLessonMenu = {
    items: [
      {
        key: "1",
        label: "Tạo bài học mới",
        icon: <FilePlus size={16} />,
        onClick: () => openLessonModal(null, "create"),
      },
      {
        key: "2",
        label: "Chọn từ Kho học liệu",
        icon: <Download size={16} />,
        onClick: () => openLessonModal(null, "import"),
      },
    ],
  };

  const addChapterMenu = {
    items: [
      {
        key: "1",
        label: "Tạo thủ công",
        icon: <FilePlus size={16} />,
        onClick: openCreateChapterModal, // Sử dụng hàm mới reset form
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

          <Dropdown menu={addLessonMenu} trigger={["click"]}>
            <Button className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:text-blue-600 shadow-sm">
              <Plus size={18} /> Thêm bài học{" "}
              <ChevronDown size={14} className="text-slate-400" />
            </Button>
          </Dropdown>

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

      <div className="space-y-5">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <ChapterItem
              key={chapter.CourseChapterId || index}
              chapter={chapter}
              index={index}
              onAddLesson={(chapId, mode) => openLessonModal(chapId, mode)}
              // --- TRUYỀN HÀM XỬ LÝ CHƯƠNG ---
              onDeleteChapter={() =>
                handleDeleteChapter(chapter.CourseChapterId)
              }
              onEditChapter={() => handleEditChapter(chapter)}
              // --- TRUYỀN HÀM XỬ LÝ BÀI HỌC ---
              onDeleteLesson={(lesson) => handleDeleteLesson(lesson.LessonId)}
              onEditLesson={handleEditLesson}
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
              <Button
                type="primary"
                onClick={handleImportFullCourse}
                icon={<Copy size={16} />}
              >
                Sử dụng lộ trình mẫu
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CHAPTER MODAL */}
      <ChapterModal
        open={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapter(null); // Reset khi đóng
        }}
        onFinish={handleSaveChapter}
        initialValues={editingChapter} // Truyền dữ liệu sửa vào
      />

      <ImportChapterModal
        open={isImportChapterModalOpen}
        onClose={() => setIsImportChapterModalOpen(false)}
        onFinish={handleImportChapters}
        masterChapters={masterChapters}
      />

      {/* LESSON MODAL */}
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
