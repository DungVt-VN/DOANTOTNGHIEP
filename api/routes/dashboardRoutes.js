import express from "express";
import {
  getAdminStats,
  getDashboardChart,
  getStudentDashboardStats,
} from "../controllers/Dashboard/dashboardController.js"; // Import thêm
import { authorize } from "../middlewares/authorize.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";

const router = express.Router();

router.get("/stats", getAdminStats);
router.get("/chart", getDashboardChart); // Route mới
router.get(
  "/student/stats/:userId",
  authorize,
  authorizeRole("Student"),
  getStudentDashboardStats
);

export default router;
