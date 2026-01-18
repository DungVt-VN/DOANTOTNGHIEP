import { db } from "../../db.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";
import { uploadVideoToCloudinary } from "../../utils/cloudinaryHelper.js";

// Cấu hình Cloudinary (nếu chưa cấu hình trong file config import vào)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper query DB
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// ==========================================
// 1. UPLOAD ẢNH KHÓA HỌC (Course Thumbnail)
// ==========================================
export const uploadCourseImage = async (req, res) => {
  const courseId = req.params.courseId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Chưa chọn file ảnh (Key phải là 'file')",
    });
  }

  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "CourseImage",
      resource_type: "auto",
    });

    const imageUrl = result.secure_url;

    const q = "UPDATE Courses SET `CourseImage` = ? WHERE `CourseId` = ?";
    await query(q, [imageUrl, courseId]);

    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      message: "Cập nhật ảnh khóa học thành công!",
      imageUrl,
    });
  } catch (err) {
    console.error("Lỗi uploadCourseImage:", err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ error: "Lỗi server khi upload ảnh" });
  }
};

// ==========================================
// 2. UPLOAD FILE TỔNG QUÁT (Tái sử dụng cho Lesson Docs, Exercises...)
// ==========================================
export const uploadFile = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Chưa chọn file để upload",
    });
  }

  try {
    // resource_type: "auto" -> Tự động nhận diện PDF, DOCX, ZIP, Image...
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "LMS_Materials", // Thư mục chung cho tài liệu
      resource_type: "auto",
      use_filename: true, // Cố gắng giữ tên file gốc
    });

    // Xóa file tạm
    fs.unlinkSync(file.path);

    // Trả về cấu trúc dữ liệu chuẩn cho Frontend Service
    return res.status(200).json({
      success: true,
      message: "Upload file thành công",
      data: {
        url: result.secure_url, // Link file dùng để lưu DB
        public_id: result.public_id,
        format: result.format,
        original_name: file.originalname,
      },
    });
  } catch (err) {
    console.error("Lỗi uploadFile:", err);
    // Xóa file tạm nếu lỗi xảy ra
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload file",
      error: err.message,
    });
  }
};

// ==========================================
// 3. UPLOAD ẢNH CHO CÂU HỎI (Quiz/Bank - Rich Text Editor)
// ==========================================
export const uploadQuestionImage = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res
      .status(400)
      .json({ success: false, message: "Chưa chọn file ảnh" });
  }

  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "BankQuestion",
      resource_type: "auto",
    });

    // Xóa file tạm
    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      message: "Upload ảnh thành công",
      imageUrl: result.secure_url,
    });
  } catch (err) {
    console.error("Lỗi uploadQuestionImage:", err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ error: "Lỗi server khi upload ảnh câu hỏi" });
  }
};

export const uploadVideo = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Chưa chọn video để upload",
    });
  }

  try {
    // Gọi helper upload video (đã có logic chunk upload cho file lớn)
    const videoUrl = await uploadVideoToCloudinary(file);

    // Trả về URL cho frontend
    return res.status(200).json({
      success: true,
      message: "Upload video thành công",
      data: {
        url: videoUrl,
        original_name: file.originalname,
      },
    });
  } catch (err) {
    console.error("Lỗi uploadVideo:", err);
    // Xóa file tạm nếu lỗi
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi upload video",
      error: err.message,
    });
  }
};
