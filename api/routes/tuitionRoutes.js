import express from "express";
import {
  // Các hàm cho Admin
  getAllPayments,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  getTuitionDebts,
  getTuitionSummary,
  getPaymentHistory,
} from "../controllers/Tuition/tuitionController.js";
import { authorize } from "../middlewares/authorize.js"; // Middleware cho Admin/Teacher

const router = express.Router();

// ============================================================
// 1. ROUTES DÀNH CHO ADMIN / KẾ TOÁN (Quản lý)
// ============================================================
// Lấy toàn bộ danh sách thanh toán của trung tâm
router.get("/all", authorize, getAllPayments);

// Tạo phiếu thu mới
router.post("/create", authorize, createPayment);

// Cập nhật thông tin phiếu thu (Admin sửa sai)
router.put("/:id", authorize, updatePayment);

// Cập nhật nhanh trạng thái (Completed/Pending/Failed)
router.put("/:id/status", authorize, updatePaymentStatus);

// Lấy bảng công nợ tổng hợp (Dashboard Admin)
router.get("/debts", authorize, getTuitionDebts);

// ============================================================
// 2. ROUTES DÀNH CHO HỌC SINH (Xem cá nhân)
// ============================================================
// Lấy tổng quan: Tổng đã đóng, Tổng nợ, Các lớp chưa đóng phí
router.get("/summary/:studentId", getTuitionSummary);

// Lấy lịch sử giao dịch chi tiết của học sinh đó
router.get("/history/:studentId", getPaymentHistory);

export default router;
