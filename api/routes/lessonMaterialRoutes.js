import express from "express";
import multer from "multer";
import {
  uploadMultipleMaterials,
  deleteMaterial,
} from "../controllers/LessonMaterial/lessonMaterialsController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post(
  "/upload-multiple",
  upload.array("files", 10),
  uploadMultipleMaterials
);

router.delete("/:id", deleteMaterial);

export default router;
