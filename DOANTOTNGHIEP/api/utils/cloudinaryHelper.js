// File: utils/cloudinaryHelper.js
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

// --- HELPER: CLEANUP TEMP FILE ---
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Lỗi xóa file tạm:", e);
    }
  }
};

// --- 1. UPLOAD VIDEO (Hỗ trợ file lớn > 100MB) ---
export const uploadVideoToCloudinary = async (file) => {
  if (!file) return null;
  const absolutePath = path.resolve(file.path);
  const fileSizeInBytes = file.size || fs.statSync(absolutePath).size;
  // File > 95MB thì dùng upload_large (chừa buffer an toàn)
  const isLargeFile = fileSizeInBytes > 95 * 1024 * 1024;
  const filename = path.parse(file.originalname).name;

  console.log(
    `--- UPLOAD VIDEO START: ${file.originalname} (${(
      fileSizeInBytes /
      1024 /
      1024
    ).toFixed(2)} MB) ---`
  );

  return new Promise((resolve, reject) => {
    const handleResult = (error, result) => {
      cleanupFile(absolutePath);
      if (error) {
        console.error("Cloudinary Upload Error:", error);
        return reject(error);
      }
      resolve(result.secure_url);
    };

    const options = {
      folder: "CourseVideo",
      resource_type: "video",
      public_id: filename,
      use_filename: true,
      unique_filename: false,
    };

    if (isLargeFile) {
      cloudinary.v2.uploader.upload_large(
        absolutePath,
        { ...options, chunk_size: 6000000, timeout: 600000 },
        handleResult
      );
    } else {
      cloudinary.v2.uploader.upload(
        absolutePath,
        { ...options, timeout: 120000 },
        handleResult
      );
    }
  });
};

// --- 2. UPLOAD FILE TÀI LIỆU/ẢNH CHUNG (Tự động detect type) ---
export const uploadFileToCloudinary = async (
  file,
  folder = "CourseMaterials"
) => {
  if (!file) return null;

  const absolutePath = path.resolve(file.path);
  const filename = path.parse(file.originalname).name;

  console.log(`--- UPLOAD FILE START: ${file.originalname} ---`);

  return new Promise((resolve, reject) => {
    // Cloudinary auto-detects: image, video, raw (pdf, docx...)
    // Tuy nhiên với PDF/DOCX nên ép kiểu 'auto' hoặc 'raw'
    cloudinary.v2.uploader.upload(
      absolutePath,
      {
        folder: folder,
        resource_type: "auto", // Để auto để Cloudinary tự quyết định (tốt cho ảnh + pdf)
        public_id: filename,
        use_filename: true,
        unique_filename: true, // Tránh trùng tên ghi đè
      },
      (error, result) => {
        cleanupFile(absolutePath);
        if (error) {
          console.error("Cloudinary File Upload Error:", error);
          return reject(error);
        }

        // Trả về cả URL và format để lưu DB nếu cần
        resolve(result.secure_url);
      }
    );
  });
};

// --- 3. XÓA FILE TRÊN CLOUDINARY (Chung cho Video, Image, Raw) ---
export const deleteCloudinaryFile = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes("cloudinary.com")) return;

  try {
    // 1. Tách URL để lấy Public ID
    // URL mẫu: https://res.cloudinary.com/demo/video/upload/v1615/CourseVideo/my-video.mp4

    const urlParts = fileUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");
    if (uploadIndex === -1) return;

    // Lấy phần sau 'upload/' (bỏ qua version v1234 nếu có)
    let publicIdParts = urlParts.slice(uploadIndex + 1);
    if (publicIdParts[0].startsWith("v")) {
      publicIdParts.shift(); // Bỏ version
    }

    // Ghép lại thành public_id thô (vd: CourseVideo/my-video.mp4)
    let publicId = publicIdParts.join("/");

    // 2. Xác định Resource Type và xử lý Extension
    let resourceType = "image"; // Mặc định

    if (fileUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      resourceType = "video";
      // Video: Xóa extension
      publicId = publicId.replace(/\.[^/.]+$/, "");
    } else if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      resourceType = "image";
      // Image: Xóa extension
      publicId = publicId.replace(/\.[^/.]+$/, "");
    } else {
      // Raw file (PDF, DOCX, ZIP...): GIỮ NGUYÊN EXTENSION (Cloudinary yêu cầu)
      resourceType = "raw";
      // publicId giữ nguyên: CourseMaterials/document.pdf
    }

    // Decode URL (phòng trường hợp tên file có dấu cách %20)
    publicId = decodeURIComponent(publicId);

    console.log(`--- DELETE CLOUDINARY: ${publicId} [${resourceType}] ---`);

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("Delete Result:", result);
  } catch (err) {
    console.error("Lỗi xóa file Cloudinary:", err);
  }
};

// (Giữ lại hàm này để tương thích ngược nếu code cũ đang gọi, nhưng trỏ về hàm chung)
export const deleteCloudinaryVideo = async (url) => {
  return await deleteCloudinaryFile(url);
};
