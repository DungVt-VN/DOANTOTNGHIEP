import express from "express";
import multer from "multer";
import {
  getAssignmentsByClass,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  // --- IMPORT MỚI ---
  createQuizAssignment,
} from "../controllers/Course/assignmentController.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Cấu hình Multer lưu tạm
const upload = multer({ dest: "uploads/" });

// ==================== COMMON ROUTES ====================
// Lấy danh sách bài tập của lớp
router.get("/class/:classId", authorize, getAssignmentsByClass);

// ==================== TEACHER ROUTES ====================

// --- 1. Quản lý Bài tập thường (Homework/Essay) ---
router.post("/", authorize, addAssignment);
router.put("/:assignmentId", authorize, updateAssignment);
router.delete("/:assignmentId", authorize, deleteAssignment);

// --- 2. Quản lý Bài kiểm tra (Quiz - MS Teams Style) ---
// Lấy danh sách câu hỏi từ ngân hàng (có filter: courseId, difficulty, search)
// URL: /api/assignments/questions?courseId=1&difficulty=Medium

// Tạo bài tập dạng Quiz (Chọn câu hỏi từ ngân hàng)
router.post("/quiz", authorize, createQuizAssignment);

// ==================== STUDENT ROUTES ====================
// Học sinh nộp bài (Upload file)
router.post("/submit", authorize, upload.single("file"), submitAssignment);

export default router;
