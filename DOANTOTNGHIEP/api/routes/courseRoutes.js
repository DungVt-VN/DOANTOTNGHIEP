import express from "express";
import { authorize } from "../middlewares/authorize.js";
import multer from "multer";

// --- CONFIG MULTER ---
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// --- IMPORT CONTROLLERS ---
import {
  getAllCourses,
  getCourses,
  getCourseById,
  addCourse,
  deleteCourse,
  updateCourse,
  getClassesByCourse,
  getAvailableCourses,
  getStudentSchedule,
  getTeacherCourses,
  getClassesByCourseId,
  importFullCourse,
} from "../controllers/Course/courseController.js";

import {
  getCourseChapterById,
  createCourseChapter,
  updateCourseChapter,
  deleteCourseChapter,
  getAllCourseChaptersMaster,
} from "../controllers/Course/courseChapterController.js";

const router = express.Router();

// ============================================================
// PHẦN 1: COURSE ROUTES - STATIC (Không có tham số :id)
// Phải đặt đầu tiên để tránh bị nhầm lẫn
// ============================================================
router.get("/courses-available", authorize, getAvailableCourses);
router.get("/student-schedule", authorize, getStudentSchedule);
router.get("/all", authorize, getAllCourses);
router.get("/", authorize, getCourses);
router.post("/", authorize, addCourse);
router.get("/classes-by-course/:courseId", authorize, getClassesByCourseId);
router.post("/import", importFullCourse);

// Route Teacher có prefix cụ thể nên an toàn
router.get("/teacher/:teacherId", getTeacherCourses);

// PHẦN 2: CHAPTER ROUTES (Xử lý Nội dung khóa học)
// 1. Tạo và Cập nhật (Dùng Body, không dùng ID trên URL)
router.post("/course-chapter", createCourseChapter);
router.put("/course-chapter", updateCourseChapter); // Fix lỗi 500/404 cũ tại đây

// 2. Lấy danh sách chương theo CourseId
router.get("/course-chapter/:courseId", getAllCourseChaptersMaster);

// 3. Các thao tác cụ thể trên từng Chapter (Chi tiết / Xóa)
router.get("/course-chapter/chapter/:courseChapterId", getCourseChapterById);
router.delete("/course-chapter/:courseChapterId", deleteCourseChapter);

// ============================================================
// PHẦN 3: COURSE ROUTES - DYNAMIC (Có tham số :id)
// Lấy danh sách lớp của một khóa học
router.get("/:courseId/classes", authorize, getClassesByCourse);

// CRUD Khóa học theo ID
router.get("/:id", authorize, getCourseById);
router.put("/:id", authorize, updateCourse);
router.delete("/:id", authorize, deleteCourse);

export default router;
