import { db } from "../../db.js";
import xlsx from "xlsx"; // Cần cài đặt: npm install xlsx

// =====================================================================
// HELPER FUNCTIONS (Manual Promise Wrappers)
// =====================================================================

// 1. Wrapper cho câu lệnh SQL thông thường
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// 2. Wrapper cho Transaction: Bắt đầu
const beginTransaction = () => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => (err ? reject(err) : resolve()));
  });
};

// 3. Wrapper cho Transaction: Commit (Lưu thay đổi)
const commit = () => {
  return new Promise((resolve, reject) => {
    db.commit((err) => (err ? reject(err) : resolve()));
  });
};

// 4. Wrapper cho Transaction: Rollback (Hoàn tác khi lỗi)
const rollback = () => {
  return new Promise((resolve, reject) => {
    db.rollback(() => resolve()); // Rollback xong thì resolve luôn, không cần reject
  });
};

// =====================================================================
// 1. LẤY DANH SÁCH CÂU HỎI THEO CHƯƠNG (Bao gồm cả Options)
// =====================================================================
export const getQuestionsByChapter = async (req, res) => {
  const { chapterId } = req.params;

  try {
    const qQuestions = `
      SELECT * FROM QuestionBank
      WHERE CourseChapterId = ?
      ORDER BY CreatedAt DESC
    `;
    const questions = await query(qQuestions, [chapterId]);

    if (!questions || questions.length === 0) {
      return res.status(200).json([]);
    }

    const questionIds = questions.map((q) => q.QuestionId);

    const qOptions = `
      SELECT * FROM QuestionOptions
      WHERE QuestionId IN (?)
      ORDER BY OptionId ASC
    `;
    const options = await query(qOptions, [questionIds]);

    const result = questions.map((q) => {
      const relatedOptions = options.filter(
        (opt) => opt.QuestionId === q.QuestionId
      );
      return {
        ...q,
        Options: relatedOptions.map((opt) => ({
          OptionId: opt.OptionId,
          OptionText: opt.OptionText,
          IsCorrect: !!opt.IsCorrect,
        })),
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy danh sách câu hỏi:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// =====================================================================
// 2. TẠO 1 CÂU HỎI MỚI (Kèm Options)
// =====================================================================
export const createQuestion = async (req, res) => {
  const {
    CourseChapterId,
    QuestionContent,
    QuestionType,
    DifficultyLevel,
    MediaUrl,
    MediaType,
    Answers,
  } = req.body;

  if (!CourseChapterId || !QuestionContent || !QuestionType) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  try {
    await beginTransaction();

    // 1. Insert Question
    const qInsertQuestion = `
      INSERT INTO QuestionBank
      (CourseChapterId, QuestionContent, QuestionType, DifficultyLevel, MediaUrl, MediaType)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const questionResult = await query(qInsertQuestion, [
      CourseChapterId,
      QuestionContent,
      QuestionType,
      DifficultyLevel || "Medium",
      MediaUrl || null,
      MediaType || "None",
    ]);

    const newQuestionId = questionResult.insertId;

    // 2. Insert Options
    if (Answers && Array.isArray(Answers) && Answers.length > 0) {
      const optionValues = Answers.map((ans) => [
        newQuestionId,
        ans.OptionText,
        ans.IsCorrect ? 1 : 0,
      ]);

      const qInsertOptions = `
        INSERT INTO QuestionOptions (QuestionId, OptionText, IsCorrect)
        VALUES ?
      `;
      // Lưu ý: optionValues phải bọc trong mảng nữa: [ [a,b,c], [d,e,f] ] -> [Values]
      await query(qInsertOptions, [optionValues]);
    }

    await commit();

    return res.status(201).json({
      message: "Thêm câu hỏi thành công.",
      QuestionId: newQuestionId,
    });
  } catch (err) {
    await rollback();
    console.error("Lỗi tạo câu hỏi:", err);
    return res.status(500).json({
      message: "Lỗi server khi tạo câu hỏi.",
      error: err.message,
    });
  }
};

// =====================================================================
// 3. CẬP NHẬT CÂU HỎI
// =====================================================================
export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const {
    QuestionContent,
    QuestionType,
    DifficultyLevel,
    MediaUrl,
    MediaType,
    Answers,
  } = req.body;

  try {
    await beginTransaction();

    // 1. Update QuestionBank
    const qUpdate = `
      UPDATE QuestionBank
      SET QuestionContent=?, QuestionType=?, DifficultyLevel=?, MediaUrl=?, MediaType=?
      WHERE QuestionId=?
    `;
    await query(qUpdate, [
      QuestionContent,
      QuestionType,
      DifficultyLevel,
      MediaUrl,
      MediaType,
      id,
    ]);

    // 2. Delete Old Options
    await query("DELETE FROM QuestionOptions WHERE QuestionId = ?", [id]);

    // 3. Insert New Options
    if (Answers && Array.isArray(Answers) && Answers.length > 0) {
      const optionValues = Answers.map((ans) => [
        id,
        ans.OptionText,
        ans.IsCorrect ? 1 : 0,
      ]);

      const qInsertOptions = `
        INSERT INTO QuestionOptions (QuestionId, OptionText, IsCorrect)
        VALUES ?
      `;
      await query(qInsertOptions, [optionValues]);
    }

    await commit();
    return res.status(200).json({ message: "Cập nhật câu hỏi thành công." });
  } catch (err) {
    await rollback();
    console.error("Lỗi cập nhật câu hỏi:", err);
    return res.status(500).json({ message: "Lỗi server khi cập nhật." });
  }
};

// =====================================================================
// 4. XÓA CÂU HỎI
// =====================================================================
export const deleteQuestions = async (req, res) => {
  const { ids } = req.body;

  if (!ids)
    return res.status(400).json({ message: "Chưa chọn câu hỏi để xóa." });

  const idList = Array.isArray(ids) ? ids : [ids];

  if (idList.length === 0)
    return res.status(400).json({ message: "Danh sách ID rỗng." });

  try {
    const q = `DELETE FROM QuestionBank WHERE QuestionId IN (?)`;
    await query(q, [idList]);

    return res.status(200).json({ message: "Đã xóa câu hỏi thành công." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server khi xóa." });
  }
};

// =====================================================================
// 5. IMPORT NHIỀU CÂU HỎI (Bulk Insert JSON)
// =====================================================================
export const importQuestions = async (req, res) => {
  const { chapterId, questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "Danh sách trống." });
  }

  try {
    await beginTransaction();

    for (const q of questions) {
      // 1. Insert Question
      const qInsert = `
        INSERT INTO QuestionBank (CourseChapterId, QuestionContent, QuestionType, DifficultyLevel)
        VALUES (?, ?, ?, ?)
      `;
      const resQ = await query(qInsert, [
        chapterId,
        q.QuestionContent,
        q.QuestionType || "SingleChoice",
        q.DifficultyLevel || "Medium",
      ]);
      const newId = resQ.insertId;

      // 2. Insert Options
      if (q.Answers && q.Answers.length > 0) {
        const optValues = q.Answers.map((a) => [
          newId,
          a.OptionText,
          a.IsCorrect ? 1 : 0,
        ]);
        await query(
          "INSERT INTO QuestionOptions (QuestionId, OptionText, IsCorrect) VALUES ?",
          [optValues]
        );
      }
    }

    await commit();
    return res
      .status(201)
      .json({ message: `Đã import thành công ${questions.length} câu hỏi.` });
  } catch (err) {
    await rollback();
    console.error("Lỗi Import:", err);
    return res.status(500).json({ message: "Lỗi server khi import dữ liệu." });
  }
};

// =====================================================================
// 6. IMPORT CÂU HỎI TỪ FILE EXCEL
// =====================================================================
export const importQuestionsFromFile = async (req, res) => {
  const { chapterId } = req.body;
  const file = req.file;

  if (!file)
    return res.status(400).json({ message: "Vui lòng upload file Excel." });
  if (!chapterId) return res.status(400).json({ message: "Thiếu ChapterId." });

  try {
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawData.length === 0) {
      return res.status(400).json({ message: "File Excel rỗng." });
    }

    const formattedQuestions = [];

    rawData.forEach((row) => {
      if (!row.QuestionContent) return;

      const answers = [];
      let correctKeys = [];
      if (row.CorrectAnswer) {
        correctKeys = row.CorrectAnswer.toString()
          .toUpperCase()
          .split(/[ ,]+/)
          .map((k) => k.trim());
      }

      const addOption = (text, key) => {
        if (
          text !== undefined &&
          text !== null &&
          text.toString().trim() !== ""
        ) {
          answers.push({
            OptionText: text.toString(),
            IsCorrect: correctKeys.includes(key),
          });
        }
      };

      addOption(row.OptionA, "A");
      addOption(row.OptionB, "B");
      addOption(row.OptionC, "C");
      addOption(row.OptionD, "D");

      formattedQuestions.push({
        QuestionContent: row.QuestionContent,
        QuestionType: row.Type || "SingleChoice",
        DifficultyLevel: row.Level || "Medium",
        Answers: answers,
      });
    });

    if (formattedQuestions.length === 0) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy dữ liệu hợp lệ trong file." });
    }

    await beginTransaction();

    for (const q of formattedQuestions) {
      const qInsert = `
        INSERT INTO QuestionBank (CourseChapterId, QuestionContent, QuestionType, DifficultyLevel)
        VALUES (?, ?, ?, ?)
      `;
      const resQ = await query(qInsert, [
        chapterId,
        q.QuestionContent,
        q.QuestionType,
        q.DifficultyLevel,
      ]);
      const newId = resQ.insertId;

      if (q.Answers && q.Answers.length > 0) {
        const optValues = q.Answers.map((a) => [
          newId,
          a.OptionText,
          a.IsCorrect ? 1 : 0,
        ]);
        await query(
          "INSERT INTO QuestionOptions (QuestionId, OptionText, IsCorrect) VALUES ?",
          [optValues]
        );
      }
    }

    await commit();
    return res.status(201).json({
      message: `Đã import thành công ${formattedQuestions.length} câu hỏi từ Excel.`,
    });
  } catch (err) {
    await rollback();
    console.error("Lỗi Import Excel:", err);
    return res.status(500).json({ message: "Lỗi server khi xử lý file." });
  }
};

// =====================================================================
// 7. LẤY CÂU HỎI THEO KHÓA HỌC (FLAT LIST) - ĐÃ SỬA
// =====================================================================
export const getQuestionsByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    // SỬA: CC.Title AS ChapterName (Mapping Title -> ChapterName)
    const qQuestions = `
      SELECT QB.*, 
             CC.Title AS ChapterName, 
             CC.OrderIndex as ChapterOrder
      FROM QuestionBank QB
      JOIN CourseChapters CC ON QB.CourseChapterId = CC.CourseChapterId
      WHERE CC.CourseId = ?
      ORDER BY CC.OrderIndex ASC, QB.CreatedAt DESC
    `;
    const questions = await query(qQuestions, [courseId]);

    if (!questions || questions.length === 0) return res.status(200).json([]);

    const questionIds = questions.map((q) => q.QuestionId);

    const qOptions = `
      SELECT * FROM QuestionOptions
      WHERE QuestionId IN (?)
      ORDER BY OptionId ASC
    `;
    const options = await query(qOptions, [questionIds]);

    const result = questions.map((q) => {
      const relatedOptions = options.filter(
        (opt) => opt.QuestionId === q.QuestionId
      );
      return {
        ...q,
        Options: relatedOptions.map((opt) => ({
          OptionId: opt.OptionId,
          OptionText: opt.OptionText,
          IsCorrect: !!opt.IsCorrect,
        })),
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy câu hỏi theo khóa học:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
// =====================================================================
// 8. LẤY TẤT CẢ CÂU HỎI THEO TỪNG CHƯƠNG (GROUPED) - UPDATE
// =====================================================================
export const getFullQuestionsByCourseGrouped = async (req, res) => {
  const { courseId } = req.params;
  try {
    // --- BƯỚC 1: QUERY CÂU HỎI (KÈM CHAPTER TRỐNG) ---
    // Sử dụng LEFT JOIN: Luôn lấy tất cả dòng từ CourseChapters (CC)
    // Nếu không có câu hỏi tương ứng trong QuestionBank (QB), các trường của QB sẽ là NULL
    const sql = `
      SELECT 
        CC.CourseChapterId, 
        CC.Title AS ChapterName, 
        CC.OrderIndex as ChapterOrder,
        QB.* FROM CourseChapters CC
      LEFT JOIN QuestionBank QB ON CC.CourseChapterId = QB.CourseChapterId
      WHERE CC.CourseId = ?
      ORDER BY CC.OrderIndex ASC, QB.CreatedAt DESC
    `;
    const questions = await query(sql, [courseId]);

    // Nếu không có dữ liệu (thậm chí không có chapter nào), trả về mảng rỗng
    if (!questions || questions.length === 0) return res.status(200).json([]);

    // --- BƯỚC 2: LẤY OPTIONS (CHỈ CHO CÁC CÂU HỎI TỒN TẠI) ---
    // Lọc bỏ các dòng có QuestionId = null (do chapter trống sinh ra) trước khi query Options
    const questionIds = questions
      .filter((q) => q.QuestionId) // Chỉ lấy dòng có câu hỏi thật
      .map((q) => q.QuestionId);

    let allOptions = [];
    if (questionIds.length > 0) {
      // Dùng DISTINCT hoặc Set để tránh trùng ID nếu database có vấn đề (optional)
      const uniqueIds = [...new Set(questionIds)];
      const qOptions = `SELECT * FROM QuestionOptions WHERE QuestionId IN (?) ORDER BY OptionId ASC`;
      allOptions = await query(qOptions, [uniqueIds]);
    }

    // --- BƯỚC 3: GOM NHÓM DỮ LIỆU ---
    const groupedData = questions.reduce((acc, row) => {
      // Tách thông tin chương
      const { CourseChapterId, ChapterName, ChapterOrder, ...qData } = row;

      // Tìm xem Chapter này đã có trong danh sách kết quả (acc) chưa
      let chapter = acc.find((c) => c.CourseChapterId === CourseChapterId);

      // Nếu chưa có, tạo mới Chapter (Lúc này Questions đang rỗng)
      if (!chapter) {
        chapter = {
          CourseChapterId,
          ChapterName,
          ChapterOrder,
          Questions: [],
        };
        acc.push(chapter);
      }

      // QUAN TRỌNG: Chỉ thêm câu hỏi nếu QuestionId tồn tại (khác NULL)
      // Dòng này xử lý việc Chapter trống: SQL trả về row nhưng QuestionId là null -> Bỏ qua if này -> Questions vẫn rỗng.
      if (qData.QuestionId) {
        const relatedOptions = allOptions.filter(
          (opt) => opt.QuestionId === qData.QuestionId
        );

        chapter.Questions.push({
          ...qData,
          Options: relatedOptions.map((opt) => ({
            OptionId: opt.OptionId,
            OptionText: opt.OptionText,
            IsCorrect: !!opt.IsCorrect, // Ép kiểu boolean cho chắc chắn
          })),
        });
      }

      return acc;
    }, []);

    return res.status(200).json(groupedData);
  } catch (err) {
    console.error("Lỗi lấy câu hỏi theo chương:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// =====================================================================
// 9. LẤY CÂU HỎI CỦA MỘT QUIZ - UPDATE
// =====================================================================
export const getQuestionsByQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    // THAY ĐỔI:
    // 1. Dùng QB.* để lấy hết thông tin câu hỏi.
    // 2. LEFT JOIN thêm CourseChapters để lấy ChapterName (CC.Title) -> Giúp hiển thị context ở Frontend
    const qSql = `
      SELECT QQM.OrderIndex as QuestionOrder, QQM.ScoreWeight,
             QB.*,
             CC.Title AS ChapterName
      FROM Quiz_Question_Mapping QQM
      JOIN QuestionBank QB ON QQM.QuestionId = QB.QuestionId
      LEFT JOIN CourseChapters CC ON QB.CourseChapterId = CC.CourseChapterId
      WHERE QQM.QuizId = ?
      ORDER BY QQM.OrderIndex ASC
    `;
    const questions = await query(qSql, [quizId]);

    if (!questions || questions.length === 0) return res.status(200).json([]);

    const questionIds = questions.map((q) => q.QuestionId);

    const oSql = `SELECT * FROM QuestionOptions WHERE QuestionId IN (?) ORDER BY OptionId ASC`;
    const options = await query(oSql, [questionIds]);

    const result = questions.map((q) => {
      const relatedOptions = options.filter(
        (opt) => opt.QuestionId === q.QuestionId
      );
      return {
        ...q,
        // Dữ liệu trả về sẽ bao gồm: QuestionId, QuestionContent, Type, Level, ChapterName, ...
        Options: relatedOptions.map((opt) => ({
          OptionId: opt.OptionId,
          OptionText: opt.OptionText,
          IsCorrect: !!opt.IsCorrect,
        })),
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy câu hỏi của Quiz:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
