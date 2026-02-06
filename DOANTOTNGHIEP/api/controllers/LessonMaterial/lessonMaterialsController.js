import { db } from "../../db.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";
import path from "path";

// --- HELPER: QUERY DB ---
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// --- HELPER: LẤY PUBLIC ID TỪ URL CLOUDINARY ---
// Mục đích: Để xóa file trên Cloudinary
const getPublicIdFromUrl = (url) => {
  try {
    const splitUrl = url.split("/");
    const lastPart = splitUrl.pop(); // Lấy phần cuối (vidu: file.pdf)
    const publicId = lastPart.split(".")[0]; // Bỏ đuôi .pdf
    // Nếu file nằm trong folder, ghép lại (vidu: LessonMaterials/file)
    const folder = splitUrl.pop();
    return `${folder}/${publicId}`;
  } catch (error) {
    return null;
  }
};

// --- HELPER: UPLOAD FILE LÊN CLOUDINARY ---
const uploadFileToCloudinary = async (file) => {
  const absolutePath = path.resolve(file.path);
  // Loại bỏ ký tự đặc biệt trong tên file để tránh lỗi URL
  const filename = path
    .parse(file.originalname)
    .name.replace(/[^a-zA-Z0-9]/g, "_");

  const ext = path.extname(file.originalname).toLowerCase();
  const isRaw = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".txt",
  ].includes(ext);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    };

    cloudinary.v2.uploader.upload(
      absolutePath,
      {
        folder: "LessonMaterials", // Đổi tên folder trên Cloud cho khớp
        resource_type: isRaw ? "raw" : "auto",
        public_id: filename,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        cleanup();
        if (error) {
          console.error("Cloudinary Error:", error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          format: result.format || ext.replace(".", ""),
          originalName: file.originalname,
        });
      }
    );
  });
};

// ==================== CONTROLLERS ===========================

// --- API: UPLOAD NHIỀU TÀI LIỆU CÙNG LÚC ---
// Route: POST /api/lesson-materials/upload-multiple
export const uploadMultipleMaterials = async (req, res) => {
  const files = req.files;
  const { LessonId } = req.body;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "Chưa chọn file nào." });
  }

  if (!LessonId) {
    files.forEach((f) => fs.unlinkSync(f.path));
    return res.status(400).json({ error: "Thiếu LessonId." });
  }

  try {
    const uploadedDocs = [];

    for (const file of files) {
      try {
        const result = await uploadFileToCloudinary(file);

        // --- CẬP NHẬT TÊN BẢNG VÀ CỘT ---
        const qInsert = `
            INSERT INTO LessonMaterials (Title, FileUrl, FileType, LessonId) 
            VALUES (?, ?, ?, ?)
        `;

        const dbResult = await query(qInsert, [
          result.originalName,
          result.url,
          result.format,
          LessonId,
        ]);

        uploadedDocs.push({
          LessonMaterialId: dbResult.insertId,
          Title: result.originalName,
          FileUrl: result.url,
          FileType: result.format,
        });
      } catch (uploadErr) {
        console.error(`Lỗi upload file ${file.originalname}:`, uploadErr);
      }
    }

    return res.status(201).json({
      message: `Đã upload thành công ${uploadedDocs.length}/${files.length} file.`,
      data: uploadedDocs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server khi upload tài liệu." });
  }
};

// --- API: XÓA TÀI LIỆU ---
// Route: DELETE /api/lesson-materials/:id
export const deleteMaterial = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Lấy URL để xóa trên Cloudinary
    const docs = await query(
      "SELECT FileUrl, FileType FROM LessonMaterials WHERE MaterialId = ?",
      [id]
    );

    if (docs.length === 0)
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });

    const { FileUrl, FileType } = docs[0];

    // 2. Xóa trên Cloudinary
    const publicId = getPublicIdFromUrl(FileUrl);
    if (publicId) {
      // Xác định resource_type để xóa đúng
      const isRaw = ["pdf", "doc", "docx", "zip", "rar"].includes(FileType);
      const resourceType = isRaw ? "raw" : "image"; // Video thì cần logic check thêm, tạm thời để image/raw

      // Gọi hàm xóa của Cloudinary (dạng Promise)
      await cloudinary.v2.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    }

    // 3. Xóa trong DB
    await query("DELETE FROM LessonMaterials WHERE MaterialId = ?", [id]);

    return res.json({ message: "Đã xóa tài liệu thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server" });
  }
};
