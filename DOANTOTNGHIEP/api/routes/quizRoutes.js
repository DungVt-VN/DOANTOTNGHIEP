import express from "express";
import {
  addQuiz,
  getQuizById,
  getQuizResult,
  getQuizzes,
  submitQuiz,
  distributeQuizToClass,
  deleteQuiz,
  updateQuiz,
  updateQuizQuestions,
  updateQuizDistribute, // Import hàm phân phối mới
} from "../controllers/Course/quizController.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// --- NHÓM ROUTE QUẢN TRỊ (Giáo viên/Admin) ---

// 1. Tạo bài kiểm tra mới
// Có thể tạo Master (không gửi classId) hoặc tạo thẳng cho lớp (có classId)
router.post("/", authorize, addQuiz);
// 2. Lấy danh sách bài kiểm tra
// Dùng Query Params:
// - Lấy Master: /api/quizzes?courseId=1&type=master
// - Lấy theo lớp: /api/quizzes?classId=10
router.get("/", authorize, getQuizzes);

// 3. Phân phối đề thi Master xuống một lớp cụ thể
// Route này sẽ clone đề gốc và gán thời gian bắt đầu/kết thúc riêng cho lớp
router.post("/:masterQuizId/distribute", authorize, distributeQuizToClass);
router.put("/:masterQuizId/distribute", authorize, updateQuizDistribute);

// --- NHÓM ROUTE HỌC TẬP (Học sinh/Sinh viên) ---

// 4. Lấy chi tiết bài kiểm tra (Để hiển thị đề thi khi làm bài)
router.get("/:quizId", authorize, getQuizById);

// 5. Nộp bài làm bài kiểm tra
router.post("/submit", authorize, submitQuiz);

// 6. Xem kết quả và lời giải bài kiểm tra
router.get("/result/:quizId", authorize, getQuizResult);
router.post("/:quizId/questions", updateQuizQuestions);

router.delete("/:quizId", deleteQuiz);

// Route cập nhật
router.put("/:quizId", updateQuiz);

export default router;
