import { db } from "../../db.js";

// ==================================================================
// HELPER: WRAP DB.QUERY VÀO PROMISE
// ==================================================================
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// ==================================================================
// 0. API ĐẶC BIỆT: LẤY TOÀN BỘ NỘI DUNG LỚP HỌC (CHAPTERS + LESSONS)
// Route: GET /api/classes/:classId/content
// ==================================================================
export const getClassContent = async (req, res) => {
  const classId = req.params.classId;

  // Query gom nhóm Lessons vào trong Chapter bằng JSON_ARRAYAGG
  const q = `
    SELECT 
      ch.ChapterId,
      ch.Title,
      ch.Description,
      ch.OrderIndex,
      IF(COUNT(l.LessonId) = 0, '[]', JSON_ARRAYAGG(
        JSON_OBJECT(
          'LessonId', l.LessonId,
          'Title', l.Title,
          'Description', l.Description,
          'VideoUrl', l.VideoUrl,
          'OrderIndex', l.OrderIndex,
          'IsCompleted', l.IsCompleted
        )
      )) AS lessons
    FROM Chapters ch
    LEFT JOIN Lessons l ON ch.ChapterId = l.ChapterId
    WHERE ch.ClassId = ?
    GROUP BY ch.ChapterId
    ORDER BY ch.OrderIndex ASC
  `;

  try {
    const data = await query(q, [classId]);

    // Parse JSON string từ MySQL
    const parsedData = {
      chapters: data.map((chapter) => ({
        ...chapter,
        lessons: JSON.parse(chapter.lessons),
      })),
    };

    return res.status(200).json(parsedData);
  } catch (err) {
    console.error("Lỗi lấy nội dung lớp học:", err);
    return res.status(500).json({ error: "Lỗi server." });
  }
};

// ==================================================================
// 1. LẤY DANH SÁCH CHƯƠNG (CHỈ CHƯƠNG)
// Route: GET /api/classes/:classId/chapters
// ==================================================================
// Lấy danh sách chương của một lớp cụ thể
export const getAllChapters = async (req, res) => {
  const classId = req.params.classId;

  try {
    // -------------------------------------------------------
    // BƯỚC 1: LẤY DANH SÁCH CHƯƠNG (Của lớp này)
    // -------------------------------------------------------
    const qChapters = `
        SELECT * FROM CourseChapters 
        WHERE ClassId = ? 
        ORDER BY OrderIndex ASC
    `;
    const chapters = await query(qChapters, [classId]);

    // Nếu không có chương nào, trả về mảng rỗng ngay
    if (chapters.length === 0) {
      return res.status(200).json({ chapters: [] });
    }

    // -------------------------------------------------------
    // BƯỚC 2: LẤY DANH SÁCH BÀI HỌC (Của lớp này)
    // -------------------------------------------------------
    const qLessons = `
        SELECT * FROM Lessons 
        WHERE ClassId = ? 
        ORDER BY OrderIndex ASC
    `;
    const lessons = await query(qLessons, [classId]);

    // -------------------------------------------------------
    // BƯỚC 3: LẤY DANH SÁCH TÀI LIỆU & BÀI TẬP (Của các bài học trên)
    // -------------------------------------------------------
    let materials = [];

    // Chỉ query tài liệu nếu có bài học
    if (lessons.length > 0) {
      const lessonIds = lessons.map((l) => l.LessonId);

      // Dùng cú pháp IN (?) để lấy tài liệu của nhiều bài cùng lúc
      const qMaterials = `SELECT * FROM LessonMaterials WHERE LessonId IN (?)`;
      materials = await query(qMaterials, [lessonIds]);
    }

    // -------------------------------------------------------
    // BƯỚC 4: GOM NHÓM DỮ LIỆU (MAPPING)
    // Cấu trúc: Chapter -> Lessons -> Documents/Exercises
    // -------------------------------------------------------

    const result = chapters.map((chapter) => {
      // 4.1. Lọc các bài học thuộc chương hiện tại
      const chapterLessons = lessons.filter(
        (l) => l.ChapterId === chapter.CourseChapterId
      );

      // 4.2. Với mỗi bài học, lọc tài liệu tương ứng
      const lessonsWithMaterials = chapterLessons.map((lesson) => {
        const lessonMaterials = materials.filter(
          (m) => m.LessonId === lesson.LessonId
        );

        return {
          ...lesson,
          // Tách riêng Tài liệu và Bài tập để Frontend dễ hiển thị
          Documents: lessonMaterials.filter((m) => m.Category === "Material"),
          Exercises: lessonMaterials.filter((m) => m.Category === "Exercise"),
        };
      });

      // 4.3. Trả về object Chapter đầy đủ
      return {
        ...chapter,
        Lessons: lessonsWithMaterials,
        LessonCount: lessonsWithMaterials.length,
      };
    });

    // Trả về object chứa key chapters để khớp với frontend
    return res.status(200).json({ chapters: result });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==================================================================
// 2. LẤY CHI TIẾT CHƯƠNG
// Route: GET /api/chapters/:chapterId
// ==================================================================
export const getChapterById = async (req, res) => {
  const chapterId = req.params.chapterId;
  const q = "SELECT * FROM Chapters WHERE ChapterId = ?";

  try {
    const data = await query(q, [chapterId]);
    if (data.length === 0)
      return res.status(404).json({ error: "Chapter not found" });
    return res.status(200).json(data[0]);
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ==================================================================
// 3. TẠO CHƯƠNG MỚI (XỬ LÝ ORDER INDEX)
// Route: POST /api/chapters
// Body: { title, description, classId, orderIndex }
// ==================================================================
export const createChapter = async (req, res) => {
  const title = req.body.title || req.body.Title;
  const description = req.body.description || req.body.Description;
  const classId = req.body.classId || req.body.ClassId;
  const orderIndex =
    req.body.orderIndex !== undefined
      ? req.body.orderIndex
      : req.body.OrderIndex;

  if (!classId || !title) {
    return res
      .status(400)
      .json({ error: "Thiếu thông tin bắt buộc (Title, ClassId)." });
  }

  try {
    if (orderIndex !== undefined && orderIndex !== null && orderIndex !== "") {
      const qShift = `
        UPDATE Chapters 
        SET OrderIndex = OrderIndex + 1 
        WHERE ClassId = ? AND OrderIndex >= ?
      `;
      await query(qShift, [classId, orderIndex]);

      const qInsert = `INSERT INTO Chapters (ClassId, Title, Description, OrderIndex) VALUES (?, ?, ?, ?)`;
      const result = await query(qInsert, [
        classId,
        title,
        description,
        orderIndex,
      ]);

      return res.status(201).json({
        message: "Chapter created (Manual)",
        chapterId: result.insertId,
        OrderIndex: orderIndex,
        Title: title,
      });
    } else {
      const qAtomicInsert = `
        INSERT INTO Chapters (ClassId, Title, Description, OrderIndex)
        SELECT ?, ?, ?, COALESCE((SELECT MAX(OrderIndex) FROM Chapters WHERE ClassId = ?), 0) + 1
        FROM Classes
        WHERE ClassId = ?
      `;

      const result = await query(qAtomicInsert, [
        classId,
        title,
        description,
        classId,
        classId,
      ]);

      return res.status(201).json({
        message: "Chapter created (Auto)",
        chapterId: result.insertId,
        Title: title,
      });
    }
  } catch (err) {
    console.error("Create Chapter Error:", err);
    return res.status(500).json({ error: "Lỗi server khi tạo chương." });
  }
};

// ==================================================================
// 4. CẬP NHẬT CHƯƠNG
// Route: PUT /api/chapters/:chapterId
// ==================================================================
export const updateChapter = async (req, res) => {
  const chapterId = req.params.chapterId;
  const { title, description, Title, Description } = req.body;

  const finalTitle = title || Title;
  const finalDesc = description || Description;

  let fields = [];
  let values = [];

  if (finalTitle) {
    fields.push("`Title` = ?");
    values.push(finalTitle);
  }
  if (finalDesc !== undefined) {
    fields.push("`Description` = ?");
    values.push(finalDesc);
  }

  if (fields.length === 0)
    return res.status(400).json({ message: "No data to update" });

  values.push(chapterId);
  const q = `UPDATE Chapters SET ${fields.join(", ")} WHERE ChapterId = ?`;

  try {
    await query(q, values);
    return res.json({ message: "Chapter updated" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ==================================================================
// 5. XÓA CHƯƠNG
// Route: DELETE /api/chapters/:chapterId
// ==================================================================
export const deleteChapter = async (req, res) => {
  const chapterId = req.params.chapterId;
  const q = "DELETE FROM Chapters WHERE ChapterId = ?";

  try {
    const result = await query(q, [chapterId]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Chapter not found" });
    return res.json({ message: "Chapter deleted" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ==================================================================
// 6. CẬP NHẬT THỨ TỰ (DRAG & DROP)
// Route: PUT /api/chapters/reorder
// ==================================================================
export const updateChapterOrder = async (req, res) => {
  const { chapterOrder } = req.body;

  if (!Array.isArray(chapterOrder))
    return res.status(400).json({ error: "Invalid format" });

  try {
    const promises = chapterOrder.map((chapterId, index) => {
      const q = "UPDATE Chapters SET OrderIndex = ? WHERE ChapterId = ?";
      return query(q, [index + 1, chapterId]);
    });

    await Promise.all(promises);
    return res.json({ message: "Order updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

// ==================================================================
// 7. IMPORT CHAPTERS TỪ KHO MASTER (NEW)
// Route: POST /api/chapters/import
// Body: { classId, masterChapterIds: [1, 2, 5] }
// ==================================================================
export const importChapters = async (req, res) => {
  const { classId, masterChapterIds } = req.body;

  if (!classId || !masterChapterIds || masterChapterIds.length === 0) {
    return res
      .status(400)
      .json({ error: "Thiếu ClassId hoặc danh sách chương." });
  }

  try {
    await query("START TRANSACTION");

    // 1. Lấy thông tin các Master Chapters từ bảng CourseChapters
    const qGetMasters = `
      SELECT * FROM CourseChapters 
      WHERE CourseChapterId IN (?) 
      ORDER BY OrderIndex ASC
    `;
    const masterChapters = await query(qGetMasters, [masterChapterIds]);

    if (masterChapters.length === 0) {
      await query("ROLLBACK");
      return res.status(404).json({ error: "Không tìm thấy chương mẫu nào." });
    }

    // 2. Lấy OrderIndex hiện tại cao nhất của Lớp để nối tiếp
    const qMaxOrder =
      "SELECT COALESCE(MAX(OrderIndex), 0) as maxPos FROM Chapters WHERE ClassId = ?";
    const maxRes = await query(qMaxOrder, [classId]);
    let currentOrder = maxRes[0].maxPos;

    // 3. Duyệt từng Master Chapter để Clone
    for (const mChapter of masterChapters) {
      currentOrder++;

      // 3.1. Insert Chapter mới vào lớp (Bảng Chapters)
      const qInsertChap = `
        INSERT INTO Chapters (ClassId, Title, Description, OrderIndex) 
        VALUES (?, ?, ?, ?)
      `;
      const resChap = await query(qInsertChap, [
        classId,
        mChapter.Title,
        mChapter.Description,
        currentOrder,
      ]);
      const newChapterId = resChap.insertId;

      // 3.2. Lấy các Master Lessons thuộc chương mẫu này (Từ bảng CourseLessons)
      const qGetMasterLessons = `
        SELECT * FROM CourseLessons 
        WHERE CourseChapterId = ? 
        ORDER BY OrderIndex ASC
      `;
      const masterLessons = await query(qGetMasterLessons, [
        mChapter.CourseChapterId,
      ]);

      // 3.3. Insert Lessons mới vào Chapter mới vừa tạo (Bảng Lessons)
      if (masterLessons.length > 0) {
        const lessonValues = masterLessons.map((mLesson) => [
          newChapterId, // Link tới Chapter mới của lớp
          classId, // Link tới Lớp
          mLesson.Title,
          mLesson.Description,
          mLesson.VideoUrl, // Copy video url (nếu có)
          mLesson.OrderIndex,
          new Date(), // CreatedAt
        ]);

        const qInsertLesson = `
          INSERT INTO Lessons (ChapterId, ClassId, Title, Description, VideoUrl, OrderIndex, CreatedAt)
          VALUES ?
        `;
        await query(qInsertLesson, [lessonValues]);
      }
    }

    await query("COMMIT");
    return res.status(200).json({
      message: `Đã nhập thành công ${masterChapters.length} chương và các bài học kèm theo.`,
    });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi Import Chapters:", err);
    return res.status(500).json({ error: "Lỗi server khi nhập chương." });
  }
};
