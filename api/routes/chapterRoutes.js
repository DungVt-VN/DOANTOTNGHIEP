import express from "express";
import upload from "../middlewares/upload.js"; // Middleware upload Video

// 2. Controller Chapter
import {
  getClassContent,
  getAllChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  updateChapterOrder,
  importChapters, // <--- MỚI: Import Chapter
} from "../controllers/Course/chapterController.js";

// 3. Controller Lesson
import {
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonsByChapter,
  importLessonsToClass, // <--- MỚI: Import Lesson
} from "../controllers/Course/lessonController.js";

const router = express.Router();

// GET /api/curriculum/class/:classId/content (Lấy chi tiết nội dung lớp)
router.get("/class/:classId/content", getClassContent);

// =========================================================
// B. NHÓM CHAPTER (CHƯƠNG)
// =========================================================
// POST /api/curriculum/chapters/import (Import chương lẻ từ kho)
router.post("/import", importChapters);

// PUT /api/curriculum/chapters/reorder (Sắp xếp thứ tự)
router.put("/chapters/reorder", updateChapterOrder);

// GET /api/curriculum/chapters/class/:classId (Lấy ds chương của lớp)
router.get("/chapters/class/:classId", getAllChapters);

// CRUD Chapter
router.post("/chapters", createChapter); // Tạo mới
router.get("/chapters/:chapterId", getChapterById); 
router.put("/chapters/:chapterId", updateChapter); 
router.delete("/chapters/:chapterId", deleteChapter); // Xóa

// =========================================================
// C. NHÓM LESSON (BÀI HỌC)
// =========================================================
// POST /api/curriculum/lessons/import (Import bài học lẻ từ kho)
router.post("/lessons/import", importLessonsToClass);

// GET /api/curriculum/lessons/chapter/:chapterId
router.get("/lessons/chapter/:chapterId", getLessonsByChapter);

// CRUD Lesson (Có upload file)
router.post("/lessons", upload.single("file"), createLesson);
router.put("/lessons", upload.single("file"), updateLesson);
router.get("/lessons/:lessonId", getLessonById);
router.delete("/lessons/:lessonId", deleteLesson);

export default router;
