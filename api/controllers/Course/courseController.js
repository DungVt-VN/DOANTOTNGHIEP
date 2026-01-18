import { db } from "../../db.js";

// ==================================================================
// PHẦN 1: QUẢN LÝ KHÓA HỌC (COURSES)
// ==================================================================
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};
// --- 1. LẤY TOÀN BỘ KHÓA HỌC (Dành cho Admin hoặc trang chủ public) ---
export const getAllCourses = (req, res) => {
  // Có thể thêm search query hoặc filter môn học nếu cần
  const q = "SELECT * FROM Courses ORDER BY CreatedAt DESC";

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};
export const getTeacherCourses = (req, res) => {
  const q = `
    SELECT 
      c.CourseId,
      c.CourseName,
      c.Subject,
      c.Description,
      c.CourseImage, -- Cột mới nếu có, hoặc dùng BaseTuitionFee để hiển thị giá
      (SELECT COUNT(*) FROM CourseChapters ch WHERE ch.CourseId = c.CourseId) as ChapterCount,
      (SELECT COUNT(*) 
       FROM CourseLessons l 
       JOIN CourseChapters ch ON l.CourseChapterId = ch.CourseChapterId 
       WHERE ch.CourseId = c.CourseId) as LessonCount
    FROM Courses c
    ORDER BY c.CreatedAt DESC
  `;

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};
// --- 2. LẤY KHÓA HỌC CỦA TÔI (API chung cho User đã đăng nhập) ---
export const getCourses = (req, res) => {
  // Lấy thông tin user từ middleware authorize
  const userInfo = req.user || req.userInfo;
  const userId = userInfo.id;
  const userRole = userInfo.Role || userInfo.role;

  let q = "";
  let params = [];

  // 1. CHUẨN BỊ CÂU QUERY CƠ BẢN
  // Thêm: cl.Days, cl.StartTime, cl.EndTime (Thời gian)
  // Thêm: r.RoomName, r.Location (Phòng học)
  const baseSelect = `
    SELECT 
      c.CourseId, c.CourseName, c.CourseImage, c.Subject, c.Description, c.BaseTuitionFee,
      cl.ClassId, cl.ClassName, cl.Status, cl.StartDate, cl.EndDate,
      cl.Days, cl.StartTime, cl.EndTime,
      r.RoomName, r.Location,
      (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = cl.ClassId) as ClassStudentCount
  `;

  if (userRole === "Teacher") {
    // Giáo viên: Join thêm bảng Classrooms (r)
    q = `
      ${baseSelect}
      FROM Courses c
      JOIN Classes cl ON c.CourseId = cl.CourseId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      JOIN Teachers t ON cl.TeacherId = t.TeacherId
      WHERE t.UserId = ?
      ORDER BY c.CourseId, cl.StartDate DESC
    `;
    params = [userId];
  } else if (userRole === "Student") {
    // Học sinh: Join thêm bảng Classrooms (r)
    q = `
      ${baseSelect}
      FROM Courses c
      JOIN Classes cl ON c.CourseId = cl.CourseId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      JOIN Class_Student cs_link ON cl.ClassId = cs_link.ClassId
      JOIN Students s ON cs_link.StudentId = s.StudentId
      WHERE s.UserId = ?
      ORDER BY c.CourseId, cl.StartDate DESC
    `;
    params = [userId];
  } else {
    // Admin: Join thêm bảng Classrooms (r)
    q = `
      ${baseSelect}
      FROM Courses c
      LEFT JOIN Classes cl ON c.CourseId = cl.CourseId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      ORDER BY c.CourseId, cl.StartDate DESC
    `;
    params = [];
  }

  // 2. THỰC THI QUERY VÀ XỬ LÝ DỮ LIỆU
  db.query(q, params, (err, data) => {
    if (err) return res.status(500).json(err);

    // 3. GOM NHÓM DỮ LIỆU (GROUPING)
    const groupedCourses = data.reduce((acc, row) => {
      const courseId = row.CourseId;

      // Nếu chưa có khóa học này, tạo mới
      if (!acc[courseId]) {
        acc[courseId] = {
          CourseId: row.CourseId,
          CourseName: row.CourseName,
          CourseImage: row.CourseImage,
          Subject: row.Subject,
          Description: row.Description,
          BaseTuitionFee: row.BaseTuitionFee,
          ClassCount: 0,
          TotalStudents: 0,
          Classes: [],
        };
      }

      // Nếu dòng này có dữ liệu lớp học
      if (row.ClassId) {
        acc[courseId].Classes.push({
          ClassId: row.ClassId,
          ClassName: row.ClassName,
          Status: row.Status,
          StartDate: row.StartDate,
          EndDate: row.EndDate,

          // --- THÔNG TIN THỜI GIAN ---
          Days: row.Days,
          StartTime: row.StartTime,
          EndTime: row.EndTime,

          // --- THÔNG TIN PHÒNG HỌC ---
          RoomName: row.RoomName,
          Location: row.Location,

          StudentCount: row.ClassStudentCount,
        });

        // Cộng dồn thống kê
        acc[courseId].ClassCount += 1;
        acc[courseId].TotalStudents += row.ClassStudentCount;
      }

      return acc;
    }, {});

    const result = Object.values(groupedCourses);
    return res.status(200).json(result);
  });
};

// --- 3. LẤY CHI TIẾT 1 KHÓA HỌC ---
export const getCourseById = (req, res) => {
  const courseId = req.params.id;
  const q = "SELECT * FROM Courses WHERE CourseId = ?";

  db.query(q, [courseId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0)
      return res.status(404).json({ error: "Course not found" });
    return res.status(200).json(data[0]);
  });
};

// --- 4. THÊM KHÓA HỌC MỚI (Admin) ---
export const addCourse = (req, res) => {
  const { CourseName, Subject, Description, BaseTuitionFee, CourseImage } =
    req.body;

  const q =
    "INSERT INTO Courses (`CourseName`, `Subject`, `Description`, `BaseTuitionFee`, `CourseImage`) VALUES (?, ?, ?, ?, ?)";

  const values = [
    CourseName,
    Subject,
    Description,
    BaseTuitionFee,
    CourseImage || null,
  ];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res
      .status(201)
      .json({ message: "Course created.", courseId: data.insertId });
  });
};

// --- 5. CẬP NHẬT KHÓA HỌC (Admin) ---
export const updateCourse = (req, res) => {
  const courseId = req.params.id;
  const { CourseName, Description, CourseImage, Subject, BaseTuitionFee } =
    req.body;

  const q =
    "UPDATE Courses SET `CourseName`=?, `Description`=?, `CourseImage`=?, `Subject`=?, `BaseTuitionFee`=? WHERE `CourseId` = ?";

  const values = [
    CourseName,
    Description,
    CourseImage,
    Subject,
    BaseTuitionFee,
    courseId,
  ];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "Course has been updated." });
  });
};

// --- 6. XÓA KHÓA HỌC (Admin) ---
export const deleteCourse = (req, res) => {
  const courseId = req.params.id;

  // Kiểm tra quyền Admin (giả sử middleware đã gán user vào req)
  const userRole = req.userInfo?.role || req.user?.role;

  if (userRole !== "Admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized! Only Admin can delete courses." });
  }

  const q = "DELETE FROM Courses WHERE CourseId = ?";
  db.query(q, [courseId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.affectedRows === 0)
      return res.status(404).json({ error: "Course not found!" });

    return res.json({ message: "Course has been deleted!" });
  });
};

// ==================================================================
// PHẦN 2: CHỨC NĂNG MỞ RỘNG CHO GIÁO VIÊN & HỌC SINH
// ==================================================================

// --- 7. LẤY DANH SÁCH LỚP HỌC THUỘC 1 KHÓA HỌC ---
// (Quan trọng: Giáo viên cần biết trong Course này mình dạy Class nào)
export const getClassesByCourse = (req, res) => {
  const courseId = req.params.courseId;
  const userInfo = req.userInfo;
  const userId = userInfo.id;
  const userRole = userInfo.Role || userInfo.role;

  let q = "";
  let params = [courseId];

  if (userRole === "Teacher") {
    // Giáo viên chỉ thấy các lớp MÌNH dạy trong khóa này
    // Lấy thêm thông tin Phòng học và Sĩ số hiện tại
    q = `
      SELECT 
        cl.*, 
        r.RoomName, 
        r.Location,
        (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = cl.ClassId) as StudentCount
      FROM Classes cl
      JOIN Teachers t ON cl.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      WHERE cl.CourseId = ? AND t.UserId = ?
    `;
    params.push(userId);
  } else if (userRole === "Student") {
    // Học sinh chỉ thấy lớp MÌNH đang học trong khóa này
    q = `
      SELECT cl.*, r.RoomName, r.Location, t.FullName as TeacherName
      FROM Classes cl
      JOIN Class_Student cs ON cl.ClassId = cs.ClassId
      JOIN Students s ON cs.StudentId = s.StudentId
      LEFT JOIN Teachers t ON cl.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      WHERE cl.CourseId = ? AND s.UserId = ?
    `;
    params.push(userId);
  } else {
    // Admin thấy tất cả lớp trong khóa
    q = `
      SELECT cl.*, r.RoomName, t.FullName as TeacherName
      FROM Classes cl
      LEFT JOIN Teachers t ON cl.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
      WHERE cl.CourseId = ?
    `;
  }

  db.query(q, params, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

// ==================================================================
// PHẦN 3: CHỨC NĂNG DÀNH RIÊNG CHO STUDENT
// ==================================================================

// --- 8. LẤY DANH SÁCH KHÓA HỌC CHƯA ĐĂNG KÝ (Available Courses) ---
// Để học sinh tìm khóa học mới
export const getAvailableCourses = async (req, res) => {
  try {
    const q = `
      SELECT 
        co.CourseId, 
        co.CourseName, 
        co.Subject, 
        co.CourseImage, 
        co.BaseTuitionFee, 
        co.Description,
        COUNT(c.ClassId) as OpenClassesCount,
        CAST(
          CONCAT(
            '[', 
            IFNULL(
              GROUP_CONCAT(
                DISTINCT JSON_OBJECT(
                  'FullName', t.FullName, 
                  'Avatar', u.Avatar
                )
              ), 
              ''
            ), 
            ']'
          ) AS JSON
        ) as Teachers
      FROM Courses co
      JOIN Classes c ON co.CourseId = c.CourseId
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      LEFT JOIN Users u ON t.UserId = u.UserId -- Join thêm bảng Users để lấy Avatar
      WHERE c.Status IN ('Recruiting', 'Upcoming')
      GROUP BY co.CourseId
    `;

    const [rows] = await db.promise().query(q);

    // Xử lý dữ liệu trả về
    const courses = rows.map((row) => ({
      ...row,
      Teachers:
        typeof row.Teachers === "string"
          ? JSON.parse(row.Teachers)
          : row.Teachers,
    }));

    res.status(200).json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const getClassesByCourseId = async (req, res) => {
  const studentId = req.user.studentId;
  const { courseId } = req.params;

  try {
    const q = `
      SELECT 
        c.ClassId, 
        c.ClassName, 
        c.Days, 
        c.StartTime, 
        c.EndTime, 
        c.RoomId, 
        c.TuitionFee, 
        c.MaxStudents,
        c.StartDate,
        t.FullName as TeacherName,
        t.Avatar as TeacherAvatar,
        r.RoomName,
        (SELECT COUNT(*) FROM Class_Student WHERE ClassId = c.ClassId) as Enrolled,
        (SELECT COUNT(*) FROM Class_Student WHERE ClassId = c.ClassId AND StudentId = ?) as IsRegistered
      FROM Classes c
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      WHERE c.CourseId = ? 
      AND c.Status IN ('Recruiting', 'Upcoming')
      ORDER BY c.StartDate ASC
    `;
    const [rows] = await db.promise().query(q, [studentId, courseId]);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
// --- 9. XEM THỜI KHÓA BIỂU CỦA HỌC SINH (Student Schedule) ---
export const getStudentSchedule = (req, res) => {
  const userInfo = req.userInfo;
  const userId = userInfo.id;

  const q = `
    SELECT 
      cl.ClassId, 
      cl.ClassName, 
      cl.Days, 
      cl.StartTime, 
      cl.EndTime, 
      cl.RoomId,
      r.RoomName,
      r.Location,
      c.CourseName,
      t.FullName as TeacherName
    FROM Classes cl
    JOIN Class_Student cs ON cl.ClassId = cs.ClassId
    JOIN Students s ON cs.StudentId = s.StudentId
    JOIN Courses c ON cl.CourseId = c.CourseId
    LEFT JOIN Classrooms r ON cl.RoomId = r.RoomId
    LEFT JOIN Teachers t ON cl.TeacherId = t.TeacherId
    WHERE s.UserId = ? AND cl.Status IN ('Active', 'Upcoming')
  `;

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const importFullCourse = async (req, res) => {
  const { classId, courseId } = req.body;

  if (!classId || !courseId) {
    return res
      .status(400)
      .json({ message: "Thiếu thông tin ClassId hoặc CourseId" });
  }

  try {
    await query("START TRANSACTION");

    // 1. Lấy danh sách các CHƯƠNG MẪU (Master Chapters)
    const sqlGetMasterChapters = `
      SELECT * FROM CourseChapters 
      WHERE CourseId = ? AND ClassId IS NULL
      ORDER BY OrderIndex ASC
    `;
    const masterChapters = await query(sqlGetMasterChapters, [courseId]);

    if (masterChapters.length === 0) {
      await query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Khóa học mẫu chưa có nội dung." });
    }

    // 2. Check trùng: Lấy danh sách CHƯƠNG HIỆN CÓ trong Lớp
    const sqlGetExistingChapters = `SELECT Title FROM CourseChapters WHERE ClassId = ?`;
    const existingChapters = await query(sqlGetExistingChapters, [classId]);
    const existingTitles = new Set(
      existingChapters.map((ch) => ch.Title.trim().toLowerCase())
    );

    // 3. Lọc ra các chương CẦN IMPORT
    const chaptersToImport = masterChapters.filter(
      (mChapter) => !existingTitles.has(mChapter.Title.trim().toLowerCase())
    );

    if (chaptersToImport.length === 0) {
      await query("ROLLBACK");
      return res.status(200).json({
        message: "Lớp học đã có đầy đủ nội dung. Không có gì để nhập thêm.",
      });
    }

    // 4. Lấy OrderIndex tiếp theo
    const qMaxOrder =
      "SELECT COALESCE(MAX(OrderIndex), 0) as maxPos FROM CourseChapters WHERE ClassId = ?";
    const maxRes = await query(qMaxOrder, [classId]);
    let currentOrder = maxRes[0].maxPos;

    let totalChapters = 0;
    let totalLessons = 0;

    // =========================================================
    // 5. BẮT ĐẦU IMPORT (VÒNG LẶP CHƯƠNG)
    // =========================================================
    for (const mChapter of chaptersToImport) {
      currentOrder++;
      totalChapters++;

      // A. Tạo Chương mới cho Lớp (Clone từ Master)
      const qInsertChap = `
        INSERT INTO CourseChapters (CourseId, ClassId, Title, Description, OrderIndex) 
        VALUES (NULL, ?, ?, ?, ?)
      `;
      const resChap = await query(qInsertChap, [
        classId,
        mChapter.Title,
        mChapter.Description,
        currentOrder,
      ]);
      const newChapterId = resChap.insertId; // ID chương mới tạo

      // B. Lấy danh sách Bài học Mẫu thuộc chương này
      const sqlGetMasterLessons = `
        SELECT * FROM Lessons 
        WHERE ChapterId = ? AND ClassId IS NULL 
        ORDER BY OrderIndex ASC
      `;
      const masterLessons = await query(sqlGetMasterLessons, [
        mChapter.CourseChapterId,
      ]);

      // =========================================================
      // C. VÒNG LẶP BÀI HỌC (Để copy Bài học + Tài liệu)
      // =========================================================
      for (const mLesson of masterLessons) {
        totalLessons++;

        // C1. Tạo Bài học mới cho Lớp
        const qInsertLesson = `
            INSERT INTO Lessons (ChapterId, ClassId, Title, Description, VideoUrl, OrderIndex, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const resLesson = await query(qInsertLesson, [
          newChapterId, // Gắn vào chương mới
          classId, // Gắn vào lớp
          mLesson.Title,
          mLesson.Description,
          mLesson.VideoUrl,
          mLesson.OrderIndex,
        ]);

        const newLessonId = resLesson.insertId; // ID bài học mới tạo

        // C2. COPY TÀI LIỆU & BÀI TẬP (LessonMaterials)
        // Copy từ bài cũ (mLesson.LessonId) sang bài mới (newLessonId)
        const sqlCopyMaterials = `
            INSERT INTO LessonMaterials (LessonId, UploadedBy, Title, FileUrl, FileType, Category, CreatedAt)
            SELECT 
                ? AS LessonId,      -- ID bài học mới
                UploadedBy,         -- Giữ nguyên người upload (hoặc set NULL nếu muốn)
                Title, 
                FileUrl, 
                FileType, 
                Category, 
                NOW()
            FROM LessonMaterials
            WHERE LessonId = ?      -- ID bài học mẫu
        `;

        await query(sqlCopyMaterials, [newLessonId, mLesson.LessonId]);
      }
    }

    await query("COMMIT");

    return res.status(200).json({
      message: `Đồng bộ thành công! Đã thêm ${totalChapters} chương và ${totalLessons} bài học (kèm tài liệu).`,
    });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi Import Full Course:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
