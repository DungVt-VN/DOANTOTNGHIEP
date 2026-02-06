import express from "express";
import multer from "multer";
import {
  addClassCourse,
  getClassCourse,
  getClassStudent,
  addClassStudent,
  getClassStudentByClassCode,
  deleteClass,
  getActiveRooms,
  updateClass,
  checkScheduleAvailability,
  addSingleStudentToClass,
  getRecruitingClasses,
  getClassStudentsDetail,
  updateTuitionStatus,
  removeStudentFromClass,
  getAllClasses,
  getAllEnrollments,
  getRooms,
  getAllClassesByMonth,
  getTeacherScheduleByWeek,
  getClassDetail,
  getStudentClasses,
  registerClass,
  getAvailableClasses,
  getClassesForDistribution,
} from "../controllers/Class/classController.js";
import { authorize } from "../middlewares/authorize.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.get("/all-classes-by-month", authorize, getAllClassesByMonth);
router.get("/teacher-schedule-by-week", authorize, getTeacherScheduleByWeek);
router.get("/detail/:classId", getClassDetail);
router.get("/course", getClassesForDistribution);

router.get(
  "/student/classes/:studentId",
  authorize,
  authorizeRole("Student"),
  getStudentClasses
);

router.get(
  "/available-classes",
  authorize,
  authorizeRole("Student"),
  getAvailableClasses
);
router.post(
  "/register-class",
  authorize,
  authorizeRole("Student"),
  registerClass
);

router.get("/rooms/active", authorize, getActiveRooms);
router.get("/all-rooms", getRooms);
router.get("/recruiting", authorize, getRecruitingClasses);
router.get("/all-classes", authorize, getAllClasses);
router.post("/check-schedule", authorize, checkScheduleAvailability);
router.get("/:courseId", getClassCourse);
router.get("/:courseId/class/:classCode", getClassStudentByClassCode);
router.get("/:courseId/classes/:classId", getClassStudent);
router.get(
  "/enrollments/all",
  authorize,
  authorizeRole("Admin"),
  getAllEnrollments
);

router.post("/:courseId", authorize, authorizeRole("Admin"), addClassCourse);

router.put("/:id", authorize, authorizeRole("Admin"), updateClass);

router.delete("/:classId", authorize, authorizeRole("Admin"), deleteClass);

router.get("/:classId/students/detail", authorize, getClassStudentsDetail);
router.post(
  "/:classId/add-single-student",
  authorize,
  authorizeRole("Admin"),
  addSingleStudentToClass
);

router.post(
  "/:classId/importExcel",
  upload.single("file"),
  authorize,
  authorizeRole("Admin"),
  addClassStudent
);
router.put(
  "/:classId/students/:studentId/tuition",
  authorize,
  authorizeRole("Admin"),
  updateTuitionStatus
);
router.delete(
  "/:classId/students/:studentId",
  authorize,
  authorizeRole("Admin"),
  removeStudentFromClass
);

export default router;
