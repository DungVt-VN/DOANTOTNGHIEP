import { db } from "../../db.js";

// Hàm wrapper (Giữ nguyên)
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// --- 1. LẤY THỐNG KÊ (Có lọc theo tháng/năm) ---
export const getAdminStats = async (req, res) => {
  try {
    // Lấy params từ request, nếu không có thì lấy tháng/năm hiện tại
    const month = req.query.month
      ? parseInt(req.query.month)
      : new Date().getMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();

    const studentsQ =
      "SELECT COUNT(*) as total FROM Users WHERE Role = 'Student'"; // Lưu ý: Database của bạn có thể phân biệt hoa thường ('Student' vs 'student'), check lại data cho chắc.
    const teachersQ =
      "SELECT COUNT(*) as total FROM Users WHERE Role = 'Teacher'";
    const classesQ =
      "SELECT COUNT(*) as total FROM Classes WHERE Status = 'Active'";

    // Revenue lọc theo tháng/năm dựa trên bảng TuitionPayments
    const revenueQ = `
        SELECT SUM(Amount) as total 
        FROM TuitionPayments 
        WHERE Status = 'Completed' 
        AND MONTH(PaymentDate) = ? 
        AND YEAR(PaymentDate) = ?
    `;

    const [studentsData, teachersData, classesData, revenueData] =
      await Promise.all([
        query(studentsQ),
        query(teachersQ),
        query(classesQ),
        query(revenueQ, [month, year]), // Truyền tham số tháng/năm
      ]);

    return res.status(200).json({
      totalStudents: studentsData[0]?.total || 0,
      totalTeachers: teachersData[0]?.total || 0,
      activeClasses: classesData[0]?.total || 0,
      // Ép kiểu về Number vì SUM trong MySQL đôi khi trả về string
      monthlyRevenue: Number(revenueData[0]?.total) || 0,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi lấy thống kê", error: error.message });
  }
};

// --- 2. LẤY DỮ LIỆU BIỂU ĐỒ (API Mới) ---
export const getDashboardChart = async (req, res) => {
  try {
    const month = req.query.month
      ? parseInt(req.query.month)
      : new Date().getMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();

    // Query 1: Doanh thu theo ngày (Lấy từ bảng TuitionPayments)
    const revenueChartQ = `
            SELECT 
                DATE_FORMAT(PaymentDate, '%d/%m') as day,
                SUM(Amount) as revenue
            FROM TuitionPayments
            WHERE Status = 'Completed'
            AND MONTH(PaymentDate) = ? 
            AND YEAR(PaymentDate) = ?
            GROUP BY day
            ORDER BY MIN(PaymentDate) ASC
        `;

    // Query 2: Số học viên mới (Giữ nguyên logic cũ lấy từ bảng Users)
    const studentChartQ = `
            SELECT 
                DATE_FORMAT(CreatedAt, '%d/%m') as day,
                COUNT(*) as students
            FROM Users
            WHERE Role = 'Student'
            AND MONTH(CreatedAt) = ? 
            AND YEAR(CreatedAt) = ?
            GROUP BY day
            ORDER BY MIN(CreatedAt) ASC
        `;

    const [revenueRes, studentRes] = await Promise.all([
      query(revenueChartQ, [month, year]),
      query(studentChartQ, [month, year]),
    ]);

    // Gộp dữ liệu (Logic giữ nguyên)
    const mergedData = {};

    revenueRes.forEach((item) => {
      mergedData[item.day] = {
        day: item.day,
        revenue: Number(item.revenue),
        students: 0,
      };
    });

    studentRes.forEach((item) => {
      if (!mergedData[item.day]) {
        mergedData[item.day] = {
          day: item.day,
          revenue: 0,
          students: item.students,
        };
      } else {
        mergedData[item.day].students = item.students;
      }
    });

    // Sort lại theo ngày
    const finalChartData = Object.values(mergedData).sort((a, b) => {
      // Vì format là dd/mm nên ta cần cẩn thận khi sort string
      // Cách tốt nhất là tách chuỗi để so sánh ngày
      const [dayA, monthA] = a.day.split("/");
      const [dayB, monthB] = b.day.split("/");
      return parseInt(dayA) - parseInt(dayB);
    });

    return res.status(200).json(finalChartData);
  } catch (error) {
    console.error("Dashboard Chart Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi lấy biểu đồ", error: error.message });
  }
};

export const getStudentDashboardStats = async (req, res) => {
  const studentId = req.params.userId;

  if (!studentId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    /* ================== 1. STATS ================== */
    const qStats = `
      SELECT 
        (
          SELECT COUNT(*)
          FROM Class_Student cs
          JOIN Classes c ON cs.ClassId = c.ClassId
          WHERE cs.StudentId = ?
            AND c.Status = 'Active'
        ) AS activeClasses,

        (
          SELECT COUNT(*)
          FROM Assignments a
          JOIN Class_Student cs ON a.ClassId = cs.ClassId
          LEFT JOIN Submissions s 
            ON a.AssignmentId = s.AssignmentId 
            AND s.StudentId = ?
          WHERE cs.StudentId = ?
            AND s.SubmissionId IS NULL
            AND a.DueDate >= NOW()
        ) AS pendingAssignments
    `;

    /* ================== 2. TODAY SCHEDULE ================== */
    const currentDay = new Date().getDay() + 1; // CN=1

    const qTodaySchedule = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.StartTime,
        c.EndTime,
        r.RoomName,
        t.FullName AS TeacherName
      FROM Class_Student cs
      JOIN Classes c ON cs.ClassId = c.ClassId
      LEFT JOIN Classrooms r ON c.RoomId = r.RoomId
      LEFT JOIN Teachers t ON c.TeacherId = t.TeacherId
      WHERE cs.StudentId = ?
        AND c.Status = 'Active'
        AND FIND_IN_SET(?, c.Days) > 0
      ORDER BY c.StartTime ASC
    `;

    /* ================== 3. URGENT ASSIGNMENTS ================== */
    const qUrgentTasks = `
      SELECT 
        a.AssignmentId,
        a.Title,
        a.DueDate,
        c.ClassName
      FROM Assignments a
      JOIN Class_Student cs ON a.ClassId = cs.ClassId
      JOIN Classes c ON cs.ClassId = c.ClassId
      LEFT JOIN Submissions s 
        ON a.AssignmentId = s.AssignmentId 
        AND s.StudentId = ?
      WHERE cs.StudentId = ?
        AND s.SubmissionId IS NULL
        AND a.DueDate >= NOW()
      ORDER BY a.DueDate ASC
      LIMIT 3
    `;

    const [stats] = await query(qStats, [studentId, studentId, studentId]);
    const todaySchedule = await query(qTodaySchedule, [studentId, currentDay]);
    const urgentTasks = await query(qUrgentTasks, [studentId, studentId]);

    return res.json({
      stats: stats[0],
      todaySchedule,
      urgentTasks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};
