import express from "express";
import multer from "multer";
import {
  getInfo,
  getAccountStudents,
  getAccountTeachers,
  updateEmail,
  updateUserName,
  updateInfoStudent,
  deleteAccount,
  addStudentAccount,
  importStudentsFromExcel,
  updateInfoTeacher,
  importTeachersFromExcel,
  createTeacher,
  createStudent,
  getAvailableTeachers,
  getTeacherDetail,
  changePassword,
} from "../controllers/User/userController.js";
import { authorize } from "../middlewares/authorize.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", authorize, authorizeRole("Admin"), getInfo);
router.put("/update-email", authorize, updateEmail);
router.put("/update-username", authorize, updateUserName);
router.put("/change-password", authorize, changePassword);
router.delete("/delete/", authorize, deleteAccount);

router.get(
  "/manage-accounts/students",
  authorize,
  authorizeRole("Admin"),
  getAccountStudents
);

router.post("/", authorize, authorizeRole("Admin"), addStudentAccount); // Cân nhắc đổi path này rõ ràng hơn nếu có thể

router.post(
  "/create/student",
  authorize,
  authorizeRole("Admin"),
  createStudent
);

router.put("/update-info/student/:userId", authorize, updateInfoStudent);

router.post(
  "/import-excel",
  upload.single("file"),
  authorize,
  authorizeRole("Admin"),
  importStudentsFromExcel
);
router.get(
  "/manage-accounts/teachers",
  authorize,
  authorizeRole("Admin"),
  getAccountTeachers
);

router.post(
  "/create/teacher",
  authorize,
  authorizeRole("Admin"),
  createTeacher
);

router.put("/update-info/teacher/:userId", authorize, updateInfoTeacher);

router.post(
  "/import-excel-teachers",
  upload.single("file"),
  authorize,
  authorizeRole("Admin"),
  importTeachersFromExcel
);

router.post("/teachers/check-availability", authorize, getAvailableTeachers);

router.get(
  "/teacher/:id",
  authorize,
  authorizeRole("Teacher"),
  getTeacherDetail
);

export default router;
