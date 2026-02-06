import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/usersRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import tuitionRoutes from "./routes/tuitionRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import lessonMaterialRoutes from "./routes/lessonMaterialRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cookieParser from "cookie-parser";
import notificationRoutes from "./routes/notificationRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import multer from "multer";
import uploadRoutes from "./routes/uploadRoutes.js";
import { db } from "./db.js";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import startQuizScheduler from "./utils/cronJob.js";

// Cấu hình đường dẫn cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();

const apiPORT = process.env.API_PORT || 8800;
const clientPort = process.env.CLIENT_PORT || 3000;

app.use(
  cors({
    origin: `http://localhost:${clientPort}`,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
startQuizScheduler();
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../client/public/upload");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// cloudinary.v2.api
//   .ping()
//   .then((result) => {
//     console.log("✅ Cloudinary connected:", result);
//   })
//   .catch((err) => {
//     console.error("❌ Cloudinary connection failed:", err);
//   });

app.use("/api/auth", authRoutes);
app.use("/api/accounts", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/users", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tuition", tuitionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/lesson-materials", lessonMaterialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.listen(apiPORT, () => {
  console.log(`Backend server is running on port ${apiPORT}!`);
  db.query("SELECT 1", (err, data) => {
    if (err) {
      console.error("❌ LỖI: Không thể kết nối đến Database!");
      console.error("Chi tiết lỗi:", err.message);
    } else {
      console.log("✅ KẾT NỐI THÀNH CÔNG: Đã kết nối đến Database MySQL!");
    }
  });
});
