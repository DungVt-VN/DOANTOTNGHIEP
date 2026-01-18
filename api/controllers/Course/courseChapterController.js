import { db } from "../../db.js";
import util from "util";

// Promisify để dùng async/await chuẩn
const queryAsync = util.promisify(db.query).bind(db);

// ==================================================================
// 1. LẤY DANH SÁCH CHƯƠNG (KÈM SỐ LƯỢNG BÀI HỌC)
// Route: GET /api/courses/:courseId/chapters
// ==================================================================
export const getAllCourseChaptersMaster = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // 1. Lấy danh sách Chương (Chapters)
    const qChapters = `
      SELECT * FROM CourseChapters 
      WHERE CourseId = ? 
      ORDER BY OrderIndex ASC
    `;
    const chapters = await queryAsync(qChapters, [courseId]);

    // Nếu không có chương nào, trả về mảng rỗng luôn
    if (!chapters || chapters.length === 0) {
      return res.status(200).json([]);
    }

    // Lấy danh sách ID của các chương để query bài học
    const chapterIds = chapters.map((c) => c.CourseChapterId);

    // 2. Lấy danh sách Bài học (Lessons) thuộc các chương trên
    // Sử dụng cú pháp IN (...)
    const qLessons = `
      SELECT * FROM Lessons 
      WHERE ChapterId IN (?)  AND ClassId IS NULL
      ORDER BY OrderIndex ASC
    `;
    // Lưu ý: queryAsync cần hỗ trợ parse mảng cho IN clause, nếu dùng mysql2 library thì ok.
    // Nếu library của bạn không tự parse mảng cho IN (?), bạn cần xử lý string join: IN (${chapterIds.join(',')})
    const lessons = await queryAsync(qLessons, [chapterIds]);

    // 3. Lấy danh sách Tài liệu (Materials) thuộc các bài học trên
    let materials = [];
    if (lessons.length > 0) {
      const lessonIds = lessons.map((l) => l.LessonId);
      const qMaterials = `SELECT * FROM LessonMaterials WHERE LessonId IN (?)`;
      materials = await queryAsync(qMaterials, [lessonIds]);
    }

    // 4. GỘP DỮ LIỆU (Mapping Data)
    // Bước này xử lý trên RAM (nhanh hơn gọi DB nhiều lần)

    // A. Map Tài liệu vào từng Bài học
    const lessonsWithMaterials = lessons.map((lesson) => {
      // Lọc các tài liệu thuộc bài học này
      const lessonMaterials = materials.filter(
        (m) => m.LessonId === lesson.LessonId
      );

      // Phân loại Documents và Exercises để Frontend dễ dùng
      return {
        ...lesson,
        Documents: lessonMaterials.filter((m) => m.Category === "Material"),
        Exercises: lessonMaterials.filter((m) => m.Category === "Exercise"),
      };
    });

    // B. Map Bài học vào từng Chương
    const fullData = chapters.map((chapter) => {
      const chapterLessons = lessonsWithMaterials.filter(
        (l) => l.ChapterId === chapter.CourseChapterId
      );

      return {
        ...chapter,
        Lessons: chapterLessons, // Mảng bài học đã kèm tài liệu
        LessonCount: chapterLessons.length, // Tự tính count luôn
      };
    });

    return res.status(200).json(fullData);
  } catch (err) {
    console.error("Lỗi getAllCourseChapters:", err);
    return res.status(500).json({ error: "Lỗi server khi tải nội dung." });
  }
};
// ==================================================================
// 2. LẤY CHI TIẾT MỘT CHƯƠNG
// Route: GET /api/chapters/:id
// ==================================================================
export const getCourseChapterById = async (req, res) => {
  const courseChapterId = req.params.id;
  const q = "SELECT * FROM CourseChapters WHERE CourseChapterId = ?";

  try {
    const data = await queryAsync(q, [courseChapterId]);
    if (data.length === 0)
      return res.status(404).json({ error: "Chapter not found" });
    return res.status(200).json(data[0]);
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ==================================================================
// 3. TẠO CHƯƠNG MỚI (CREATE CHAPTER) - AUTO ORDER INDEX
// Route: POST /api/chapters
// ==================================================================
export const createCourseChapter = async (req, res) => {
  const { Title, Description, CourseId, OrderIndex } = req.body;

  if (!CourseId || !Title) {
    return res
      .status(400)
      .json({ error: "Thiếu thông tin bắt buộc (Title, CourseId)." });
  }

  try {
    let finalOrderIndex = OrderIndex;

    // Nếu KHÔNG có OrderIndex gửi lên, tự tính Max + 1
    if (
      finalOrderIndex === undefined ||
      finalOrderIndex === null ||
      finalOrderIndex === ""
    ) {
      const qMax =
        "SELECT MAX(OrderIndex) as maxPos FROM CourseChapters WHERE CourseId = ?";
      const resultMax = await queryAsync(qMax, [CourseId]);
      finalOrderIndex = (resultMax[0].maxPos || 0) + 1;
    }

    const qInsert = `
      INSERT INTO CourseChapters (CourseId, Title, Description, OrderIndex) 
      VALUES (?, ?, ?, ?)
    `;

    const result = await queryAsync(qInsert, [
      CourseId,
      Title,
      Description,
      finalOrderIndex,
    ]);

    return res.status(201).json({
      message: "Tạo chương thành công!",
      courseChapterId: result.insertId,
      OrderIndex: finalOrderIndex,
      Title,
      Description,
    });
  } catch (err) {
    console.error("Lỗi tạo chương:", err);
    return res.status(500).json({ error: "Lỗi server khi tạo chương." });
  }
};

// ==================================================================
// 4. CẬP NHẬT CHƯƠNG
// Route: PUT /api/chapters/:id
// ==================================================================
export const updateCourseChapter = async (req, res) => {
  // Ưu tiên lấy ID từ params (RESTful chuẩn), nếu không có thì lấy từ body
  const courseChapterId = req.params.id || req.body.CourseChapterId;
  const { Title, Description, OrderIndex } = req.body;

  if (!courseChapterId) {
    return res.status(400).json({ error: "Thiếu CourseChapterId." });
  }

  let fields = [];
  let values = [];

  // Xây dựng câu query động
  if (Title !== undefined) {
    fields.push("`Title` = ?");
    values.push(Title);
  }
  if (Description !== undefined) {
    fields.push("`Description` = ?");
    values.push(Description);
  }
  if (OrderIndex !== undefined) {
    fields.push("`OrderIndex` = ?");
    values.push(OrderIndex);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
  }

  // Đẩy ID vào cuối mảng values (cho điều kiện WHERE)
  values.push(courseChapterId);

  const q = `UPDATE CourseChapters SET ${fields.join(
    ", "
  )} WHERE CourseChapterId = ?`;

  try {
    const result = await queryAsync(q, values);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chương để cập nhật (Sai ID)." });
    }

    return res.json({
      message: "Cập nhật chương thành công.",
      updatedId: courseChapterId,
    });
  } catch (err) {
    console.error("Lỗi update chapter:", err);
    return res.status(500).json({ error: "Lỗi server khi cập nhật chương." });
  }
};

// ==================================================================
// 5. XÓA CHƯƠNG
// Route: DELETE /api/chapters/:id
// ==================================================================
export const deleteCourseChapter = async (req, res) => {
  // Lấy ID từ params. Lưu ý: route thường là /:id hoặc /:courseChapterId
  // Hãy đảm bảo tên biến khớp với route
  const courseChapterId = req.params.id || req.params.courseChapterId;

  const q = "DELETE FROM CourseChapters WHERE CourseChapterId = ?";

  try {
    const result = await queryAsync(q, [courseChapterId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy chương." });
    }
    return res.json({ message: "Đã xóa chương thành công." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi khi xóa chương." });
  }
};

// ==================================================================
// 6. CẬP NHẬT THỨ TỰ (DRAG & DROP)
// Route: PUT /api/chapters/reorder
// Body: { chapterOrder: [id1, id2, id3] }
// ==================================================================
export const updateCourseChapterOrder = async (req, res) => {
  const { chapterOrder } = req.body;

  if (!Array.isArray(chapterOrder))
    return res.status(400).json({ error: "Dữ liệu không hợp lệ." });

  try {
    const promises = chapterOrder.map((id, index) => {
      const q =
        "UPDATE CourseChapters SET OrderIndex = ? WHERE CourseChapterId = ?";
      return queryAsync(q, [index + 1, id]);
    });

    await Promise.all(promises);
    return res.json({ message: "Cập nhật thứ tự thành công." });
  } catch (err) {
    console.error("Lỗi Reorder:", err);
    return res.status(500).json({ error: "Lỗi server." });
  }
};
