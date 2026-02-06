import { db } from "../../db.js";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs";
import { promisify } from "util";

// --- HELPER: QUERY DB (Promisify) ---
const query = promisify(db.query).bind(db);

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
      },
    );
  });
};

// ============================================================
// 1. API UPLOAD FILE RIÊNG (Dùng cho nút "Tải lên" ở Frontend)
// ============================================================
export const uploadAssignmentFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Không có file được gửi lên." });
  }

  try {
    const uploadResult = await uploadToCloudinary(
      file.path,
      "Assignments/Materials",
    );

    // Xóa file tạm sau khi up thành công
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    // Trả về URL để Frontend lưu vào form
    return res.status(200).json({
      message: "Upload thành công",
      url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary Error:", error);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ message: "Lỗi khi upload file" });
  }
};

// ==================== TEACHER: QUẢN LÝ BÀI TẬP ====================

// 2. Lấy danh sách bài tập theo Lớp
export const getAssignmentsByClass = async (req, res) => {
  const classId = req.params.classId;

  try {
    let sql = `
      SELECT 
        a.AssignmentId, 
        a.Title, 
        a.Description, 
        a.DueDate, 
        a.Type, 
        a.Status, 
        a.FileUrl, 
        a.QuizId,
        -- Đếm số lượng đã nộp
        (SELECT COUNT(*) FROM Submissions s WHERE s.AssignmentId = a.AssignmentId) as SubmittedCount,
        -- Đếm tổng số học sinh trong lớp
        (SELECT COUNT(*) FROM Class_Student cs WHERE cs.ClassId = a.ClassId) as TotalStudents
      FROM Assignments a
      WHERE a.ClassId = ?
      ORDER BY a.CreatedAt DESC
    `;

    const params = [classId];
    const data = await query(sql, params);
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const getAssignmentsByClassStudent = async (req, res) => {
  const { classId } = req.params;
  // Lấy userId từ query param (như yêu cầu) HOẶC từ token xác thực (req.user)
  const userId = req.query.userId || req.user?.id;

  try {
    // BƯỚC 1: Lấy StudentId từ UserId
    // (Vì bảng Assignments/Submissions liên kết theo StudentId chứ không phải UserId)
    const qStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const studentRows = await query(qStudent, [userId]);

    if (studentRows.length === 0) {
      return res
        .status(403)
        .json({ message: "Không tìm thấy thông tin học sinh." });
    }
    const studentId = studentRows[0].StudentId;

    // BƯỚC 2: Truy vấn Assignments + Join Submissions + Join QuizResults
    // Sử dụng LEFT JOIN để lấy bài tập kể cả khi chưa nộp
    // Với Quiz, ta dùng subquery để chỉ lấy kết quả bài làm MỚI NHẤT của học sinh đó
    let sql = `
      SELECT 
        a.AssignmentId, 
        a.Title, 
        a.Description, 
        a.DueDate, 
        a.Type, 
        a.Status AS AssignmentStatus, 
        a.FileUrl, 
        a.QuizId,
        a.CreatedAt,

        -- Dữ liệu từ bảng Submissions (Bài tập tự luận/Upload file)
        s.Status AS SubStatus,
        s.Score AS SubScore,
        s.TeacherComment,
        s.FileUrl AS StudentFileUrl,
        s.SubmissionDate AS SubDate,

        -- Dữ liệu từ bảng QuizResults (Bài trắc nghiệm - Lấy điểm)
        qr.Score AS QuizScore,
        qr.CompletedAt AS QuizDate

      FROM Assignments a
      
      -- Join bảng Submissions: Lấy thông tin nộp bài của học sinh này
      LEFT JOIN Submissions s ON a.AssignmentId = s.AssignmentId AND s.StudentId = ?
      
      -- Join bảng QuizResults: Chỉ lấy bài làm mới nhất (Latest attempt)
      LEFT JOIN (
          SELECT t1.QuizId, t1.StudentId, t1.Score, t1.CompletedAt
          FROM QuizResults t1
          WHERE t1.CompletedAt = (
              SELECT MAX(t2.CompletedAt)
              FROM QuizResults t2
              WHERE t2.QuizId = t1.QuizId AND t2.StudentId = t1.StudentId
          )
      ) qr ON a.QuizId = qr.QuizId AND qr.StudentId = ?

      WHERE a.ClassId = ? 
      ORDER BY a.CreatedAt DESC
    `;

    // Truyền tham số: studentId (cho join submission), studentId (cho join quiz), classId
    const rawData = await query(sql, [studentId, studentId, classId]);

    // BƯỚC 3: Chuẩn hóa dữ liệu trả về cho Frontend
    // Frontend cần các trường thống nhất: StudentScore, SubmissionStatus, SubmissionDate
    const result = rawData.map((item) => {
      let finalStatus = null;
      let finalScore = null;
      let finalDate = null;

      if (item.Type === "quiz") {
        // Logic cho Quiz
        if (item.QuizDate) {
          finalStatus = "Submitted"; // Quiz đã làm thì coi như đã nộp
          finalScore = item.QuizScore;
          finalDate = item.QuizDate;
        }
      } else {
        // Logic cho Homework
        finalStatus = item.SubStatus; // 'Submitted', 'Late', 'Graded'
        finalScore = item.SubScore;
        finalDate = item.SubDate;
      }

      return {
        AssignmentId: item.AssignmentId,
        Title: item.Title,
        Description: item.Description,
        DueDate: item.DueDate,
        Type: item.Type,
        Status: item.AssignmentStatus, // Trạng thái của bài tập (Active/Draft)
        FileUrl: item.FileUrl,
        QuizId: item.QuizId,
        CreatedAt: item.CreatedAt,

        // Dữ liệu cá nhân hóa của học sinh
        SubmissionStatus: finalStatus,
        StudentScore: finalScore,
        SubmissionDate: finalDate,
        TeacherComment: item.TeacherComment, // Chỉ có ở Homework
        StudentFileUrl: item.StudentFileUrl, // Chỉ có ở Homework
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Get Assignments Error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách bài tập." });
  }
};

// 3. Tạo bài tập (Nhận fileUrl từ body)
export const addAssignment = async (req, res) => {
  const {
    title,
    description,
    dueDate,
    classId,
    type,
    status,
    fileUrl,
    quizId,
  } = req.body;

  if (!classId || !title || !dueDate) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  // Format Date
  const formattedDueDate = new Date(dueDate)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const q = `
      INSERT INTO Assignments (ClassId, Title, Description, DueDate, Type, Status, FileUrl, QuizId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(q, [
      classId,
      title,
      description,
      formattedDueDate,
      type || "homework",
      status || "active",
      fileUrl || null, // Lưu trực tiếp URL nhận từ client
      quizId || null,
    ]);

    return res.status(201).json({ message: "Tạo bài tập thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi tạo bài tập", error: err });
  }
};

// 4. Cập nhật bài tập
export const updateAssignment = async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const { title, description, dueDate, type, status, quizId, fileUrl } =
    req.body;

  const formattedDueDate = new Date(dueDate)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const q = `
      UPDATE Assignments 
      SET Title=?, Description=?, DueDate=?, Type=?, Status=?, QuizId=?, FileUrl=?
      WHERE AssignmentId=?
    `;

    await query(q, [
      title,
      description,
      formattedDueDate,
      type,
      status,
      quizId || null,
      fileUrl || null,
      assignmentId,
    ]);

    return res.json({ message: "Cập nhật bài tập thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi cập nhật", error: err });
  }
};

// 5. Xóa bài tập
export const deleteAssignment = async (req, res) => {
  const assignmentId = req.params.assignmentId;
  try {
    await query("DELETE FROM Assignments WHERE AssignmentId = ?", [
      assignmentId,
    ]);
    return res.json({ message: "Đã xóa bài tập" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 6. Tạo Quiz (Wrapper)
export const createQuizAssignment = async (req, res) => {
  return addAssignment(req, res);
};

// 7. Lấy danh sách Quiz (Cho modal chọn đề)
export const getQuizzes = async (req, res) => {
  const { courseId } = req.query;
  try {
    let sql = `
        SELECT Q.QuizId, Q.Title, Q.DurationMinutes, COUNT(QQM.QuestionId) as QuestionCount 
        FROM Quizzes Q
        LEFT JOIN Quiz_Question_Mapping QQM ON Q.QuizId = QQM.QuizId
        WHERE Q.CourseId = ? AND Q.ClassId IS NULL 
        GROUP BY Q.QuizId
      `;
    const data = await query(sql, [courseId]);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ==================== STUDENT: NỘP BÀI TẬP ====================
export const submitAssignment = async (req, res) => {
  const { assignmentId } = req.body;
  const userId = req.user.id; // Lấy từ middleware verifyToken
  const file = req.file;

  if (!file) return res.status(400).json({ message: "Vui lòng đính kèm file" });

  try {
    // 1. Lấy thông tin Học sinh
    const qStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const studentRows = await query(qStudent, [userId]);
    if (studentRows.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ message: "Không tìm thấy hồ sơ học sinh" });
    }
    const studentId = studentRows[0].StudentId;

    // 2. Lấy thông tin Bài tập (Để check hạn nộp)
    const qAssignment =
      "SELECT DueDate, Status FROM Assignments WHERE AssignmentId = ?";
    const assignmentRows = await query(qAssignment, [assignmentId]);
    if (assignmentRows.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    // Logic xác định trạng thái nộp (Sớm hay Muộn)
    const dueDate = new Date(assignmentRows[0].DueDate);
    const now = new Date();
    // Nếu hiện tại lớn hơn hạn nộp -> Late, ngược lại -> Submitted
    const submissionStatus = now > dueDate ? "Late" : "Submitted";

    // 3. Kiểm tra xem đã nộp trước đó chưa
    const qCheck =
      "SELECT SubmissionId, Status FROM Submissions WHERE AssignmentId = ? AND StudentId = ?";
    const existingSub = await query(qCheck, [assignmentId, studentId]);

    // Nếu bài cũ đã được chấm (Graded) thì KHÔNG cho nộp lại
    if (existingSub.length > 0 && existingSub[0].Status === "Graded") {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ message: "Bài tập đã được chấm điểm, không thể nộp lại." });
    }

    // 4. Upload lên Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.path,
      "Assignments/Submissions",
    );
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path); // Xóa file temp
    const fileUrl = uploadResult.secure_url;

    // 5. Insert hoặc Update Database
    if (existingSub.length > 0) {
      // Cập nhật bài nộp cũ
      await query(
        "UPDATE Submissions SET FileUrl = ?, SubmissionDate = NOW(), Status = ? WHERE SubmissionId = ?",
        [fileUrl, submissionStatus, existingSub[0].SubmissionId],
      );
    } else {
      // Tạo bài nộp mới
      await query(
        "INSERT INTO Submissions (AssignmentId, StudentId, FileUrl, SubmissionDate, Status) VALUES (?, ?, ?, NOW(), ?)",
        [assignmentId, studentId, fileUrl, submissionStatus],
      );
    }

    return res.status(200).json({
      message: "Nộp bài thành công",
      fileUrl,
      status: submissionStatus,
    });
  } catch (err) {
    console.error(err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ==================== 8. LẤY DANH SÁCH BÀI NỘP (ĐÃ SỬA) ====================
export const getSubmissionsByAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const sql = `
      SELECT 
        s.SubmissionId, 
        s.StudentId, 
        st.UserId, 
        s.ResultId,
        
        st.FullName, 
        
        u.Email,
        s.FileUrl, 
        s.Score as Grade, 
        s.TeacherComment as Feedback, 
        s.SubmissionDate, 
        s.Status,
        qr.Score as QuizScore
      FROM Submissions s
      JOIN Students st ON s.StudentId = st.StudentId
      JOIN Users u ON st.UserId = u.UserId
      LEFT JOIN QuizResults qr ON qr.StudentId = s.StudentId AND qr.QuizId = (SELECT QuizId FROM Assignments WHERE AssignmentId = ?)
      WHERE s.AssignmentId = ?
      ORDER BY s.SubmissionDate DESC
    `;
    const data = await query(sql, [assignmentId, assignmentId]);
    return res.json(data);
  } catch (err) {
    console.error("Lỗi getSubmissionsByAssignment:", err);
    return res.status(500).json({ message: "Lỗi lấy danh sách bài nộp" });
  }
};

// ==================== 9. CHẤM ĐIỂM (ĐÃ SỬA) ====================
export const gradeSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  try {
    // Sửa tên cột update: Score và TeacherComment
    const sql = `
      UPDATE Submissions 
      SET Score = ?, TeacherComment = ?, Status = 'Graded' 
      WHERE SubmissionId = ?
    `;
    await query(sql, [grade, feedback, submissionId]);
    return res.json({ message: "Đã chấm điểm thành công" });
  } catch (err) {
    console.error("Lỗi gradeSubmission:", err);
    return res.status(500).json({ message: "Lỗi chấm điểm" });
  }
};

export const getAssignmentSubmissionDetail = async (req, res) => {
  const { assignmentId } = req.params;
  const userId = req.user.id; // Lấy userId từ token

  try {
    // 1. Lấy StudentId từ UserId
    const qStudent = "SELECT StudentId FROM Students WHERE UserId = ?";
    const studentRows = await query(qStudent, [userId]);
    if (studentRows.length === 0) {
      return res
        .status(403)
        .json({ message: "Không tìm thấy hồ sơ học sinh." });
    }
    const studentId = studentRows[0].StudentId;

    // 2. Lấy thông tin Bài tập để biết loại (Quiz hay Homework)
    const qAssignment =
      "SELECT Type, QuizId, Title FROM Assignments WHERE AssignmentId = ?";
    const assignRows = await query(qAssignment, [assignmentId]);
    if (assignRows.length === 0) {
      return res.status(404).json({ message: "Bài tập không tồn tại." });
    }

    const { Type, QuizId } = assignRows[0];
    let resultData = {
      isSubmitted: false,
      data: null,
    };

    // 3. Xử lý dựa trên loại bài tập
    if (Type === "quiz" && QuizId) {
      // --- TRƯỜNG HỢP QUIZ: Lấy từ bảng QuizResults ---
      // Lấy bài làm mới nhất (ORDER BY CompletedAt DESC)
      const qQuiz = `
            SELECT 
                ResultId, 
                Score, 
                CorrectCount, 
                TotalQuestions, 
                CompletedAt as SubmissionDate 
            FROM QuizResults 
            WHERE QuizId = ? AND StudentId = ? 
            ORDER BY CompletedAt DESC LIMIT 1`;

      const quizRows = await query(qQuiz, [QuizId, studentId]);

      if (quizRows.length > 0) {
        resultData.isSubmitted = true;
        resultData.data = {
          submissionId: quizRows[0].ResultId,
          score: quizRows[0].Score, // Điểm số
          submissionDate: quizRows[0].SubmissionDate, // Ngày nộp
          correctCount: quizRows[0].CorrectCount, // Số câu đúng (nếu cần)
          totalQuestions: quizRows[0].TotalQuestions,
          type: "quiz",
        };
      }
    } else {
      // --- TRƯỜNG HỢP HOMEWORK/ESSAY: Lấy từ bảng Submissions ---
      const qSub = `
            SELECT 
                SubmissionId, 
                FileUrl, 
                SubmissionDate, 
                Status, 
                Score, 
                TeacherComment 
            FROM Submissions 
            WHERE AssignmentId = ? AND StudentId = ?`;

      const subRows = await query(qSub, [assignmentId, studentId]);

      if (subRows.length > 0) {
        resultData.isSubmitted = true;
        resultData.data = {
          submissionId: subRows[0].SubmissionId,
          fileUrl: subRows[0].FileUrl, // Link file học sinh nộp
          submissionDate: subRows[0].SubmissionDate, // Ngày nộp
          status: subRows[0].Status, // 'Submitted', 'Late', 'Graded'
          score: subRows[0].Score, // Điểm giáo viên chấm
          teacherComment: subRows[0].TeacherComment, // Lời phê của giáo viên
          type: "homework",
        };
      }
    }

    // 4. Trả về kết quả
    return res.status(200).json(resultData);
  } catch (err) {
    console.error("Get Submission Detail Error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy chi tiết bài nộp." });
  }
};
