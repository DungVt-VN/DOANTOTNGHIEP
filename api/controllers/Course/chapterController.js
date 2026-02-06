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
        (l) => l.ChapterId === chapter.CourseChapterId,
      );

      // 4.2. Với mỗi bài học, lọc tài liệu tương ứng
      const lessonsWithMaterials = chapterLessons.map((lesson) => {
        const lessonMaterials = materials.filter(
          (m) => m.LessonId === lesson.LessonId,
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

  // Sửa lại tên bảng và tên cột khóa chính cho đúng DB
  const q = "SELECT * FROM CourseChapters WHERE CourseChapterId = ?";

  try {
    const data = await query(q, [chapterId]);

    if (data.length === 0) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    return res.status(200).json(data[0]);
  } catch (err) {
    console.error("Get Chapter Error:", err);
    return res
      .status(500)
      .json({ error: "Lỗi server khi lấy thông tin chương." });
  }
};

// ==================================================================
// 3. TẠO CHƯƠNG MỚI (XỬ LÝ ORDER INDEX)
// Route: POST /api/chapters
// Body: { title, description, classId, orderIndex }
// ==================================================================
export const createChapter = async (req, res) => {
  // Chuẩn hóa đầu vào (chấp nhận cả viết hoa và viết thường)
  const title = req.body.title || req.body.Title;
  const description = req.body.description || req.body.Description;
  const classId = req.body.classId || req.body.ClassId;

  // Validate dữ liệu bắt buộc
  if (!classId || !title) {
    return res
      .status(400)
      .json({ error: "Thiếu thông tin bắt buộc (Title, ClassId)." });
  }

  try {
    // CÂU LỆNH TỐI ƯU:
    // 1. Insert vào bảng CourseChapters
    // 2. Cột OrderIndex được tính toán tự động bằng cách lấy (MAX hiện tại + 1)
    // 3. Sử dụng COALESCE để xử lý trường hợp lớp chưa có chương nào (MAX = null -> 0)
    // 4. Alias 'cc' trong subquery để tránh lỗi "You can't specify target table for update in FROM clause"

    const q = `
      INSERT INTO CourseChapters (ClassId, Title, Description, OrderIndex)
      SELECT ?, ?, ?, (SELECT COALESCE(MAX(cc.OrderIndex), 0) + 1 FROM CourseChapters cc WHERE cc.ClassId = ?)
    `;

    // Tham số: [classId, title, description, classId]
    // classId xuất hiện 2 lần: 1 lần để insert, 1 lần để lọc trong subquery tính MAX
    const result = await query(q, [classId, title, description, classId]);

    // Trả về kết quả
    return res.status(201).json({
      message: "Tạo chương thành công.",
      CourseChapterId: result.insertId, // Trả về ID vừa tạo
      Title: title,
      // Lưu ý: Chúng ta không query lại OrderIndex để tối ưu,
      // Frontend có thể tự hiểu là nó nằm cuối hoặc reload lại danh sách.
    });
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

  // Hỗ trợ nhận cả viết hoa và viết thường từ Frontend
  const finalTitle = title || Title;
  const finalDesc = description || Description;

  let fields = [];
  let values = [];

  if (finalTitle) {
    fields.push("`Title` = ?");
    values.push(finalTitle);
  }
  // Cho phép update Description thành chuỗi rỗng (nếu muốn xóa mô tả) nên check undefined
  if (finalDesc !== undefined) {
    fields.push("`Description` = ?");
    values.push(finalDesc);
  }

  if (fields.length === 0)
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });

  // Đẩy ID vào cuối mảng values để khớp với dấu ? ở WHERE
  values.push(chapterId);

  // SỬA: Tên bảng là CourseChapters và khóa chính là CourseChapterId
  const q = `UPDATE CourseChapters SET ${fields.join(", ")} WHERE CourseChapterId = ?`;

  try {
    const result = await query(q, values);

    // Kiểm tra xem có bản ghi nào bị ảnh hưởng không (nếu ID sai thì affectedRows = 0)
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chương để cập nhật." });
    }

    return res.json({ message: "Cập nhật chương thành công." });
  } catch (err) {
    console.error("Update Chapter Error:", err);
    return res.status(500).json({ error: "Lỗi server khi cập nhật chương." });
  }
};
// ==================================================================
// 5. XÓA CHƯƠNG
// Route: DELETE /api/chapters/:chapterId
// ==================================================================
export const deleteChapter = async (req, res) => {
  const chapterId = req.params.chapterId;
  try {
    // 1. Bắt đầu Transaction
    await query("START TRANSACTION");

    // 2. Xóa tất cả bài học thuộc chương này trước
    const qDeleteLessons = "DELETE FROM Lessons WHERE ChapterId = ?";
    await query(qDeleteLessons, [chapterId]);

    // 3. Sau đó xóa chương
    const qDeleteChapter =
      "DELETE FROM CourseChapters WHERE CourseChapterId = ?";
    const result = await query(qDeleteChapter, [chapterId]);

    // Kiểm tra nếu không tìm thấy chương để xóa
    if (result.affectedRows === 0) {
      await query("ROLLBACK"); // Hoàn tác nếu lỗi logic
      return res.status(404).json({ message: "Chapter not found" });
    }

    // 4. Xác nhận Transaction (Lưu thay đổi)
    await query("COMMIT");

    return res.json({
      message: "Chapter and related lessons deleted successfully",
    });
  } catch (err) {
    // 5. Nếu có lỗi, hoàn tác mọi thay đổi
    await query("ROLLBACK");
    console.error("Delete Chapter Error:", err);
    return res.status(500).json(err);
  }
};

// ==================================================================
// 6. CẬP NHẬT THỨ TỰ (DRAG & DROP)
// Route: PUT /api/chapters/reorder
// ==================================================================
export const updateChapterOrder = async (req, res) => {
  // chapterOrder là mảng chứa các CourseChapterId theo thứ tự mới. VD: [5, 2, 8, 1]
  const { chapterOrder } = req.body;

  if (!Array.isArray(chapterOrder))
    return res
      .status(400)
      .json({ error: "Định dạng không hợp lệ. Cần một mảng các ID." });

  try {
    // Tạo mảng các Promise để update từng dòng
    const promises = chapterOrder.map((courseChapterId, index) => {
      // SỬA: Tên bảng là CourseChapters và khóa chính là CourseChapterId
      const q =
        "UPDATE CourseChapters SET OrderIndex = ? WHERE CourseChapterId = ?";

      // index + 1: Để OrderIndex bắt đầu từ 1 thay vì 0
      return query(q, [index + 1, courseChapterId]);
    });

    // Chạy song song tất cả các lệnh update
    await Promise.all(promises);

    return res.json({ message: "Cập nhật thứ tự chương thành công." });
  } catch (err) {
    console.error("Update Order Error:", err);
    return res.status(500).json({ error: "Lỗi server khi sắp xếp chương." });
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
    // SỬA: Bảng CourseChapters, không phải Chapters
    const qMaxOrder =
      "SELECT COALESCE(MAX(OrderIndex), 0) as maxPos FROM CourseChapters WHERE ClassId = ?";
    const maxRes = await query(qMaxOrder, [classId]);
    let currentOrder = maxRes[0].maxPos;

    // 3. Duyệt từng Master Chapter để Clone
    for (const mChapter of masterChapters) {
      currentOrder++;

      // 3.1. Insert Chapter mới vào lớp (Bảng CourseChapters)
      // SỬA: Insert vào CourseChapters
      // Lưu ý: Ta copy cả CourseId để biết chương này thuộc khóa nào, nhưng thêm ClassId để biết nó thuộc lớp nào
      const qInsertChap = `
        INSERT INTO CourseChapters (CourseId, ClassId, Title, Description, OrderIndex) 
        VALUES (?, ?, ?, ?, ?)
      `;
      const resChap = await query(qInsertChap, [
        mChapter.CourseId, // Giữ nguyên CourseId gốc
        classId, // Gán vào ClassId hiện tại
        mChapter.Title,
        mChapter.Description,
        currentOrder,
      ]);
      const newChapterId = resChap.insertId;

      // 3.2. Lấy các Master Lessons thuộc chương mẫu này (Từ bảng Lessons)
      // SỬA: Lấy từ bảng Lessons nơi ChapterId = MasterID
      const qGetMasterLessons = `
        SELECT * FROM Lessons 
        WHERE ChapterId = ? 
        ORDER BY OrderIndex ASC
      `;
      const masterLessons = await query(qGetMasterLessons, [
        mChapter.CourseChapterId,
      ]);

      // 3.3. Insert Lessons mới vào Chapter mới vừa tạo (Bảng Lessons)
      if (masterLessons.length > 0) {
        const lessonValues = masterLessons.map((mLesson) => [
          newChapterId, // Link tới Chapter MỚI vừa tạo
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
