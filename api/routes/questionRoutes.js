import express from "express";
import {
  getQuestionsByChapter,
  getQuestionsByCourse, // Hàm mới: Lấy tất cả câu hỏi của Course
  createQuestion,
  updateQuestion,
  deleteQuestions,
  importQuestions,
  importQuestionsFromFile,
  getQuestionsByQuiz,
  getFullQuestionsByCourseGrouped, // Hàm mới: Import từ file Excel
} from "../controllers/Question/questionController.js";

import {
  addQuiz,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResult,
} from "../controllers/Course/quizController.js";

import { authorize } from "../middlewares/authorize.js";
import multer from "multer"; // Dùng để xử lý file upload

// Cấu hình tạm cho multer (lưu vào bộ nhớ đệm trước khi xử lý)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// =====================================================================
// NHÓM 1: NGÂN HÀNG CÂU HỎI (QUESTION BANK)
// =====================================================================

// Lấy danh sách câu hỏi
router.get("/by-chapter/:chapterId", authorize, getQuestionsByChapter);
router.get("/by-course/:courseId", authorize, getQuestionsByCourse); // Route mới
router.get(
  "/course/:courseId/full-grouped",
  authorize,
  getFullQuestionsByCourseGrouped
);
router.get("/quiz/:quizId/questions", authorize, getQuestionsByQuiz);
// Thêm, sửa, xóa
router.post("/", authorize, createQuestion);
router.put("/:id", authorize, updateQuestion);
router.delete("/", authorize, deleteQuestions);

// Import dữ liệu
router.post("/import", authorize, importQuestions);
router.post(
  "/import-file",
  authorize,
  upload.single("file"),
  importQuestionsFromFile
); // Route mới cho Excel

// =====================================================================
// NHÓM 2: ĐỀ THI & KIỂM TRA (QUIZ/EXAM)
// =====================================================================

// Quản lý đề thi
router.post("/exam", authorize, addQuiz);
router.get("/exams/course/:courseId", authorize, getQuizzes);
router.get("/exam/:examId", authorize, getQuizById);

// Làm bài và xem kết quả
router.post("/exam/:examId/submit", authorize, submitQuiz);
router.get("/exam/:examId/result", authorize, getQuizResult);

export default router;
