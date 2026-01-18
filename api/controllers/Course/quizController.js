import { db } from "../../db.js";

// Helper query function - Dùng để chạy các câu lệnh SQL trả về Promise
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
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
      [userId]
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
      [quizId]
    );

    const correctMap = new Map();
    correctData.forEach((row) => {
      if (!correctMap.has(row.QuestionId)) correctMap.set(row.QuestionId, []);
      correctMap.get(row.QuestionId).push(row.OptionId);
    });

    const totalQuestionsRes = await query(
      "SELECT COUNT(*) as count FROM Quiz_Question_Mapping WHERE QuizId = ?",
      [quizId]
    );
    const totalQuestions = totalQuestionsRes[0].count;

    let correctCount = 0;
    const processedAnswers = answers.map((ans) => {
      const isCorrect = (correctMap.get(ans.questionId) || []).includes(
        ans.selectedOptionId
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
      [quizId, studentId, score, correctCount, totalQuestions]
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
        [answerValues]
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
      [userId]
    );
    const studentId = sRes[0].StudentId;

    const resultData = await query(
      `
      SELECT QR.*, Q.Title FROM QuizResults QR
      JOIN Quizzes Q ON QR.QuizId = Q.QuizId
      WHERE QR.QuizId = ? AND QR.StudentId = ?
      ORDER BY QR.CompletedAt DESC LIMIT 1
    `,
      [quizId, studentId]
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
      [result.ResultId]
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
      [quizId]
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
      [quizId]
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
      [quizId]
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
      [id]
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
