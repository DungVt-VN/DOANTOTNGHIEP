import { db } from "../../db.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";

// --- HELPER: QUERY DB (Promisify) ---
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// --- HELPER: UPLOAD CLOUDINARY ---
const uploadToCloudinary = async (filePath, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      filePath,
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

// ==================== TEACHER: QUẢN LÝ BÀI TẬP ====================

// 1. Lấy danh sách bài tập theo Lớp
export const getAssignmentsByClass = async (req, res) => {
  const classId = req.params.classId;
  const { search } = req.query;

  try {
    let sql = `
      SELECT 
        a.AssignmentId as id,
        a.Title as title,
        a.Type as type,
        a.Description as description,
        a.DueDate as dueDate,
        a.Status as status,
        a.CreatedAt,
        a.QuizId, -- Thêm cột này
        -- Đếm số lượng đã nộp
        (SELECT COUNT(*) FROM Submissions s WHERE s.AssignmentId = a.AssignmentId) as submitted,
        -- Đếm tổng số học sinh trong lớp
        (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = a.ClassId) as total
      FROM Assignments a
      WHERE a.ClassId = ?
    `;

    const params = [classId];

    if (search) {
      sql += " AND a.Title LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY a.CreatedAt DESC";

    const data = await query(sql, params);
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// 2. Tạo bài tập thường (Homework/Essay - Có thể có file đính kèm)
export const addAssignment = async (req, res) => {
  const { title, description, dueDate, classId, type, status } = req.body;
  const file = req.file;

  if (!classId || !title || !dueDate) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  // Xử lý upload file nếu có
  let fileUrl = null;
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(
        file.path,
        "Assignments/Materials"
      );
      fileUrl = uploadResult.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.error("Upload failed", e);
    }
  }

  // Format Date
  const formattedDueDate = new Date(dueDate)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    // Lưu ý: Nếu database chưa có cột FileUrl trong Assignments thì bạn nên thêm vào hoặc lưu vào LessonMaterials
    // Ở đây giả sử bạn chấp nhận lưu link vào Description hoặc cột FileUrl (nếu có)
    // Tạm thời mình nối link vào Description nếu chưa có cột FileUrl
    let finalDesc = description;
    if (fileUrl) finalDesc += `\n\n[Tài liệu đính kèm]: ${fileUrl}`;

    const q = `
      INSERT INTO Assignments 
      (Title, Description, DueDate, ClassId, Type, Status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(q, [
      title,
      finalDesc, // Dùng description có kèm link
      formattedDueDate,
      classId,
      type || "homework",
      status || "active",
    ]);

    const newAssignment = {
      id: result.insertId,
      title,
      description: finalDesc,
      dueDate,
      type: type || "homework",
      status: status || "active",
      submitted: 0,
      total: 0,
    };

    return res.status(201).json({
      message: "Tạo bài tập thành công",
      data: newAssignment,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

// 3. Cập nhật bài tập
export const updateAssignment = async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const { title, description, dueDate, type, status, quizId } = req.body;
  const file = req.file;

  const formattedDueDate = new Date(dueDate)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  let finalDesc = description;
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(
        file.path,
        "Assignments/Materials"
      );
      const fileUrl = uploadResult.secure_url;
      finalDesc += `\n\n[Tài liệu đính kèm mới]: ${fileUrl}`;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const q = `
      UPDATE Assignments 
      SET Title=?, Description=?, DueDate=?, Type=?, Status=?, QuizId=? 
      WHERE AssignmentId=?
    `;
    await query(q, [
      title,
      finalDesc,
      formattedDueDate,
      type,
      status,
      quizId || null, // Cập nhật quizId nếu có
      assignmentId,
    ]);

    return res.json({ message: "Cập nhật bài tập thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

// 4. Xóa bài tập
export const deleteAssignment = async (req, res) => {
  const assignmentId = req.params.assignmentId;
  try {
    const q = "DELETE FROM Assignments WHERE AssignmentId = ?";
    await query(q, [assignmentId]);
    return res.json({ message: "Đã xóa bài tập" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// --- API LẤY DANH SÁCH QUIZ TỪ NGÂN HÀNG (Cho modal chọn đề) ---
export const getQuizzes = async (req, res) => {
  const { courseId, type } = req.query;
  // type='master' nghĩa là lấy đề gốc trong ngân hàng (không thuộc lớp nào cụ thể hoặc thuộc khóa học chung)

  try {
    let sql = `
        SELECT 
            Q.QuizId, Q.Title, Q.DurationMinutes, 
            COUNT(QQM.QuestionId) as QuestionCount 
        FROM Quizzes Q
        LEFT JOIN Quiz_Question_Mapping QQM ON Q.QuizId = QQM.QuizId
        WHERE Q.CourseId = ? AND Q.ClassId IS NULL -- Lấy đề gốc (ClassId = NULL)
        GROUP BY Q.QuizId
      `;
    const data = await query(sql, [courseId]);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi lấy danh sách đề thi" });
  }
};

// --- API TẠO ASSIGNMENT DẠNG QUIZ (CHỌN ĐỀ CÓ SẴN) ---
export const createQuizAssignment = async (req, res) => {
  const {
    classId,
    title,
    description,
    dueDate,
    quizId, // ID của bài Quiz gốc đã chọn
    status,
  } = req.body;

  if (!quizId) {
    return res.status(400).json({ message: "Chưa chọn đề thi trắc nghiệm" });
  }

  const formattedDueDate = new Date(dueDate)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    // Cách 1: Link trực tiếp tới Quiz gốc (Nếu tất cả lớp dùng chung 1 đề, không sửa đổi)
    // Cách 2: Clone Quiz gốc thành Quiz mới cho lớp này (Nếu giáo viên muốn sửa đề cho từng lớp)
    // -> Ở đây mình dùng Cách 1 cho đơn giản và tiết kiệm DB (Link trực tiếp QuizId)

    const q = `
      INSERT INTO Assignments 
      (Title, Description, DueDate, ClassId, Type, Status, QuizId) 
      VALUES (?, ?, ?, ?, 'quiz', ?, ?)
    `;

    await query(q, [
      title,
      description,
      formattedDueDate,
      classId,
      status || "active",
      quizId,
    ]);

    res.status(201).json({ message: "Giao bài kiểm tra thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo bài kiểm tra" });
  }
};

// ==================== STUDENT: NỘP BÀI TẬP ====================
export const submitAssignment = async (req, res) => {
  // ... (Giữ nguyên logic nộp bài cũ của bạn) ...
  const { assignmentId } = req.body;
  const userId = req.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Vui lòng đính kèm file bài làm" });
  }

  try {
    const qStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const studentData = await query(qStudent, [userId]);

    if (studentData.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ message: "Không tìm thấy hồ sơ học sinh" });
    }
    const studentId = studentData[0].StudentId;

    const uploadResult = await uploadToCloudinary(
      file.path,
      "Assignments/Submissions"
    );
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const fileUrl = uploadResult.secure_url;

    const qCheck =
      "SELECT SubmissionId FROM Submissions WHERE AssignmentId = ? AND StudentId = ?";
    const existingSub = await query(qCheck, [assignmentId, studentId]);

    if (existingSub.length > 0) {
      const qUpdate =
        "UPDATE Submissions SET FileUrl = ?, SubmissionDate = NOW(), Status = 'Submitted' WHERE SubmissionId = ?";
      await query(qUpdate, [fileUrl, existingSub[0].SubmissionId]);
      return res.json({
        message: "Nộp lại bài thành công",
        fileUrl,
        submissionId: existingSub[0].SubmissionId,
      });
    } else {
      const qInsert =
        "INSERT INTO Submissions (AssignmentId, StudentId, FileUrl, SubmissionDate, Status) VALUES (?, ?, ?, NOW(), 'Submitted')";
      const result = await query(qInsert, [assignmentId, studentId, fileUrl]);
      return res
        .status(201)
        .json({
          message: "Nộp bài thành công",
          fileUrl,
          submissionId: result.insertId,
        });
    }
  } catch (err) {
    console.error("Lỗi Submit:", err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};
