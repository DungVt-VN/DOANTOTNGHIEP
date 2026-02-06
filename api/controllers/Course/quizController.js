import { db } from "../../db.js";

// Helper query function - Dùng để chạy các câu lệnh SQL trả về Promise
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

export const getQuizzesByClass = async (req, res) => {
  const classId = req.params.classId;
  const studentId = req.query.studentId;

  if (!classId) {
    return res.status(400).json("Thiếu Class ID.");
  }

  try {
    const sql = `
      SELECT 
        Q.*,
        -- C.ClassName phụ thuộc vào Q.ClassId nên thường MySQL sẽ cho qua, 
        -- nhưng để chắc chắn không lỗi strict mode, ta có thể dùng MAX hoặc ANY_VALUE
        MAX(C.ClassName) as ClassName,
        
        COUNT(QQM.QuestionId) as QuestionCount,
        
        -- SỬA LỖI Ở ĐÂY: Dùng MAX() để thỏa mãn only_full_group_by
        MAX(QR.ResultId) as ResultId,
        MAX(QR.Score) as Score,
        (MAX(QR.ResultId) IS NOT NULL) as IsSubmitted,

        -- Tính trạng thái
        CASE
            WHEN NOW() < Q.StartTime THEN 'upcoming'
            WHEN NOW() >= Q.StartTime AND (Q.EndTime IS NULL OR NOW() <= Q.EndTime) THEN 'ongoing'
            ELSE 'finished'
        END as Status

      FROM Quizzes Q
      LEFT JOIN Classes C ON Q.ClassId = C.ClassId
      LEFT JOIN Quiz_Question_Mapping QQM ON Q.QuizId = QQM.QuizId
      
      -- LEFT JOIN kết quả của riêng học sinh
      LEFT JOIN QuizResults QR ON Q.QuizId = QR.QuizId AND QR.StudentId = ?

      WHERE Q.ClassId = ?
      GROUP BY Q.QuizId
      ORDER BY Q.StartTime DESC
    `;

    const data = await query(sql, [studentId, classId]);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi getQuizzesByClass:", err);
    return res.status(500).json({ message: "Lỗi Server", error: err });
  }
};
// --- 1. TẠO BÀI KIỂM TRA (QUIZ) ---
// --- 1. TẠO BÀI KIỂM TRA (Sửa Status) ---
export const addQuiz = async (req, res) => {
  const {
    classId,
    courseId,
    title,
    durationMinutes,
    passScore,
    startTime,
    endTime,
    questions,
    status, // Cho phép truyền status từ ngoài vào
  } = req.body;

  try {
    await query("START TRANSACTION");

    const qInsertQuiz = `
      INSERT INTO Quizzes (ClassId, CourseId, Title, DurationMinutes, PassScore, StartTime, EndTime, Status, CreatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    const defaultStatus = "upcoming";

    const quizRes = await query(qInsertQuiz, [
      classId || null,
      courseId || null,
      title,
      durationMinutes,
      passScore || 5.0,
      start,
      end,
      status || defaultStatus, // Sử dụng status gửi lên hoặc mặc định
    ]);

    const quizId = quizRes.insertId;

    // ... (Phần insert câu hỏi giữ nguyên) ...
    if (questions && questions.length > 0) {
      const mappingValues = questions.map((qId, index) => [
        quizId,
        qId,
        index + 1,
        1.0,
      ]);
      const qInsertMapping = `INSERT INTO Quiz_Question_Mapping (QuizId, QuestionId, OrderIndex, ScoreWeight) VALUES ?`;
      await query(qInsertMapping, [mappingValues]);
    }

    await query("COMMIT");
    return res
      .status(201)
      .json({ message: "Tạo bài kiểm tra thành công.", quizId });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi addQuiz:", err);
    return res
      .status(500)
      .json({ error: "Lỗi server: " + err.sqlMessage || err.message });
  }
};

// --- 2. LẤY DANH SÁCH BÀI KIỂM TRA ---
export const getQuizzes = async (req, res) => {
  const { classId, courseId, type } = req.query;

  try {
    let sql = `
      SELECT 
        Q.*, 
        COUNT(QQM.QuestionId) as QuestionCount,
        C.ClassName, 
        CO.CourseName
      FROM Quizzes Q
      LEFT JOIN Quiz_Question_Mapping QQM ON Q.QuizId = QQM.QuizId
      LEFT JOIN Classes C ON Q.ClassId = C.ClassId
      LEFT JOIN Courses CO ON Q.CourseId = CO.CourseId 
    `;

    const params = [];
    const conditions = [];

    if (classId) {
      conditions.push(`Q.ClassId = ?`);
      params.push(classId);
    } else if (courseId && type === "master") {
      conditions.push(`Q.CourseId = ?`);
      conditions.push(`Q.ClassId IS NULL`);
      params.push(courseId);
    } else if (courseId) {
      conditions.push(`Q.CourseId = ?`);
      conditions.push(`Q.ClassId IS NOT NULL`);
      params.push(courseId);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(" AND ");
    } else {
      sql += ` WHERE 1=0 `;
    }

    sql += ` GROUP BY Q.QuizId ORDER BY Q.CreatedAt DESC`;

    const data = await query(sql, params);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi getQuizzes:", err);
    return res.status(500).json(err);
  }
};

// --- 3. PHÂN PHỐI ĐỀ THI (CLONE MASTER SANG CLASS) ---
export const distributeQuizToClass = async (req, res) => {
  const {
    ParentQuizId,
    ClassId,
    // Title, // Không lấy Title từ form nữa
    DurationMinutes, // Lấy thời lượng từ form
    StartTime,
    EndTime,
    AccessCode,
    Status,
  } = req.body;

  if (!ParentQuizId || !ClassId) {
    return res.status(400).json({ error: "Thiếu ParentQuizId hoặc ClassId" });
  }

  try {
    await query("START TRANSACTION");

    // 1. Lấy thông tin Đề gốc (Master)
    const masterData = await query("SELECT * FROM Quizzes WHERE QuizId = ?", [
      ParentQuizId,
    ]);

    if (masterData.length === 0) {
      throw new Error("Không tìm thấy đề gốc");
    }
    const master = masterData[0];

    // 2. Tạo đề thi mới
    // Logic:
    // - Title: Lấy của đề gốc (master.Title)
    // - DurationMinutes: Lấy từ form (DurationMinutes)
    const qInsertQuiz = `
      INSERT INTO Quizzes 
      (ParentQuizId, ClassId, CourseId, Title, DurationMinutes, PassScore, StartTime, EndTime, AccessCode, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertResult = await query(qInsertQuiz, [
      ParentQuizId,
      ClassId,
      master.CourseId, // Lấy từ Master
      master.Title, // <--- YÊU CẦU 1: Lấy Tên từ Đề gốc
      DurationMinutes, // <--- YÊU CẦU 2: Lấy Thời lượng từ Form
      master.PassScore, // Lấy từ Master (hoặc từ form nếu muốn)
      StartTime,
      EndTime,
      AccessCode || null,
      Status || "upcoming",
    ]);

    const newQuizId = insertResult.insertId;

    // 3. Sao chép câu hỏi
    const qCloneMapping = `
      INSERT INTO Quiz_Question_Mapping (QuizId, QuestionId, OrderIndex, ScoreWeight)
      SELECT ?, QuestionId, OrderIndex, ScoreWeight 
      FROM Quiz_Question_Mapping WHERE QuizId = ?
    `;
    await query(qCloneMapping, [newQuizId, ParentQuizId]);

    await query("COMMIT");

    res.status(200).json({
      message: "Phân phối đề thành công",
      newQuizId,
    });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi distribute:", err);
    res.status(500).json({ error: err.message });
  }
};
// --- 4. LẤY CHI TIẾT ĐỀ THI ---
export const getQuizById = async (req, res) => {
  const quizId = req.params.quizId;
  try {
    const quizData = await query("SELECT * FROM Quizzes WHERE QuizId = ?", [
      quizId,
    ]);
    if (quizData.length === 0)
      return res.status(404).json({ message: "Quiz not found" });
    const quiz = quizData[0];

    const qQuestions = `
      SELECT QB.*, QQM.OrderIndex, QQM.ScoreWeight, QO.OptionId, QO.OptionText
      FROM Quiz_Question_Mapping QQM
      JOIN QuestionBank QB ON QQM.QuestionId = QB.QuestionId
      LEFT JOIN QuestionOptions QO ON QB.QuestionId = QO.QuestionId
      WHERE QQM.QuizId = ?
      ORDER BY QQM.OrderIndex ASC
    `;
    const rawData = await query(qQuestions, [quizId]);

    const questionsMap = new Map();
    rawData.forEach((row) => {
      if (!questionsMap.has(row.QuestionId)) {
        questionsMap.set(row.QuestionId, { ...row, Options: [] });
      }
      if (row.OptionId) {
        questionsMap
          .get(row.QuestionId)
          .Options.push({ OptionId: row.OptionId, Text: row.OptionText });
      }
    });

    quiz.questions = Array.from(questionsMap.values());
    return res.status(200).json(quiz);
  } catch (err) {
    return res.status(500).json(err);
  }
};

// --- 5. NỘP BÀI VÀ CHẤM ĐIỂM ---
export const submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.userInfo.id;

  try {
    const studentRes = await query(
      "SELECT StudentId FROM Students WHERE UserId = ?",
      [userId],
    );
    if (studentRes.length === 0)
      return res.status(403).json("Học viên không tồn tại");
    const studentId = studentRes[0].StudentId;

    const correctData = await query(
      `
      SELECT QQM.QuestionId, QO.OptionId 
      FROM Quiz_Question_Mapping QQM
      JOIN QuestionOptions QO ON QQM.QuestionId = QO.QuestionId
      WHERE QQM.QuizId = ? AND QO.IsCorrect = 1
    `,
      [quizId],
    );

    const correctMap = new Map();
    correctData.forEach((row) => {
      if (!correctMap.has(row.QuestionId)) correctMap.set(row.QuestionId, []);
      correctMap.get(row.QuestionId).push(row.OptionId);
    });

    const totalQuestionsRes = await query(
      "SELECT COUNT(*) as count FROM Quiz_Question_Mapping WHERE QuizId = ?",
      [quizId],
    );
    const totalQuestions = totalQuestionsRes[0].count;

    let correctCount = 0;
    const processedAnswers = answers.map((ans) => {
      const isCorrect = (correctMap.get(ans.questionId) || []).includes(
        ans.selectedOptionId,
      );
      if (isCorrect) correctCount++;
      return { ...ans, isCorrect };
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;

    const resultRes = await query(
      `
      INSERT INTO QuizResults (QuizId, StudentId, Score, CorrectCount, TotalQuestions, CompletedAt)
      VALUES (?, ?, ?, ?, ?, NOW())
    `,
      [quizId, studentId, score, correctCount, totalQuestions],
    );

    const resultId = resultRes.insertId;

    if (processedAnswers.length > 0) {
      const answerValues = processedAnswers.map((ans) => [
        resultId,
        ans.questionId,
        ans.selectedOptionId || null,
        ans.textAnswer || null,
        ans.isCorrect ? 1 : 0,
      ]);
      await query(
        "INSERT INTO StudentAnswers (ResultId, QuestionId, SelectedOptionId, TextAnswer, IsCorrect) VALUES ?",
        [answerValues],
      );
    }

    return res.status(200).json({ message: "Nộp bài thành công", score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi khi nộp bài." });
  }
};

// --- 6. XEM KẾT QUẢ ---
export const getQuizResult = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.userInfo.id;
  try {
    const sRes = await query(
      "SELECT StudentId FROM Students WHERE UserId = ?",
      [userId],
    );
    const studentId = sRes[0].StudentId;

    const resultData = await query(
      `
      SELECT QR.*, Q.Title FROM QuizResults QR
      JOIN Quizzes Q ON QR.QuizId = Q.QuizId
      WHERE QR.QuizId = ? AND QR.StudentId = ?
      ORDER BY QR.CompletedAt DESC LIMIT 1
    `,
      [quizId, studentId],
    );

    if (resultData.length === 0)
      return res.status(404).json({ message: "Chưa có kết quả." });
    const result = resultData[0];

    const details = await query(
      `
      SELECT SA.*, QB.QuestionContent, QO.OptionText as SelectedText
      FROM StudentAnswers SA
      JOIN QuestionBank QB ON SA.QuestionId = QB.QuestionId
      LEFT JOIN QuestionOptions QO ON SA.SelectedOptionId = QO.OptionId
      WHERE SA.ResultId = ?
    `,
      [result.ResultId],
    );

    return res.status(200).json({ overview: result, details });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// --- 7. XÓA BÀI KIỂM TRA ---
export const deleteQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    await query("START TRANSACTION");

    // 1. Kiểm tra xem Quiz có tồn tại không
    const checkRes = await query(
      "SELECT QuizId FROM Quizzes WHERE QuizId = ?",
      [quizId],
    );
    if (checkRes.length === 0) {
      await query("ROLLBACK");
      return res.status(404).json({ message: "Bài kiểm tra không tồn tại." });
    }

    // 2. Xóa các mapping câu hỏi (Nếu DB không có ON DELETE CASCADE)
    await query("DELETE FROM Quiz_Question_Mapping WHERE QuizId = ?", [quizId]);

    // 3. Xóa kết quả thi của học sinh (Nếu cần xóa sạch, hoặc giữ lại tùy nghiệp vụ)
    // await query("DELETE FROM QuizResults WHERE QuizId = ?", [quizId]);

    // 4. Xóa Quiz chính
    await query("DELETE FROM Quizzes WHERE QuizId = ?", [quizId]);

    await query("COMMIT");
    return res.status(200).json({ message: "Đã xóa bài kiểm tra thành công." });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi deleteQuiz:", err);
    return res.status(500).json({ error: "Lỗi server khi xóa bài kiểm tra." });
  }
};

// --- 8. CẬP NHẬT BÀI KIỂM TRA ---
export const updateQuiz = async (req, res) => {
  const { quizId } = req.params;
  const {
    title,
    durationMinutes,
    passScore,
    startTime,
    endTime,
    status,
    questions,
  } = req.body;

  try {
    await query("START TRANSACTION");

    // 1. Kiểm tra tồn tại
    const checkRes = await query(
      "SELECT QuizId FROM Quizzes WHERE QuizId = ?",
      [quizId],
    );
    if (checkRes.length === 0) {
      await query("ROLLBACK");
      return res.status(404).json({ message: "Bài kiểm tra không tồn tại." });
    }

    // 2. Cập nhật thông tin cơ bản
    // Chỉ cập nhật các trường được gửi lên (Dynamic Update) hoặc cập nhật hết
    // Ở đây mình viết cập nhật đầy đủ các trường phổ biến
    const qUpdateInfo = `
      UPDATE Quizzes 
      SET Title = ?, DurationMinutes = ?, PassScore = ?, StartTime = ?, EndTime = ?, Status = ?
      WHERE QuizId = ?
    `;

    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    await query(qUpdateInfo, [
      title,
      durationMinutes,
      passScore,
      start,
      end,
      status || "upcoming", // Mặc định giữ upcoming nếu không gửi status
      quizId,
    ]);

    // 3. Cập nhật danh sách câu hỏi (Nếu có gửi mảng questions)
    if (questions && Array.isArray(questions)) {
      // B3.1: Xóa hết mapping cũ của Quiz này
      await query("DELETE FROM Quiz_Question_Mapping WHERE QuizId = ?", [
        quizId,
      ]);

      // B3.2: Thêm mapping mới (Nếu mảng không rỗng)
      if (questions.length > 0) {
        const mappingValues = questions.map((qId, index) => [
          quizId,
          qId,
          index + 1, // OrderIndex tăng dần
          1.0, // ScoreWeight mặc định là 1.0 (hoặc lấy từ req.body nếu UI có hỗ trợ chỉnh điểm)
        ]);

        const qInsertMapping = `
          INSERT INTO Quiz_Question_Mapping (QuizId, QuestionId, OrderIndex, ScoreWeight) 
          VALUES ?
        `;
        await query(qInsertMapping, [mappingValues]);
      }
    }

    await query("COMMIT");
    return res
      .status(200)
      .json({ message: "Cập nhật bài kiểm tra thành công." });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Lỗi updateQuiz:", err);
    return res
      .status(500)
      .json({ error: "Lỗi server khi cập nhật bài kiểm tra." });
  }
};

// --- 10. CẬP NHẬT DANH SÁCH CÂU HỎI CHO ĐỀ THI ---
export const updateQuizQuestions = async (req, res) => {
  const { quizId } = req.params;
  const { questionIds } = req.body; // Frontend gửi lên: { questionIds: ["1", "2", "5"] }

  // Validate dữ liệu đầu vào
  if (!questionIds || !Array.isArray(questionIds)) {
    return res.status(400).json({ message: "Dữ liệu câu hỏi không hợp lệ." });
  }

  try {
    // Bắt đầu giao dịch
    await query("START TRANSACTION");

    // Bước 1: Kiểm tra xem Quiz có tồn tại không
    const checkQuiz = await query(
      "SELECT QuizId FROM Quizzes WHERE QuizId = ?",
      [quizId],
    );
    if (checkQuiz.length === 0) {
      await query("ROLLBACK");
      return res.status(404).json({ message: "Bài kiểm tra không tồn tại." });
    }

    // Bước 2: Xóa toàn bộ câu hỏi cũ đang gán cho Quiz này
    // (Để tránh trùng lặp hoặc xử lý logic thêm/bớt phức tạp)
    await query("DELETE FROM Quiz_Question_Mapping WHERE QuizId = ?", [quizId]);

    // Bước 3: Thêm danh sách câu hỏi mới (Nếu mảng không rỗng)
    if (questionIds.length > 0) {
      // Tạo mảng dữ liệu để Bulk Insert
      // Format: [QuizId, QuestionId, OrderIndex, ScoreWeight]
      const mappingValues = questionIds.map((qId, index) => [
        quizId,
        qId, // ID câu hỏi
        index + 1, // Thứ tự câu hỏi (dựa trên thứ tự mảng gửi lên)
        1.0, // Trọng số điểm mặc định là 1.0 (Bạn có thể sửa nếu cần)
      ]);

      const qInsert = `
        INSERT INTO Quiz_Question_Mapping (QuizId, QuestionId, OrderIndex, ScoreWeight)
        VALUES ?
      `;
      await query(qInsert, [mappingValues]);
    }

    // Lưu thay đổi
    await query("COMMIT");

    return res.status(200).json({
      message: "Cập nhật danh sách câu hỏi thành công.",
      totalQuestions: questionIds.length,
    });
  } catch (err) {
    // Hoàn tác nếu lỗi
    await query("ROLLBACK");
    console.error("Lỗi updateQuizQuestions:", err);
    return res.status(500).json({ error: "Lỗi server khi lưu câu hỏi." });
  }
};

export const updateQuizDistribute = async (req, res) => {
  const id = req.params.masterQuizId;
  const { Title, DurationMinutes, StartTime, EndTime, AccessCode, Status } =
    req.body;

  try {
    // 1. Kiểm tra bài thi có tồn tại không
    const checkExist = await query(
      "SELECT QuizId FROM Quizzes WHERE QuizId = ?",
      [id],
    );

    if (checkExist.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bài kiểm tra này" });
    }

    // 2. Xử lý dữ liệu ngày tháng an toàn
    // Nếu chuỗi rỗng hoặc null -> convert thành null để lưu vào DB
    const validStartTime = StartTime ? new Date(StartTime) : null;
    const validEndTime = EndTime ? new Date(EndTime) : null;

    // 3. Câu lệnh Update
    const sql = `
      UPDATE Quizzes 
      SET 
        Title = COALESCE(?, Title),           -- Nếu gửi Title thì update, không thì giữ cũ
        DurationMinutes = COALESCE(?, DurationMinutes),
        StartTime = ?,                        -- Update ngày bắt đầu (có thể null)
        EndTime = ?,                          -- Update ngày kết thúc (có thể null)
        AccessCode = ?,                       -- Update mã code (có thể null)
        Status = COALESCE(?, Status)          -- Update trạng thái
      WHERE QuizId = ?
    `;

    await query(sql, [
      Title || null,
      DurationMinutes || null,
      validStartTime,
      validEndTime,
      AccessCode || null, // Cho phép set về null nếu xóa code (gửi chuỗi rỗng)
      Status || null,
      id,
    ]);

    return res.status(200).json({ message: "Cập nhật lịch thi thành công" });
  } catch (err) {
    console.error("Lỗi updateQuizDistribute:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

export const getQuizDetail = async (req, res) => {
  const { quizId, userId } = req.params;

  try {
    // Tìm StudentId từ userId
    const students = await query(
      "SELECT StudentId FROM Students WHERE UserId = ?",
      [userId],
    );

    if (!students || students.length === 0)
      return res
        .status(403)
        .json({ message: "Không tìm thấy thông tin học sinh" });

    const studentId = students[0].StudentId;

    // Lấy thông tin bài thi
    const quizzes = await query("SELECT * FROM Quizzes WHERE QuizId = ?", [
      quizId,
    ]);

    if (!quizzes || quizzes.length === 0)
      return res.status(404).json({ message: "Đề thi không tồn tại" });

    const quiz = quizzes[0];

    // Lấy danh sách câu hỏi
    const questions = await query(
      `SELECT qb.QuestionId, qb.QuestionContent, qb.QuestionType, qb.MediaUrl, qb.MediaType, qm.OrderIndex
       FROM QuestionBank qb
       JOIN Quiz_Question_Mapping qm ON qb.QuestionId = qm.QuestionId
       WHERE qm.QuizId = ?
       ORDER BY qm.OrderIndex ASC`,
      [quizId],
    );

    // Lấy tất cả options
    const allOptions = await query(
      `SELECT OptionId, QuestionId, OptionText 
       FROM QuestionOptions 
       WHERE QuestionId IN (SELECT QuestionId FROM Quiz_Question_Mapping WHERE QuizId = ?)`,
      [quizId],
    );

    // Gán options vào từng câu hỏi
    const questionsWithOpts = questions.map((q) => ({
      ...q,
      options: allOptions.filter((opt) => opt.QuestionId === q.QuestionId),
    }));

    // Khôi phục các câu trả lời học sinh đã "Lưu" trước đó
    const savedAnswers = await query(
      `SELECT sa.QuestionId, sa.SelectedOptionId, sa.TextAnswer
       FROM StudentAnswers sa
       JOIN QuizResults qr ON sa.ResultId = qr.ResultId
       WHERE qr.QuizId = ? AND qr.StudentId = ? AND qr.Score IS NULL`,
      [quizId, studentId],
    );

    res
      .status(200)
      .json({ ...quiz, questions: questionsWithOpts, savedAnswers });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const saveSingleAnswer = async (req, res) => {
  const { quizId, questionId, answer, userId } = req.body;

  try {
    // 1. Tìm StudentId
    const students = await query(
      "SELECT StudentId FROM Students WHERE UserId = ?",
      [userId],
    );

    if (!students || students.length === 0)
      return res
        .status(403)
        .json({ message: "Không tìm thấy thông tin học sinh" });

    const studentId = students[0].StudentId;

    // 2. Tìm hoặc Tạo Quiz ResultId
    let results = await query(
      "SELECT ResultId FROM QuizResults WHERE QuizId = ? AND StudentId = ? AND Score IS NULL",
      [quizId, studentId],
    );

    let resultId;
    if (!results || results.length === 0) {
      const newResult = await query(
        "INSERT INTO QuizResults (QuizId, StudentId) VALUES (?, ?)",
        [quizId, studentId],
      );
      resultId = newResult.insertId;
    } else {
      resultId = results[0].ResultId;
    }

    // --- 3. XỬ LÝ LOGIC LƯU ĐÁP ÁN THEO KIỂU DỮ LIỆU ---
    let selectedOptionId = null;
    let textAnswer = null;

    if (Array.isArray(answer)) {
      // TRƯỜNG HỢP: Chọn nhiều đáp án (Multiple Choice)
      // Chuyển mảng [10, 11] thành chuỗi "10,11" để lưu vào cột TextAnswer
      textAnswer = answer.join(",");
    } else if (
      typeof answer === "number" ||
      (!isNaN(answer) && typeof answer !== "string")
    ) {
      // TRƯỜNG HỢP: Chọn một đáp án (Single Choice)
      selectedOptionId = answer;
    } else {
      // TRƯỜNG HỢP: Tự luận (TextInput)
      textAnswer = answer;
    }

    // 4. Thực hiện INSERT hoặc UPDATE
    await query(
      `INSERT INTO StudentAnswers (ResultId, QuestionId, SelectedOptionId, TextAnswer)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
           SelectedOptionId = VALUES(SelectedOptionId), 
           TextAnswer = VALUES(TextAnswer)`,
      [resultId, questionId, selectedOptionId, textAnswer],
    );

    res.status(200).json({ success: true, message: "Đã lưu đáp án tạm thời" });
  } catch (error) {
    console.error("Save Answer Error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lưu câu hỏi", error: error.message });
  }
};

// 3. Nộp bài và chấm điểm
export const submitQuiz2 = async (req, res) => {
  const { quizId, answers, userId } = req.body;

  try {
    // 1. Lấy StudentId từ UserId
    const students = await query(
      "SELECT StudentId FROM Students WHERE UserId = ?",
      [userId],
    );

    if (!students || students.length === 0)
      return res.status(403).json({ message: "Học sinh không tồn tại" });

    const studentId = students[0].StudentId;

    // 2. Tìm ResultId hiện tại
    const currentResults = await query(
      "SELECT ResultId FROM QuizResults WHERE QuizId = ? AND StudentId = ? AND Score IS NULL",
      [quizId, studentId],
    );

    if (!currentResults || currentResults.length === 0) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy phiên làm bài để nộp" });
    }
    const resultId = currentResults[0].ResultId;

    // 3. Lấy tất cả đáp án đúng của Quiz và loại câu hỏi
    const quizQuestions = await query(
      `SELECT qb.QuestionId, qb.QuestionType, qo.OptionId
       FROM QuestionBank qb
       JOIN Quiz_Question_Mapping qm ON qb.QuestionId = qm.QuestionId
       LEFT JOIN QuestionOptions qo ON qb.QuestionId = qo.QuestionId AND qo.IsCorrect = TRUE
       WHERE qm.QuizId = ?`,
      [quizId],
    );

    // 4. Nhóm đáp án đúng theo QuestionId
    // Cấu trúc: { "1": { type: "SingleChoice", corrects: [10] }, "2": { type: "MultipleChoice", corrects: [15, 16] } }
    const correctMap = quizQuestions.reduce((acc, curr) => {
      if (!acc[curr.QuestionId]) {
        acc[curr.QuestionId] = { type: curr.QuestionType, corrects: [] };
      }
      if (curr.OptionId) {
        acc[curr.QuestionId].corrects.push(curr.OptionId);
      }
      return acc;
    }, {});

    // 5. Tính toán kết quả
    let correctCount = 0;
    const totalQuestions = Object.keys(correctMap).length;

    Object.keys(correctMap).forEach((qId) => {
      const questionData = correctMap[qId];
      const userAnsObj = answers.find(
        (a) => String(a.questionId) === String(qId),
      );
      const userSelected = userAnsObj ? userAnsObj.answer : null;

      if (questionData.type === "MultipleChoice") {
        // Chuyển đáp án người dùng về mảng (vì frontend có thể gửi mảng hoặc giá trị đơn)
        const userAnsArray = Array.isArray(userSelected)
          ? userSelected
          : [userSelected].filter(Boolean);
        const corrects = questionData.corrects;

        // So sánh: Số lượng phải bằng nhau VÀ mọi phần tử trong corrects phải có trong userAnsArray
        const isAllCorrect =
          corrects.length === userAnsArray.length &&
          corrects.every((id) => userAnsArray.includes(id));

        if (isAllCorrect) correctCount++;
      } else {
        // Đối với SingleChoice hoặc TextInput (nếu TextInput lưu ID option)
        if (userSelected && questionData.corrects.includes(userSelected)) {
          correctCount++;
        }
      }
    });

    const finalScore =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;

    // 6. Cập nhật bảng QuizResults
    await query(
      `UPDATE QuizResults 
       SET Score = ?, CorrectCount = ?, TotalQuestions = ?, CompletedAt = CURRENT_TIMESTAMP
       WHERE ResultId = ?`,
      [finalScore, correctCount, totalQuestions, resultId],
    );

    // 7. Tự động lưu vào bảng Submissions (Assignment logic)
    const assignments = await query(
      "SELECT AssignmentId FROM Assignments WHERE QuizId = ? LIMIT 1",
      [quizId],
    );

    if (assignments && assignments.length > 0) {
      const assignmentId = assignments[0].AssignmentId;
      const existingSub = await query(
        "SELECT SubmissionId FROM Submissions WHERE AssignmentId = ? AND StudentId = ?",
        [assignmentId, studentId],
      );

      if (existingSub.length === 0) {
        await query(
          `INSERT INTO Submissions (AssignmentId, StudentId, ResultId, Score, Status)
           VALUES (?, ?, ?, ?, 'Submitted')`,
          [assignmentId, studentId, resultId, finalScore],
        );
      } else {
        await query(
          `UPDATE Submissions 
           SET ResultId = ?, Score = ?, SubmissionDate = CURRENT_TIMESTAMP, Status = 'Submitted'
           WHERE SubmissionId = ?`,
          [resultId, finalScore, existingSub[0].SubmissionId],
        );
      }
    }

    res.status(200).json({
      message: "Nộp bài thành công",
      score: finalScore.toFixed(2),
      correctCount,
      totalQuestions,
      resultId: resultId,
    });
  } catch (error) {
    console.error("Submit Error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi chấm điểm", error: error.message });
  }
};

export const getQuizResultDetail = async (req, res) => {
  const resultId = req.params.resultId;

  if (!resultId) {
    return res.status(400).json({ message: "Thiếu Result ID" });
  }

  try {
    // =========================================================
    // QUERY A: Lấy thông tin tổng quan (Header)
    // =========================================================
    const sqlSummary = `
      SELECT 
        qr.ResultId, 
        qr.Score, 
        qr.CorrectCount, 
        qr.TotalQuestions, 
        qr.CompletedAt,
        q.Title AS QuizTitle,
        s.FullName AS StudentName,
        s.StudentCode
      FROM QuizResults qr
      JOIN Quizzes q ON qr.QuizId = q.QuizId
      JOIN Students s ON qr.StudentId = s.StudentId
      WHERE qr.ResultId = ?
    `;

    // Sử dụng hàm query wrapper
    const summaryRows = await query(sqlSummary, [resultId]);

    if (summaryRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy kết quả bài làm." });
    }

    const summary = summaryRows[0];

    // =========================================================
    // QUERY B: Lấy chi tiết câu trả lời (Body)
    // =========================================================
    // Logic:
    // - Join StudentAnswers với QuestionBank để lấy nội dung câu hỏi.
    // - Join với QuestionOptions (qo_selected) để lấy nội dung đáp án HỌC VIÊN CHỌN.
    // - Dùng Subquery để lấy nội dung đáp án ĐÚNG (qo_correct).

    const sqlDetails = `
      SELECT 
        sa.AnswerId,
        sa.IsCorrect,
        sa.TextAnswer, -- Trường hợp câu hỏi tự luận
        qb.QuestionContent,
        qb.QuestionType,
        
        -- Lấy text đáp án học viên đã chọn
        qo_selected.OptionText AS SelectedOptionText,
        
        -- Lấy text đáp án đúng (Subquery lấy 1 đáp án đúng làm mẫu)
        (
          SELECT OptionText 
          FROM QuestionOptions 
          WHERE QuestionId = sa.QuestionId AND IsCorrect = 1 
          LIMIT 1
        ) AS CorrectOptionText

      FROM StudentAnswers sa
      JOIN QuestionBank qb ON sa.QuestionId = qb.QuestionId
      LEFT JOIN QuestionOptions qo_selected ON sa.SelectedOptionId = qo_selected.OptionId
      WHERE sa.ResultId = ?
      ORDER BY sa.AnswerId ASC
    `;

    // Sử dụng hàm query wrapper
    const detailRows = await query(sqlDetails, [resultId]);

    // =========================================================
    // TRẢ VỀ KẾT QUẢ JSON
    // =========================================================
    return res.status(200).json({
      ResultId: summary.ResultId,
      QuizTitle: summary.QuizTitle,
      StudentName: summary.StudentName,
      StudentCode: summary.StudentCode,
      Score: summary.Score,
      CorrectCount: summary.CorrectCount,
      TotalQuestions: summary.TotalQuestions,
      CompletedAt: summary.CompletedAt,
      StudentAnswers: detailRows, // Mảng chi tiết câu hỏi khớp với Frontend
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài làm quiz:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy chi tiết bài làm." });
  }
};
