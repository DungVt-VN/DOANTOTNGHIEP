import { db } from "../../db.js";
import * as XLSX from "xlsx";
import util from "util";

// Helper query function
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

const queryAsync = util.promisify(db.query).bind(db);

// --- 1. LẤY CÁC LỚP ĐANG TUYỂN SINH ---
export const getRecruitingClasses = async (req, res) => {
  try {
    const q = `
      SELECT 
        c.ClassId, 
        c.ClassName, 
        c.Days, 
        c.StartTime, 
        c.EndTime, 
        c.MaxStudents, 
        c.TuitionFee, 
        c.Status,
        t.FullName as TeacherName, 
        (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = c.ClassId) as CurrentStudents
      FROM Classes c
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      WHERE c.Status = 'Recruiting'
      ORDER BY c.ClassId DESC 
    `;

    const classes = await query(q);
    return res.status(200).json(classes);
  } catch (error) {
    console.error("Get Recruiting Classes Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// --- 2. LẤY TẤT CẢ GHI DANH ---
export const getAllEnrollments = async (req, res) => {
  try {
    const q = `
      SELECT 
        cs.EnrollmentId,
        cs.ClassId,
        cs.StudentId,
        c.ClassName,
        c.TuitionFee,
        s.FullName,
        s.StudentCode
      FROM Class_Student cs
      JOIN Classes c ON cs.ClassId = c.ClassId
      JOIN Students s ON cs.StudentId = s.StudentId
      ORDER BY c.ClassId DESC
    `;

    const data = await query(q);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi lấy dữ liệu ghi danh", error });
  }
};

// --- 3. LẤY TẤT CẢ LỚP HỌC ---
export const getAllClasses = async (req, res) => {
  try {
    const queryStr = `
      SELECT ClassId, ClassName, TuitionFee, Status 
      FROM Classes 
      WHERE Status IN ('Active','Finished','Cancelled', 'Upcoming', 'Recruiting' )
      ORDER BY ClassId DESC 
    `;
    const classes = await queryAsync(queryStr);
    return res.status(200).json(classes);
  } catch (err) {
    console.error("Lỗi SQL:", err);
    return res.status(500).json("Lỗi lấy danh sách lớp.");
  }
};

// --- 4. LẤY DANH SÁCH LỚP CỦA KHÓA HỌC CỤ THỂ ---
export const getClassCourse = async (req, res) => {
  const courseId = req.params.courseId;

  const q = `
      SELECT 
        cl.*, 
        t.FullName, 
        t.TeacherCode,
        cr.RoomName,
        cr.Location as RoomLocation
      FROM Classes cl
      LEFT JOIN Teachers t ON cl.TeacherId = t.TeacherId
      LEFT JOIN Classrooms cr ON cl.RoomId = cr.RoomId
      WHERE cl.CourseId = ?
      ORDER BY cl.StartDate DESC
    `;

  try {
    const data = await query(q, [courseId]);
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

export const getClassCourseStudent = async (req, res) => {
  const courseId = req.params.courseId;

  // Giả sử bạn lấy UserId từ token đăng nhập (middleware authentication)
  // Nếu chưa đăng nhập (khách vãng lai), giá trị này có thể là null
  const currentUserId = req.query.userId || null;
  const q = `
      SELECT 
        cl.ClassId,
        cl.ClassName,
        cl.StartDate,
        cl.EndDate,
        cl.Days,
        cl.StartTime,
        cl.EndTime,
        cl.MaxStudents,
        cl.TuitionFee,
        cl.Status,
        
        -- Thông tin giáo viên
        t.FullName AS TeacherName, 
        t.TeacherCode,
        
        -- Thông tin phòng học
        cr.RoomName,
        cr.Location as RoomLocation,

        -- 1. Đếm số lượng học sinh đã đăng ký (Enrolled)
        (
          SELECT COUNT(*) 
          FROM Class_Student cs 
          WHERE cs.ClassId = cl.ClassId
        ) AS Enrolled,

        -- 2. Kiểm tra xem User hiện tại đã đăng ký lớp này chưa (IsRegistered)
        -- Trả về 1 nếu đã đăng ký, 0 nếu chưa
        (
          SELECT COUNT(*)
          FROM Class_Student cs
          JOIN Students s ON cs.StudentId = s.StudentId
          WHERE cs.ClassId = cl.ClassId 
          AND s.UserId = ? 
        ) AS IsRegistered

      FROM Classes cl
      LEFT JOIN Teachers t ON cl.TeacherId = t.TeacherId
      LEFT JOIN Classrooms cr ON cl.RoomId = cr.RoomId
      WHERE cl.CourseId = ? AND cl.Status != 'Finished' -- Chỉ lấy lớp chưa kết thúc
      ORDER BY cl.StartDate ASC
    `;

  try {
    // Truyền tham số theo đúng thứ tự: [currentUserId, courseId]
    const data = await query(q, [currentUserId, courseId]);

    // Convert IsRegistered từ số (1/0) sang boolean (true/false) cho frontend dễ dùng
    const formattedData = data.map((cls) => ({
      ...cls,
      IsRegistered: cls.IsRegistered > 0,
    }));

    return res.status(200).json(formattedData);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

// --- 5. XÓA LỚP HỌC ---
export const deleteClass = async (req, res) => {
  const classId = req.params.classId;
  const q = `DELETE FROM Classes WHERE ClassId = ?`;

  try {
    const result = await query(q, [classId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message:
        "Không thể xóa lớp học này vì đã có dữ liệu liên quan (học viên, lịch học...).",
      details: err,
    });
  }
};

// --- 6. THÊM LỚP HỌC MỚI ---
export const addClassCourse = async (req, res) => {
  const {
    ClassName,
    TeacherId,
    RoomId,
    TuitionFee,
    StartDate,
    EndDate,
    Status,
    Days,
    StartTime,
    EndTime,
  } = req.body;

  const { courseId } = req.params;

  try {
    const qCheck = `SELECT COUNT(*) AS count FROM Classes WHERE ClassName = ? AND CourseId = ?`;
    const checkRes = await query(qCheck, [ClassName, courseId]);

    if (checkRes[0].count > 0) {
      return res
        .status(400)
        .json({ message: "Tên lớp học đã tồn tại trong khóa học này" });
    }

    const daysValue = Array.isArray(Days) ? Days.join(",") : Days || null;

    const qInsert = `
      INSERT INTO Classes 
      (CourseId, TeacherId, ClassName, RoomId, TuitionFee, StartDate, EndDate, Status, Days, StartTime, EndTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(qInsert, [
      courseId,
      TeacherId || null,
      ClassName,
      RoomId || null,
      TuitionFee || 0,
      StartDate || null,
      EndDate || null,
      Status || "Recruiting",
      daysValue,
      StartTime || null,
      EndTime || null,
    ]);

    return res.status(201).json({
      message: "Class added successfully",
      classId: result.insertId,
    });
  } catch (err) {
    console.error("Error adding class:", err);
    return res.status(500).json({ error: "Database error", details: err });
  }
};

// --- 7. CẬP NHẬT LỚP HỌC ---
export const updateClass = async (req, res) => {
  const classId = req.params.id;
  const {
    ClassName,
    StartDate,
    EndDate,
    Days,
    StartTime,
    EndTime,
    RoomId,
    TeacherId,
    TuitionFee,
    Status,
  } = req.body;

  try {
    const formattedDays = Array.isArray(Days) ? Days.join(",") : Days;

    const q = `
      UPDATE Classes 
      SET ClassName=?, StartDate=?, EndDate=?, Days=?, StartTime=?, EndTime=?, RoomId=?, TeacherId=?, TuitionFee=?, Status=?
      WHERE ClassId = ?
    `;

    const values = [
      ClassName,
      StartDate,
      EndDate,
      formattedDays,
      StartTime,
      EndTime,
      RoomId,
      TeacherId,
      TuitionFee,
      Status,
      classId,
    ];

    await queryAsync(q, values);
    return res.status(200).json("Cập nhật lớp học thành công!");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi khi cập nhật lớp học.");
  }
};

// --- 8. IMPORT HỌC VIÊN TỪ EXCEL (FIX LỖI IsPaid) ---
export const addClassStudent = async (req, res) => {
  const classId = req.params.classId;

  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng upload file Excel" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Chuẩn hóa key (StudentCode hoặc MaSinhVien)
    const studentCodes = data
      .map(
        (row) =>
          row.StudentCode?.toString().trim() ||
          row.MaSinhVien?.toString().trim(),
      )
      .filter((code) => code);

    if (studentCodes.length === 0) {
      return res
        .status(400)
        .json({ message: "File Excel không chứa mã sinh viên hợp lệ." });
    }

    // Kiểm tra sĩ số
    const qClassInfo = `
      SELECT 
        c.MaxStudents, 
        (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = c.ClassId) as CurrentCount 
      FROM Classes c 
      WHERE c.ClassId = ?
    `;
    const classInfo = await query(qClassInfo, [classId]);

    if (classInfo.length === 0)
      return res.status(404).json({ message: "Lớp học không tồn tại." });

    const { MaxStudents, CurrentCount } = classInfo[0];
    const availableSlots = MaxStudents - CurrentCount;

    if (availableSlots <= 0) {
      return res.status(409).json({
        message: `Lớp đã đầy (Sĩ số: ${CurrentCount}/${MaxStudents}).`,
      });
    }

    // Tìm ID sinh viên
    const qGetIds = `SELECT StudentId, StudentCode FROM Students WHERE StudentCode IN (?)`;
    const studentsFound = await query(qGetIds, [studentCodes]);

    const studentMap = new Map();
    studentsFound.forEach((s) => studentMap.set(s.StudentId, s.StudentCode));

    const foundCodes = studentsFound.map((s) => s.StudentCode);
    const notFoundErrors = studentCodes
      .filter((code) => !foundCodes.includes(code))
      .map((code) => ({ studentCode: code, message: "Mã không tồn tại" }));

    if (studentsFound.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy mã sinh viên hợp lệ.",
        errors: notFoundErrors,
      });
    }

    const foundIds = studentsFound.map((s) => s.StudentId);

    // Kiểm tra đã tồn tại trong lớp chưa
    const qCheckExist = `SELECT StudentId FROM Class_Student WHERE ClassId = ? AND StudentId IN (?)`;
    const existingRows = await query(qCheckExist, [classId, foundIds]);
    const existingIds = existingRows.map((row) => row.StudentId);

    const duplicateErrors = existingIds.map((id) => ({
      studentCode: studentMap.get(id),
      message: "Đã có trong lớp",
    }));

    // Lọc ra các ID cần thêm
    const idsToInsert = foundIds.filter((id) => !existingIds.includes(id));

    if (idsToInsert.length > availableSlots) {
      return res.status(409).json({
        message: `Không đủ chỗ. Còn ${availableSlots}, cần thêm ${idsToInsert.length}.`,
      });
    }

    if (idsToInsert.length === 0) {
      return res.status(200).json({
        message: "Không có dữ liệu mới.",
        errors: [...notFoundErrors, ...duplicateErrors],
      });
    }

    // FIX: INSERT BỎ CỘT IsPaid
    const values = idsToInsert.map((studentId) => [classId, studentId]);
    const qInsert = `INSERT INTO Class_Student (ClassId, StudentId) VALUES ?`;
    await query(qInsert, [values]);

    return res.status(200).json({
      message: `Đã thêm thành công ${idsToInsert.length} sinh viên.`,
      successCount: idsToInsert.length,
      errors: [...notFoundErrors, ...duplicateErrors],
    });
  } catch (error) {
    console.error("Import Excel Error:", error);
    return res.status(500).json({
      message: "Lỗi server khi xử lý file Excel",
      error: error.message,
    });
  }
};

// --- 9. THÊM 1 SINH VIÊN VÀO LỚP (FIX LỖI IsPaid) ---
export const addSingleStudentToClass = async (req, res) => {
  const { studentCode } = req.body;
  const { classId } = req.params;

  if (!studentCode)
    return res.status(400).json({ message: "Thiếu mã sinh viên" });

  try {
    // Kiểm tra sĩ số
    const qClassInfo = `
      SELECT c.MaxStudents, (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = c.ClassId) as CurrentCount 
      FROM Classes c WHERE c.ClassId = ?
    `;
    const classResult = await query(qClassInfo, [classId]);

    if (classResult.length === 0)
      return res.status(404).json({ message: "Lớp học không tồn tại" });

    const { MaxStudents, CurrentCount } = classResult[0];

    if (CurrentCount >= MaxStudents) {
      return res
        .status(409)
        .json({ message: `Lớp đã đầy (${CurrentCount}/${MaxStudents}).` });
    }

    // Tìm sinh viên
    const qFind = "SELECT StudentId FROM Students WHERE StudentCode = ?";
    const students = await query(qFind, [studentCode]);

    if (students.length === 0)
      return res.status(404).json({ message: "Mã sinh viên không tồn tại" });
    const studentId = students[0].StudentId;

    // Kiểm tra trùng
    const qCheck =
      "SELECT StudentId FROM Class_Student WHERE ClassId = ? AND StudentId = ?";
    const exists = await query(qCheck, [classId, studentId]);

    if (exists.length > 0)
      return res
        .status(400)
        .json({ message: "Học viên này đã có trong lớp rồi" });

    // FIX: INSERT BỎ IsPaid
    const qInsert =
      "INSERT INTO Class_Student (ClassId, StudentId) VALUES (?, ?)";
    await query(qInsert, [classId, studentId]);

    return res.status(200).json({ message: "Thêm học viên thành công" });
  } catch (err) {
    console.error("Error adding single student:", err);
    return res.status(500).json({ message: "Lỗi Server", error: err });
  }
};

// --- 10. LẤY CHI TIẾT DANH SÁCH SINH VIÊN (DÙNG LEFT JOIN TuitionPayments) ---
export const getClassStudentsDetail = async (req, res) => {
  try {
    const classId = req.params.id || req.params.classId;

    const queryStr = `
      SELECT 
        s.StudentId, 
        s.StudentCode, 
        s.FullName, 
        s.PhoneNo,
        u.Email,
        -- LOGIC MỚI: Check bảng TuitionPayments
        IF(tp.PaymentId IS NOT NULL, 1, 0) as IsPaid,
        cs.EnrollmentDate as JoinDate,
        cs.IsLocked
      FROM Class_Student cs
      JOIN Students s ON cs.StudentId = s.StudentId
      LEFT JOIN Users u ON s.UserId = u.UserId
      -- Join để lấy trạng thái nộp tiền (chỉ lấy Completed)
      LEFT JOIN TuitionPayments tp ON cs.StudentId = tp.StudentId 
        AND cs.ClassId = tp.ClassId 
        AND tp.Status = 'Completed'
      WHERE cs.ClassId = ?
      ORDER BY s.StudentCode ASC
    `;

    const students = await queryAsync(queryStr, [classId]);
    return res.status(200).json(students);
  } catch (err) {
    console.error("Lỗi lấy danh sách học viên:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy chi tiết học viên" });
  }
};

// --- 11. CẬP NHẬT TRẠNG THÁI HỌC PHÍ (TÁC ĐỘNG BẢNG TuitionPayments) ---
export const updateTuitionStatus = async (req, res) => {
  const { classId, studentId } = req.params;
  const { isPaid } = req.body; // true/false

  try {
    if (isPaid) {
      // 1. Lấy mức học phí của lớp
      const classRes = await query(
        "SELECT TuitionFee FROM Classes WHERE ClassId = ?",
        [classId],
      );
      const amount = classRes[0]?.TuitionFee || 0;

      // 2. Thêm bản ghi đã nộp tiền
      const qInsert = `
        INSERT INTO TuitionPayments (StudentId, ClassId, Amount, Status, Note) 
        VALUES (?, ?, ?, 'Completed', 'Cập nhật thủ công')
        ON DUPLICATE KEY UPDATE Status = 'Completed', Amount = ?
      `;
      await query(qInsert, [studentId, classId, amount, amount]);
    } else {
      // 3. Nếu bỏ tick (chưa nộp) -> Xóa bản ghi trong bảng Payments
      const qDelete =
        "DELETE FROM TuitionPayments WHERE StudentId = ? AND ClassId = ?";
      await query(qDelete, [studentId, classId]);
    }
    return res.json({ message: "Cập nhật học phí thành công" });
  } catch (err) {
    console.error("Lỗi update học phí:", err);
    return res.status(500).json(err);
  }
};

// --- 12. XÓA HỌC VIÊN KHỎI LỚP ---
export const removeStudentFromClass = async (req, res) => {
  const { classId, studentId } = req.params;
  const q = `DELETE FROM Class_Student WHERE ClassId = ? AND StudentId = ?`;
  try {
    await query(q, [classId, studentId]);
    return res.json({ message: "Đã xóa học viên khỏi lớp" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// --- 13. LẤY CHI TIẾT TOÀN BỘ LỚP HỌC (INFO, CHAPTERS, LESSONS...) ---
export const getClassDetail = async (req, res) => {
  const classId = req.params.classId;

  try {
    // Thực hiện nhiều query song song
    const [
      classInfo,
      chapters,
      lessons,
      lessonMaterials,
      students,
      assignments,
    ] = await Promise.all([
      // 1. Thông tin lớp
      query(
        `
        SELECT c.*, co.CourseName, co.CourseImage, co.Subject,
               t.FullName as TeacherName, r.RoomName, r.Location
        FROM Classes c
        JOIN Courses co ON c.CourseId = co.CourseId
        LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
        LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
        WHERE c.ClassId = ?`,
        [classId],
      ),

      // 2. Chapters (Lấy từ Master Content theo CourseId của lớp)
      query(
        `
        SELECT cc.* FROM CourseChapters cc
        JOIN Classes c ON cc.CourseId = c.CourseId
        WHERE c.ClassId = ? 
        ORDER BY cc.OrderIndex ASC`,
        [classId],
      ),

      // 3. Lessons (Lấy các bài học riêng của lớp này)
      query(`SELECT * FROM Lessons WHERE ClassId = ? ORDER BY OrderIndex ASC`, [
        classId,
      ]),

      // 4. LessonMaterials (Lấy tài liệu thuộc các bài học của lớp)
      query(
        `
        SELECT d.* FROM LessonMaterials d
        JOIN Lessons l ON d.LessonId = l.LessonId
        WHERE l.ClassId = ?`,
        [classId],
      ),

      // 5. Students (Kèm trạng thái nộp tiền)
      query(
        `
        SELECT 
            s.StudentId, s.FullName, s.StudentCode, s.PhoneNo,
            IF(tp.PaymentId IS NOT NULL, 1, 0) as IsPaid, 
            cs.EnrollmentDate, cs.IsLocked
        FROM Class_Student cs
        JOIN Students s ON cs.StudentId = s.StudentId
        LEFT JOIN TuitionPayments tp ON cs.StudentId = tp.StudentId AND cs.ClassId = tp.ClassId AND tp.Status = 'Completed'
        WHERE cs.ClassId = ?`,
        [classId],
      ),

      // 6. Assignments
      query(
        `SELECT * FROM Assignments WHERE ClassId = ? ORDER BY DueDate DESC`,
        [classId],
      ),
    ]);

    if (!classInfo || classInfo.length === 0)
      return res.status(404).json({ message: "Không tìm thấy lớp học." });
    const info = classInfo[0];

    // --- MAP DỮ LIỆU ---

    // Map Chapters -> Curriculum
    const curriculum = chapters.map((ch) => ({
      id: ch.CourseChapterId,
      title: ch.Title,
      description: ch.Description,
      lessons: [],
    }));

    // Map Lessons vào Chapter tương ứng
    lessons.forEach((l) => {
      const chapterIndex = curriculum.findIndex((c) => c.id === l.ChapterId);
      if (chapterIndex !== -1) {
        curriculum[chapterIndex].lessons.push({
          id: `lesson-${l.LessonId}`,
          realId: l.LessonId,
          title: l.Title,
          type: "video",
          url: l.VideoUrl,
          order: l.OrderIndex,
        });
      }
    });

    // Map LessonMaterials vào Lesson
    lessonMaterials.forEach((d) => {
      const lesson = lessons.find((l) => l.LessonId === d.LessonId);
      if (lesson) {
        const chapterIndex = curriculum.findIndex(
          (c) => c.id === lesson.ChapterId,
        );
        if (chapterIndex !== -1) {
          curriculum[chapterIndex].lessons.push({
            id: `doc-${d.LessonMaterialId}`,
            realId: d.LessonMaterialId,
            title: d.Title,
            type: "doc",
            url: d.FileUrl,
            order: 999, // Để cuối
          });
        }
      }
    });

    // Tính Progress thời gian
    const today = new Date();
    const start = new Date(info.StartDate);
    const end = new Date(info.EndDate);
    let progress = 0;
    if (info.StartDate && info.EndDate) {
      if (today > end) progress = 100;
      else if (today > start)
        progress = Math.floor(((today - start) / (end - start)) * 100);
    }

    return res.status(200).json({
      ...info,
      StudentCount: students.length,
      LessonCount: lessons.length,
      Progress: progress,
      Chapters: curriculum,
      Students: students,
      Assignments: assignments,
    });
  } catch (error) {
    console.error("Lỗi get class detail:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const getClassDetailStudent = async (req, res) => {
  const classId = req.params.classId;
  const userId = req.query.userId;

  try {
    // --- BƯỚC 1: Kiểm tra quyền truy cập ---
    const qCheckStudent = `
      SELECT s.StudentId, cs.IsLocked 
      FROM Students s
      JOIN Class_Student cs ON s.StudentId = cs.StudentId
      WHERE s.UserId = ? AND cs.ClassId = ?
    `;
    const [studentRows] = await db
      .promise()
      .query(qCheckStudent, [userId, classId]);

    if (studentRows.length === 0) {
      return res.status(400).json({ message: "Bạn chưa đăng ký lớp học này." });
    }

    const studentId = studentRows[0].StudentId;
    const isLocked = studentRows[0].IsLocked;

    if (isLocked) {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa trong lớp này." });
    }

    // --- BƯỚC 2: Lấy dữ liệu chi tiết ---
    const [
      classInfoData,
      lessonsData,
      materialsData,
      assignmentsData,
      quizzesData,
      notificationsData,
      paymentData,
    ] = await Promise.all([
      // =================================================================================
      // 1. THÔNG TIN LỚP + COURSE + GIẢNG VIÊN (CHI TIẾT)
      // =================================================================================
      db.promise().query(
        `SELECT 
            c.*, 
            -- Thông tin khóa học
            co.CourseName, co.CourseImage, co.Subject,
            
            -- Thông tin Giảng viên (Chi tiết)
            t.TeacherId,
            t.FullName as TeacherName,
            t.Bio as TeacherBio,       -- <--- Thêm: Giới thiệu/Tiểu sử
            t.PhoneNo as TeacherPhone, -- <--- Thêm: SĐT liên hệ
            u.Email as TeacherEmail,   -- <--- Thêm: Email từ bảng Users
            u.Avatar as TeacherAvatar, -- <--- Thêm: Avatar từ bảng Users
            
            -- Thông tin phòng học
            r.RoomName, r.Location
         FROM Classes c
         JOIN Courses co ON c.CourseId = co.CourseId
         LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
         LEFT JOIN Users u ON t.UserId = u.UserId -- Join để lấy Avatar và Email
         LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
         WHERE c.ClassId = ?`,
        [classId],
      ),

      // 2. Lessons + Chapter Info
      db.promise().query(
        `SELECT 
            l.*, 
            cc.Title as ChapterTitle,
            cc.Description as ChapterDesc,
            cc.OrderIndex as ChapterOrder,
            IF(slp.IsCompleted = 1, 1, 0) as IsCompleted
         FROM Lessons l
         LEFT JOIN CourseChapters cc ON l.ChapterId = cc.CourseChapterId
         LEFT JOIN Student_Lesson_Progress slp 
            ON l.LessonId = slp.LessonId AND slp.StudentId = ?
         WHERE l.ClassId = ? 
         ORDER BY cc.OrderIndex ASC, l.OrderIndex ASC`,
        [studentId, classId],
      ),

      // 3. LessonMaterials
      db.promise().query(
        `SELECT lm.* FROM LessonMaterials lm
         JOIN Lessons l ON lm.LessonId = l.LessonId
         WHERE l.ClassId = ?`,
        [classId],
      ),

      // 4. Assignments
      db.promise().query(
        `SELECT a.*, 
                s.Status as SubmissionStatus, 
                s.Score as StudentScore,
                s.SubmissionDate,
                s.TeacherComment
         FROM Assignments a
         LEFT JOIN Submissions s 
            ON a.AssignmentId = s.AssignmentId AND s.StudentId = ?
         WHERE a.ClassId = ? 
         ORDER BY a.DueDate DESC`,
        [studentId, classId],
      ),

      // 5. Quizzes
      db.promise().query(
        `SELECT q.QuizId, q.Title, q.DurationMinutes, q.StartTime, q.EndTime, q.Status,
                qr.Score as StudentScore, qr.CorrectCount, qr.TotalQuestions, qr.CompletedAt
         FROM Quizzes q
         LEFT JOIN QuizResults qr 
            ON q.QuizId = qr.QuizId AND qr.StudentId = ?
         WHERE q.ClassId = ?
         ORDER BY q.StartTime DESC`,
        [studentId, classId],
      ),

      // 6. Notifications (10 tin mới nhất)
      db.promise().query(
        `SELECT NotiId, Title, Message, Type, IsRead, CreatedAt 
         FROM Notifications 
         WHERE UserId = ? 
         ORDER BY CreatedAt DESC 
         LIMIT 10`,
        [userId],
      ),

      // 7. Payment Status
      db.promise().query(
        `SELECT Status FROM TuitionPayments 
         WHERE ClassId = ? AND StudentId = ? AND Status = 'Completed'`,
        [classId, studentId],
      ),
    ]);

    // --- BƯỚC 3: Xử lý dữ liệu trả về ---
    const classInfo = classInfoData[0][0];
    if (!classInfo)
      return res.status(404).json({ message: "Lớp không tồn tại" });

    const lessonsRaw = lessonsData[0];
    const materials = materialsData[0];
    const assignments = assignmentsData[0];
    const quizzes = quizzesData[0];
    const notifications = notificationsData[0];
    const isPaid = paymentData[0].length > 0;

    // --- LOGIC NHÓM BÀI HỌC THEO CHƯƠNG ---
    const curriculumMap = new Map();

    lessonsRaw.forEach((lesson) => {
      const chId = lesson.ChapterId || "uncategorized";
      const chTitle = lesson.ChapterTitle || "Bài học chung";
      const chDesc = lesson.ChapterDesc || "";

      if (!curriculumMap.has(chId)) {
        curriculumMap.set(chId, {
          ChapterId: lesson.ChapterId,
          Title: chTitle,
          Description: chDesc,
          lessons: [],
        });
      }

      const lessonDocs = materials.filter(
        (m) => m.LessonId === lesson.LessonId,
      );

      curriculumMap.get(chId).lessons.push({
        LessonId: lesson.LessonId,
        Title: lesson.Title,
        Description: lesson.Description,
        Type: lesson.VideoUrl ? "video" : "document",
        VideoUrl: lesson.VideoUrl,
        Duration: "00:00",
        IsCompleted: lesson.IsCompleted === 1,
        Materials: lessonDocs,
      });
    });

    const curriculum = Array.from(curriculumMap.values());

    // --- TÍNH TOÁN TIẾN ĐỘ ---
    const totalLessons = lessonsRaw.length;
    const completedLessons = lessonsRaw.filter(
      (l) => l.IsCompleted === 1,
    ).length;
    const learningProgress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    const today = new Date();
    const start = new Date(classInfo.StartDate);
    const end = new Date(classInfo.EndDate);
    let timeProgress = 0;

    if (classInfo.StartDate && classInfo.EndDate) {
      if (today > end) timeProgress = 100;
      else if (today > start)
        timeProgress = Math.floor(((today - start) / (end - start)) * 100);
    }

    // --- TRẢ VỀ KẾT QUẢ ---
    return res.status(200).json({
      ...classInfo, // Sẽ tự động bao gồm: TeacherBio, TeacherPhone, TeacherEmail, TeacherAvatar
      IsPaid: isPaid,
      LearningProgress: learningProgress,
      TimeProgress: timeProgress,
      LessonCount: totalLessons,
      Chapters: curriculum,
      Assignments: assignments,
      Quizzes: quizzes,
      Notifications: notifications,
    });
  } catch (error) {
    console.error("Lỗi get class detail:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// --- 14. LẤY HỌC VIÊN ĐỂ ĐIỂM DANH/CHẤM BÀI ---
export const getClassStudent = async (req, res) => {
  const { courseId, classId } = req.params;
  const q = `
      SELECT s.FullName, s.StudentCode, s.StudentId, s.UserId, cl.ClassName, cl.ClassId
      FROM Class_Student cs
      JOIN Students s ON cs.StudentId = s.StudentId
      JOIN Classes cl ON cs.ClassId = cl.ClassId
      WHERE cl.CourseId = ? AND cl.ClassId = ?
    `;
  try {
    const data = await query(q, [courseId, classId]);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
};

export const getClassStudentByClassCode = async (req, res) => {
  const { courseId, classCode } = req.params;
  const q = `
      SELECT s.FullName, s.StudentCode, s.StudentId, s.UserId, cl.ClassName, cl.ClassId
      FROM Class_Student cs
      JOIN Students s ON cs.StudentId = s.StudentId
      JOIN Classes cl ON cs.ClassId = cl.ClassId
      WHERE cl.CourseId = ? AND cl.ClassName = ? 
    `;
  try {
    const data = await query(q, [courseId, classCode]);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
};

// --- 15. LẤY LỊCH HỌC THEO THÁNG ---
export const getAllClassesByMonth = async (req, res) => {
  try {
    let { month, year, teacherId, roomId } = req.query;
    if (!month || !year)
      return res.status(400).json("Thiếu thông tin tháng/năm.");
    const firstDayOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;

    let q = `
      SELECT c.*, t.FullName as TeacherName, t.TeacherCode, r.RoomName
      FROM Classes c
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId 
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      WHERE c.StartDate <= LAST_DAY(?) AND c.EndDate >= ?
    `;
    const queryParams = [firstDayOfMonth, firstDayOfMonth];
    if (teacherId && teacherId !== "null") {
      q += " AND c.TeacherId = ?";
      queryParams.push(teacherId);
    }
    if (roomId && roomId !== "null") {
      q += " AND c.RoomId = ?";
      queryParams.push(roomId);
    }
    q += " ORDER BY c.StartDate ASC";

    const data = await query(q, queryParams);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error);
  }
};

// --- 16. LẤY LỊCH GIẢNG DẠY CỦA GIÁO VIÊN THEO TUẦN ---
export const getTeacherScheduleByWeek = async (req, res) => {
  try {
    let { teacherId, startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json("Thiếu ngày.");

    let q = `
      SELECT c.ClassId, c.ClassName, c.Days, c.StartTime, c.EndTime,
             c.StartDate as ClassStartDate, c.EndDate as ClassEndDate,
             t.FullName as TeacherName, r.RoomName
      FROM Classes c
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      WHERE c.StartDate <= ? AND c.EndDate >= ?
    `;
    const queryParams = [endDate, startDate];
    if (teacherId && teacherId !== "null") {
      q += " AND c.TeacherId = ?";
      queryParams.push(teacherId);
    }
    q += " ORDER BY c.StartTime ASC";

    const data = await query(q, queryParams);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getStudentScheduleByWeek = async (req, res) => {
  try {
    // 1. Lấy studentId thay vì teacherId
    let { studentId, startDate, endDate } = req.query;

    // 2. Validate dữ liệu đầu vào
    if (!studentId || !startDate || !endDate) {
      return res
        .status(400)
        .json({
          message: "Thiếu thông tin (studentId, ngày bắt đầu, ngày kết thúc).",
        });
    }
    let q = `
      SELECT 
        c.ClassId, 
        c.ClassName, 
        c.Days, 
        c.StartTime, 
        c.EndTime,
        c.StartDate as ClassStartDate, 
        c.EndDate as ClassEndDate,
        t.FullName as TeacherName, 
        r.RoomName,
        r.Location,
        co.CourseName,
        co.CourseImage
      FROM Classes c
      JOIN Class_Student cs ON c.ClassId = cs.ClassId
      JOIN Courses co ON c.CourseId = co.CourseId
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      WHERE 
        cs.StudentId = ? 
        AND c.StartDate <= ? 
        AND c.EndDate >= ?
        AND cs.IsLocked = 0
        AND c.Status = 'Active'
      ORDER BY c.StartTime ASC
    `;

    // 4. Thực thi Query
    // Thứ tự tham số phải khớp với dấu ? trong câu lệnh SQL
    const queryParams = [studentId, endDate, startDate];

    const data = await query(q, queryParams);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi lấy lịch học sinh:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 17. API HỖ TRỢ XẾP LỊCH ---
export const getActiveRooms = async (req, res) => {
  try {
    const rooms = await queryAsync(
      "SELECT RoomId, RoomName, Capacity FROM Classrooms WHERE Status = 'Active'",
    );
    return res.status(200).json(rooms);
  } catch (err) {
    return res.status(500).json("Lỗi server.");
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await queryAsync(
      "SELECT RoomId, RoomName, Capacity FROM Classrooms",
    );
    return res.status(200).json(rooms);
  } catch (err) {
    return res.status(500).json("Lỗi server.");
  }
};

export const checkScheduleAvailability = async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, days, excludeClassId } =
      req.body;
    if (!startDate || !endDate || !startTime || !endTime || !days)
      return res.status(200).json({ teachers: [], rooms: [] });

    const [allTeachers, allRooms] = await Promise.all([
      queryAsync("SELECT TeacherId, FullName, TeacherCode FROM Teachers"),
      queryAsync(
        "SELECT RoomId, RoomName, Capacity FROM Classrooms WHERE Status = 'Active'",
      ),
    ]);

    let checkQuery = `
      SELECT TeacherId, RoomId, Days FROM Classes 
      WHERE Status IN ('Active', 'Upcoming', 'Recruiting')
      AND (StartDate <= ? AND EndDate >= ?) AND (StartTime < ? AND EndTime > ?)
    `;
    const params = [endDate, startDate, endTime, startTime];
    if (excludeClassId) {
      checkQuery += " AND ClassId != ?";
      params.push(Number(excludeClassId));
    }

    const conflictingClasses = await queryAsync(checkQuery, params);
    const busyTeacherIds = new Set();
    const busyRoomIds = new Set();
    const reqDays = Array.isArray(days) ? days : days.split(",");

    conflictingClasses.forEach((cls) => {
      if (!cls.Days) return;
      const classDays = cls.Days.split(",");
      if (reqDays.some((day) => classDays.includes(day.toString()))) {
        if (cls.TeacherId) busyTeacherIds.add(cls.TeacherId);
        if (cls.RoomId) busyRoomIds.add(cls.RoomId);
      }
    });

    return res.status(200).json({
      teachers: allTeachers.map((t) => ({
        ...t,
        isBusy: busyTeacherIds.has(t.TeacherId),
      })),
      rooms: allRooms.map((r) => ({ ...r, isBusy: busyRoomIds.has(r.RoomId) })),
    });
  } catch (err) {
    return res.status(500).json("Lỗi server.");
  }
};

export const getStudentClasses = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json("Thiếu thông tin UserId.");
  }

  try {
    // --- BƯỚC 1: Lấy StudentId từ UserId ---
    const qGetStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const [studentRows] = await db.promise().query(qGetStudent, [userId]);

    // Nếu không tìm thấy dòng nào -> Tài khoản này chưa là Học sinh
    if (studentRows.length === 0) {
      return res
        .status(404)
        .json("Không tìm thấy hồ sơ học sinh liên kết với tài khoản này.");
    }

    const studentId = studentRows[0].StudentId;

    // --- BƯỚC 2: Lấy danh sách lớp theo StudentId ---
    const qGetClasses = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.Days,
        c.StartTime,
        c.EndTime,
        c.Status,
        c.StartDate,
        c.EndDate,
        c.TuitionFee,
        
        -- Thông tin khóa học
        co.CourseName,
        co.Subject,
        
        -- Thông tin giáo viên
        t.FullName AS TeacherName,
        
        -- Thông tin phòng học
        r.RoomName,
        r.Location AS RoomLocation,

        -- Thông tin đăng ký (ngày đăng ký)
        cs.EnrollmentDate
      FROM Classes c
      JOIN Class_Student cs ON c.ClassId = cs.ClassId
      JOIN Courses co ON c.CourseId = co.CourseId
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      
      WHERE cs.StudentId = ? 
      ORDER BY c.Status ASC, c.StartDate DESC
    `;

    const [rows] = await db.promise().query(qGetClasses, [studentId]);

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi lấy lớp của sinh viên:", err);
    return res.status(500).json(err);
  }
};

export const getAvailableClasses = async (req, res) => {
  const studentId = req.user.studentId;

  try {
    const q = `
        SELECT 
            c.ClassId, 
            c.ClassName, 
            c.Days, 
            c.StartTime, 
            c.EndTime, 
            c.StartDate,
            c.TuitionFee, 
            c.MaxStudents,
            c.Status,
            co.Subject,
            t.FullName AS TeacherName,
            r.RoomName,
            (SELECT COUNT(*) FROM Class_Student WHERE ClassId = c.ClassId) AS Enrolled
        FROM Classes c
        JOIN Courses co ON c.CourseId = co.CourseId
        LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
        LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
        WHERE c.Status IN ('Recruiting', 'Upcoming') 
        AND c.ClassId NOT IN (SELECT ClassId FROM Class_Student WHERE StudentId = ?)
        ORDER BY c.StartDate ASC
    `;

    const [rows] = await db.promise().query(q, [studentId]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

// --- Đăng ký lớp học ---
export const registerClass = async (req, res) => {
  // 1. Lấy classId và userId từ request body
  const { classId, userId } = req.body;

  if (!classId || !userId) {
    return res.status(400).json("Thiếu thông tin ClassId hoặc UserId");
  }

  try {
    // 2. LẤY STUDENT ID TỪ USER ID
    // Cần bước này vì bảng Class_Student lưu StudentId chứ không phải UserId
    const qGetStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const [studentRows] = await db.promise().query(qGetStudent, [userId]);

    if (studentRows.length === 0) {
      return res.status(403).json("Người dùng này chưa có hồ sơ học sinh.");
    }

    const studentId = studentRows[0].StudentId;

    // 3. CHECK LỚP TỒN TẠI & SĨ SỐ
    const qCheckClass = `
        SELECT 
            MaxStudents, 
            Status,
            (SELECT COUNT(*) FROM Class_Student WHERE ClassId = ?) as Enrolled 
        FROM Classes 
        WHERE ClassId = ?
    `;
    const [classInfo] = await db
      .promise()
      .query(qCheckClass, [classId, classId]);

    if (classInfo.length === 0) {
      return res.status(404).json("Lớp học không tồn tại");
    }

    const currentClass = classInfo[0];

    // Kiểm tra sĩ số
    if (currentClass.Enrolled >= currentClass.MaxStudents) {
      return res.status(400).json("Lớp đã đủ sĩ số");
    }

    // (Tùy chọn) Kiểm tra trạng thái lớp có cho phép đăng ký không
    if (
      currentClass.Status !== "Recruiting" &&
      currentClass.Status !== "Upcoming"
    ) {
      return res.status(400).json("Lớp học không trong thời gian tuyển sinh");
    }

    // 4. CHECK ĐÃ ĐĂNG KÝ CHƯA
    const qExist =
      "SELECT * FROM Class_Student WHERE ClassId = ? AND StudentId = ?";
    const [exist] = await db.promise().query(qExist, [classId, studentId]);

    if (exist.length > 0) {
      return res.status(400).json("Bạn đã đăng ký lớp này rồi");
    }

    // 5. INSERT VÀO BẢNG CLASS_STUDENT
    const qInsert =
      "INSERT INTO Class_Student (ClassId, StudentId) VALUES (?, ?)";
    await db.promise().query(qInsert, [classId, studentId]);

    return res.status(200).json("Đăng ký thành công!");
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

export const getClassesForDistribution = async (req, res) => {
  const { courseId } = req.query;

  // Validate đầu vào
  if (!courseId) {
    return res.status(400).json({ message: "Thiếu tham số courseId" });
  }

  try {
    const sql = `
      SELECT 
        C.ClassId, 
        C.ClassName,
        -- Subquery đếm số học sinh trong lớp để hiển thị cho trực quan
        (SELECT COUNT(*) FROM Class_Student CS WHERE CS.ClassId = C.ClassId) as StudentCount
      FROM Classes C
      WHERE C.CourseId = ? 
      -- Chỉ lấy các lớp có thể thi (đang học hoặc sắp mở)
      AND C.Status IN ('Active', 'Upcoming', 'Recruiting')
      ORDER BY C.ClassName ASC
    `;

    const data = await query(sql, [courseId]);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi getClassesForDistribution:", err);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ", error: err });
  }
};
