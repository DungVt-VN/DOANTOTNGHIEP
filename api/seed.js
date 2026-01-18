import { db } from "./db.js"; // Đảm bảo đường dẫn tới file db.js đúng
import bcrypt from "bcryptjs";

const seedData = async () => {
  console.log("🌱 Đang khởi tạo dữ liệu mẫu...");

  try {
    // 1. Kiểm tra xem đã có dữ liệu chưa
    const [rows] = await db
      .promise()
      .query("SELECT COUNT(*) as count FROM Users");
    if (rows[0].count > 0) {
      console.log(
        `⚠️  Database đã có ${rows[0].count} tài khoản. Không cần Seed lại.`
      );
      process.exit(0);
    }

    // 2. Chuẩn bị mật khẩu hash chung
    const hashedPassword = bcrypt.hashSync("123456", 10);

    // =========================================================
    // BƯỚC 1: TẠO USERS
    // =========================================================
    console.log("👉 Đang tạo Users...");
    const usersData = [
      ["admin_system", hashedPassword, "admin@lms.edu.vn", "Admin"],
      ["teacher_phuong", hashedPassword, "phuong.nguyen@lms.edu.vn", "Teacher"],
      ["teacher_hoang", hashedPassword, "hoang.le@lms.edu.vn", "Teacher"],
      ["student_nam", hashedPassword, "nam.tran@student.com", "Student"],
      ["student_mai", hashedPassword, "mai.nguyen@student.com", "Student"],
    ];
    await db
      .promise()
      .query("INSERT INTO Users (UserName, Password, Email, Role) VALUES ?", [
        usersData,
      ]);

    // =========================================================
    // BƯỚC 2: TẠO TEACHERS & STUDENTS
    // (Giả định ID Users lần lượt là 1, 2, 3, 4, 5 do auto_increment)
    // =========================================================
    console.log("👉 Đang tạo Teachers & Students...");

    const teachersData = [
      [2, "Nguyễn Mai Phương", "0912345678", "TCH001", 500000],
      [3, "Lê Minh Hoàng", "0987654321", "TCH002", 450000],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO Teachers (UserId, FullName, PhoneNo, TeacherCode, SalaryRate) VALUES ?",
        [teachersData]
      );

    const studentsData = [
      [4, "Trần Văn Nam", "STD001", "0901112223", "THPT Kim Liên"],
      [5, "Nguyễn Thanh Mai", "STD002", "0904445556", "THPT Chu Văn An"],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO Students (UserId, FullName, StudentCode, PhoneNo, SchoolName) VALUES ?",
        [studentsData]
      );

    // =========================================================
    // BƯỚC 3: CLASSROOMS & COURSES
    // =========================================================
    console.log("👉 Đang tạo Classrooms & Courses...");

    const classroomsData = [
      ["Phòng Lý Thuyết 1", "Tầng 2 - A1", 40],
      ["Phòng Lab IT", "Tầng 3 - B2", 20],
    ];
    await db
      .promise()
      .query("INSERT INTO Classrooms (RoomName, Location, Capacity) VALUES ?", [
        classroomsData,
      ]);

    const coursesData = [
      [
        "Toán Học 12 - Ôn Thi THPT Quốc Gia",
        "Toán",
        "Luyện giải đề và củng cố kiến thức lớp 12",
        2000000,
      ],
      [
        "Tiếng Anh Giao Tiếp Cơ Bản",
        "Tiếng Anh",
        "Học phát âm và phản xạ 4 kỹ năng",
        1500000,
      ],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO Courses (CourseName, Subject, Description, BaseTuitionFee) VALUES ?",
        [coursesData]
      );

    // =========================================================
    // BƯỚC 4: COURSE CHAPTERS
    // =========================================================
    console.log("👉 Đang tạo Course Chapters...");
    const chaptersData = [
      [1, "Chương 1: Ứng dụng đạo hàm", 1],
      [1, "Chương 2: Hàm số lũy thừa", 2],
      [2, "Unit 1: Self-Introduction", 1],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO CourseChapters (CourseId, Title, OrderIndex) VALUES ?",
        [chaptersData]
      );

    // =========================================================
    // BƯỚC 5: QUESTION BANK & OPTIONS
    // =========================================================
    console.log("👉 Đang tạo Ngân hàng câu hỏi...");
    const questionsData = [
      [1, "Đạo hàm của hàm số y = x^2 là?", "SingleChoice", "Easy"],
      [
        1,
        "Chọn các phát biểu đúng về cực trị hàm số?",
        "MultipleChoice",
        "Medium",
      ],
      [
        3,
        "Viết đoạn văn ngắn giới thiệu về bản thân bạn bằng tiếng Anh?",
        "TextInput",
        "Medium",
      ],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO QuestionBank (CourseChapterId, QuestionContent, QuestionType, DifficultyLevel) VALUES ?",
        [questionsData]
      );

    const optionsData = [
      [1, "2x", true],
      [1, "x", false],
      [1, "2", false],
      [2, "Hàm số đạt cực trị khi đạo hàm đổi dấu", true],
      [2, "Hàm số đạt cực đại luôn lớn hơn cực tiểu", false],
      [2, "Điểm cực trị thuộc tập xác định", true],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO QuestionOptions (QuestionId, OptionText, IsCorrect) VALUES ?",
        [optionsData]
      );

    // =========================================================
    // BƯỚC 6: CLASSES (Lớp học)
    // =========================================================
    console.log("👉 Đang tạo Classes...");
    // Lưu ý: StartDate/EndDate format YYYY-MM-DD
    const classesData = [
      [
        1,
        1,
        1,
        "Lớp Toán 12-A1",
        "2024-01-10",
        "2024-06-10",
        "2,4,6",
        "18:00:00",
        "20:00:00",
        2000000,
        "Active",
      ],
      [
        2,
        2,
        2,
        "Lớp Anh GT-01",
        "2024-02-01",
        "2024-05-01",
        "3,5",
        "19:30:00",
        "21:00:00",
        1500000,
        "Recruiting",
      ],
    ];
    await db.promise().query(
      `INSERT INTO Classes 
      (CourseId, TeacherId, RoomId, ClassName, StartDate, EndDate, Days, StartTime, EndTime, TuitionFee, Status) 
      VALUES ?`,
      [classesData]
    );

    // =========================================================
    // BƯỚC 7: ENROLLMENT, LESSONS, PAYMENTS, ATTENDANCE
    // =========================================================
    console.log("👉 Đang tạo dữ liệu vận hành (Học viên, Bài học, Học phí)...");

    // Class_Student
    const enrollmentData = [
      [1, 1], // Lớp 1, SV 1
      [1, 2], // Lớp 1, SV 2
      [2, 2], // Lớp 2, SV 2
    ];
    await db
      .promise()
      .query("INSERT INTO Class_Student (ClassId, StudentId) VALUES ?", [
        enrollmentData,
      ]);

    // Lessons
    const lessonsData = [
      [
        1,
        1,
        "Bài 1: Sự đồng biến, nghịch biến của hàm số",
        "https://youtube.com/v=xyz",
        1,
      ],
      [1, 1, "Bài 2: Cực trị của hàm số", "https://youtube.com/v=abc", 2],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO Lessons (ChapterId, ClassId, Title, VideoUrl, OrderIndex) VALUES ?",
        [lessonsData]
      );

    // TuitionPayments
    const paymentsData = [
      [1, 1, 2000000, "Completed", "Đã nộp qua Momo"],
      [2, 1, 1000000, "Pending", "Mới cọc 50%"],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO TuitionPayments (StudentId, ClassId, Amount, Status, Note) VALUES ?",
        [paymentsData]
      );

    // Attendance
    const attendanceData = [
      [1, 1, "2024-01-10", "Present"],
      [1, 2, "2024-01-10", "Absent"],
    ];
    await db
      .promise()
      .query(
        "INSERT INTO Attendance (ClassId, StudentId, Date, Status) VALUES ?",
        [attendanceData]
      );

    console.log("✅ SEED DATA THÀNH CÔNG! HỆ THỐNG ĐÃ SẴN SÀNG.");
    console.log("🔑 Tài khoản Admin: admin_system / 123456");
    process.exit(0);
  } catch (err) {
    console.error("❌ LỖI khi tạo dữ liệu:", err);
    process.exit(1);
  }
};

seedData();
