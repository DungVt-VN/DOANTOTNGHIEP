import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/Notification/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);
router.delete("/clear-all", clearAllNotifications);

export default router;
