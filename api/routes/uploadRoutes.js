import express from "express";
import upload from "../middlewares/upload.js";

import {
  uploadCourseImage,
  uploadQuestionImage,
  uploadFile,
  uploadVideo,
} from "../controllers/UploadFile/uploadController.js";

const router = express.Router();

router.post(
  "/course-image/:courseId",
  upload.single("file"),
  uploadCourseImage
);

router.post("/question-image", upload.single("file"), uploadQuestionImage);

router.post("/file", upload.single("file"), uploadFile);
router.post("/video", upload.single("file"), uploadVideo);

export default router;
