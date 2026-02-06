import { db } from "../../db.js";
import { deleteCloudinaryFile } from "../../utils/cloudinaryHelper.js";

// --- 1. HELPER: QUERY DB (Promisified) ---
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// --- 2. HELPER: PARSE JSON SAFE ---
const safeParseJSON = (jsonData) => {
  if (typeof jsonData === "object") return jsonData;
  try {
    return JSON.parse(jsonData);
  } catch (e) {
    return [];
  }
};

// ==================== CONTROLLERS ===========================

// --- TẠO BÀI HỌC MỚI ---
// Hàm này dùng chung cho cả tạo Master Lesson (ClassId = null) và Class Lesson
export const createLesson = async (req, res) => {
  const {
    Title,
    Description,
    ChapterId,
    ClassId, // Nếu null/undefined -> Master Lesson. Nếu có giá trị -> Class Lesson
    OrderIndex,
    VideoUrl,
    Documents,
    Exercises,
  } = req.body;

  if (!Title || !ChapterId) {
    return res.status(400).json({ error: "Thiếu Title hoặc ChapterId" });
  }

  try {
    // 1. Tính OrderIndex tự động nếu không truyền
    // Lưu ý: Cần tính maxPos dựa trên scope (Master hay Class) để sắp xếp đúng
    let nextOrder = OrderIndex;
    if (!nextOrder) {
      let qMax =
        "SELECT MAX(OrderIndex) as maxPos FROM Lessons WHERE ChapterId = ?";
      const params = [ChapterId];

      // Nếu là bài của lớp, chỉ tính max trong phạm vi lớp đó
      if (ClassId) {
        qMax += " AND ClassId = ?";
        params.push(ClassId);
      } else {
        qMax += " AND ClassId IS NULL";
      }

      const maxResult = await query(qMax, params);
      nextOrder = (maxResult[0].maxPos || 0) + 1;
    }

    // 2. Insert Lesson
    const qInsert = `INSERT INTO Lessons (Title, Description, VideoUrl, ChapterId, ClassId, OrderIndex) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertResult = await query(qInsert, [
      Title,
      Description,
      VideoUrl || null,
      ChapterId,
      ClassId || null, // Quan trọng: null = Master, value = Class
      nextOrder,
    ]);

    const newLessonId = insertResult.insertId;

    // 3. Insert Materials (Documents & Exercises)
    const docsList = safeParseJSON(Documents);
    const exercisesList = safeParseJSON(Exercises);

    const allMaterials = [
      ...docsList.map((d) => ({ ...d, cat: "Material" })),
      ...exercisesList.map((e) => ({ ...e, cat: "Exercise" })),
    ];

    if (allMaterials.length > 0) {
      const qMat = `INSERT INTO LessonMaterials (LessonId, Title, FileUrl, Category, UploadedBy) VALUES ?`;
      const values = allMaterials.map((item) => [
        newLessonId,
        item.Title || item.name,
        item.FileUrl || item.url,
        item.cat,
        null, // UploadedBy
      ]);
      await query(qMat, [values]);
    }

    return res.status(201).json({
      message: "Tạo bài học thành công",
      lessonId: newLessonId,
      videoUrl: VideoUrl,
    });
  } catch (err) {
    console.error("Lỗi tạo bài học:", err);
    return res.status(500).json({ error: "Lỗi server: " + err.message });
  }
};

// --- CẬP NHẬT BÀI HỌC ---
export const updateLesson = async (req, res) => {
  const {
    LessonId,
    Title,
    Description,
    VideoUrl,
    OrderIndex,
    Documents,
    Exercises,
  } = req.body;

  if (!LessonId) {
    return res.status(400).json({ error: "Thiếu LessonId" });
  }

  try {
    // 1. Kiểm tra tồn tại
    const lessons = await query("SELECT * FROM Lessons WHERE LessonId = ?", [
      LessonId,
    ]);
    if (lessons.length === 0) {
      return res.status(404).json({ error: "Bài học không tồn tại" });
    }
    const oldLesson = lessons[0];

    // 2. Xử lý Video
    let finalVideoUrl = VideoUrl;
    if (VideoUrl === undefined) {
      finalVideoUrl = oldLesson.VideoUrl;
    } else if (VideoUrl !== oldLesson.VideoUrl) {
      if (oldLesson.VideoUrl) {
        await deleteCloudinaryFile(oldLesson.VideoUrl);
      }
      finalVideoUrl = VideoUrl || null;
    }

    // 3. Update thông tin Lesson
    const newTitle = Title !== undefined ? Title : oldLesson.Title;
    const newDesc =
      Description !== undefined ? Description : oldLesson.Description;
    const newOrder =
      OrderIndex !== undefined ? OrderIndex : oldLesson.OrderIndex;

    const qUpdate = `UPDATE Lessons SET Title = ?, Description = ?, VideoUrl = ?, OrderIndex = ? WHERE LessonId = ?`;
    await query(qUpdate, [
      newTitle,
      newDesc,
      finalVideoUrl,
      newOrder,
      LessonId,
    ]);

    // 4. Update LessonMaterials
    await query("DELETE FROM LessonMaterials WHERE LessonId = ?", [LessonId]);

    const docsList = safeParseJSON(Documents);
    const exercisesList = safeParseJSON(Exercises);

    const allMaterials = [
      ...docsList.map((d) => ({ ...d, cat: "Material" })),
      ...exercisesList.map((e) => ({ ...e, cat: "Exercise" })),
    ];

    if (allMaterials.length > 0) {
      const qMat = `INSERT INTO LessonMaterials (LessonId, Title, FileUrl, Category, UploadedBy) VALUES ?`;
      const values = allMaterials.map((item) => [
        LessonId,
        item.Title || item.name,
        item.FileUrl || item.url,
        item.cat,
        null,
      ]);
      await query(qMat, [values]);
    }

    return res.json({
      message: "Cập nhật thành công",
      videoUrl: finalVideoUrl,
    });
  } catch (err) {
    console.error("Lỗi cập nhật bài học:", err);
    return res.status(500).json({ error: "Lỗi cập nhật: " + err.message });
  }
};

// --- GET ALL BY CHAPTER (ĐÃ SỬA: Lọc theo ClassId) ---
export const getLessonsByChapter = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const { classId } = req.query; // Nhận thêm classId từ query string

    let q = "SELECT * FROM Lessons WHERE ChapterId = ?";
    const params = [chapterId];

    if (classId) {
      // Nếu có classId -> Lấy bài của lớp đó
      q += " AND ClassId = ?";
      params.push(classId);
    } else {
      // Nếu không có classId -> Lấy bài Master (ClassId IS NULL)
      q += " AND ClassId IS NULL";
    }

    q += " ORDER BY OrderIndex ASC";

    const lessons = await query(q, params);
    return res.status(200).json(lessons);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// --- GET ONE (KÈM TÀI LIỆU) ---
export const getLessonById = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;

    const qLesson = "SELECT * FROM Lessons WHERE LessonId = ?";
    const lessons = await query(qLesson, [lessonId]);

    if (lessons.length === 0)
      return res.status(404).json({ message: "Lesson not found" });

    const lesson = lessons[0];

    const qMaterials = "SELECT * FROM LessonMaterials WHERE LessonId = ?";
    const allMaterials = await query(qMaterials, [lessonId]);

    lesson.Documents = allMaterials.filter((m) => m.Category === "Material");
    lesson.Exercises = allMaterials.filter((m) => m.Category === "Exercise");

    return res.status(200).json(lesson);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server" });
  }
};

// --- DELETE (XÓA BÀI HỌC + XÓA TÀI LIỆU + XÓA VIDEO) ---
export const deleteLesson = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;

    // 1. Lấy thông tin để xóa Video
    const lessons = await query(
      "SELECT VideoUrl FROM Lessons WHERE LessonId = ?",
      [lessonId]
    );
    if (lessons.length > 0 && lessons[0].VideoUrl) {
      await deleteCloudinaryFile(lessons[0].VideoUrl);
    }

    // 2. Lấy danh sách tài liệu để xóa file trên Cloud
    const materials = await query(
      "SELECT FileUrl FROM LessonMaterials WHERE LessonId = ?",
      [lessonId]
    );

    if (materials.length > 0) {
      for (const mat of materials) {
        if (mat.FileUrl) {
          await deleteCloudinaryFile(mat.FileUrl);
        }
      }
      await query("DELETE FROM LessonMaterials WHERE LessonId = ?", [lessonId]);
    }

    // 3. Xóa Bài học
    await query("DELETE FROM Lessons WHERE LessonId = ?", [lessonId]);

    return res.json({ message: "Đã xóa bài học và tài liệu liên quan" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi khi xóa bài học" });
  }
};

// --- (MỚI) IMPORT BÀI HỌC TỪ MASTER SANG CLASS ---
export const importLessonsToClass = async (req, res) => {
  const { classId, chapterId, masterLessonIds } = req.body;
  // masterLessonIds: mảng ID các bài học mẫu (có ClassId = NULL)

  if (!masterLessonIds || masterLessonIds.length === 0) {
    return res.status(400).json({ message: "Chưa chọn bài học" });
  }

  try {
    // 1. Lấy thông tin bài học mẫu
    // Phải đảm bảo chỉ lấy bài Master (ClassId IS NULL) để tránh copy nhầm bài của lớp khác
    const sqlGetMasters = `SELECT * FROM Lessons WHERE LessonId IN (?) AND ClassId IS NULL`;
    const masters = await query(sqlGetMasters, [masterLessonIds]);

    if (masters.length === 0)
      return res.status(404).json({ message: "Không tìm thấy bài học mẫu" });

    // 2. Clone dữ liệu và Insert vào lớp hiện tại
    const values = masters.map((m) => [
      m.ChapterId, // Giữ nguyên Chapter (vì Chapter dùng chung)
      classId, // Gán vào Lớp cụ thể
      m.Title,
      m.Description,
      m.VideoUrl, // Copy link video (Lưu ý: cùng trỏ 1 file trên cloud)
      m.OrderIndex,
      new Date(),
    ]);

    const sqlInsert = `
            INSERT INTO Lessons (ChapterId, ClassId, Title, Description, VideoUrl, OrderIndex, CreatedAt) 
            VALUES ?
        `;
    await query(sqlInsert, [values]);

    // (Optional) Nếu muốn copy cả LessonMaterials (Tài liệu đính kèm)
    // Bạn sẽ cần logic phức tạp hơn: lấy materials cũ, map với lessonId mới vừa tạo và insert lại.
    // Ở mức độ cơ bản, ta chỉ copy nội dung bài học.

    res
      .status(200)
      .json({ message: `Đã nhập ${masters.length} bài học thành công` });
  } catch (err) {
    console.error("Lỗi Import:", err);
    res.status(500).json({ message: "Lỗi import", error: err.message });
  }
};
