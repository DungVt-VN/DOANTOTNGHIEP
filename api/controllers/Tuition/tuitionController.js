import { db } from "../../db.js";

// ==================================================================
// HÀM WRAPPER: Chuyển đổi callback sang Promise chuẩn
// ==================================================================
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// ==================================================================
// HÀM PHỤ TRỢ: Tự động tính toán và cập nhật trạng thái IsPaid
// ==================================================================
const syncPaymentStatus = async (classId, studentId) => {
  try {
    // 1. Lấy mức học phí chuẩn của lớp (TuitionFee)
    const classInfo = await query(
      "SELECT TuitionFee FROM Classes WHERE ClassId = ?",
      [classId],
    );

    // Nếu không tìm thấy lớp, dừng lại
    if (!classInfo || classInfo.length === 0) return;

    const requiredFee = parseFloat(classInfo[0].TuitionFee) || 0;

    // 2. Tính tổng số tiền học viên ĐÃ ĐÓNG (Chỉ tính trạng thái 'Completed')
    const paymentSum = await query(
      `SELECT SUM(Amount) as TotalPaid 
       FROM TuitionPayments 
       WHERE ClassId = ? AND StudentId = ? AND Status = 'Completed'`,
      [classId, studentId],
    );

    const totalPaid = parseFloat(paymentSum[0].TotalPaid) || 0;

    // 3. Logic so sánh:
    // - Nếu học phí <= 0 (Lớp miễn phí) -> Coi như đã đóng (IsPaid = 1)
    // - Nếu Tổng đã đóng >= Học phí -> Đã đóng đủ (IsPaid = 1)
    // - Ngược lại -> Chưa đóng đủ (IsPaid = 0)
    let isPaid = 0;
    if (requiredFee <= 0) {
      isPaid = 1;
    } else if (totalPaid >= requiredFee) {
      isPaid = 1;
    }

    // 4. Update trạng thái vào bảng Class_Student
    await query(
      "UPDATE Class_Student SET IsPaid = ? WHERE ClassId = ? AND StudentId = ?",
      [isPaid, classId, studentId],
    );

    // Log ra console để debug (có thể xóa khi chạy production)
    console.log(
      `[Sync Payment] Class: ${classId}, Student: ${studentId} | Fee: ${requiredFee}, Paid: ${totalPaid} -> IsPaid: ${isPaid}`,
    );
  } catch (error) {
    console.error("Lỗi khi đồng bộ trạng thái IsPaid:", error);
    // Không throw lỗi ra ngoài để tránh làm crash luồng chính
  }
};

// ==================================================================
// API HANDLERS
// ==================================================================

// 1. Lấy danh sách công nợ (GET /api/tuition/debts)
export const getTuitionDebts = async (req, res) => {
  try {
    // SQL Logic:
    // 1. Lấy tất cả học viên đang theo học các lớp (Class_Student)
    // 2. LEFT JOIN với bảng Thanh toán (TuitionPayments) để tính tổng tiền ĐÃ ĐÓNG (Status = 'Completed')
    // 3. Tính toán cột 'Remaining' (Còn thiếu)

    const q = `
      SELECT 
        s.StudentId,
        s.FullName,
        s.StudentCode,
        c.ClassId,
        c.ClassName,
        c.TuitionFee,
        -- Tính tổng tiền đã đóng (Chỉ tính trạng thái Completed)
        COALESCE(SUM(CASE WHEN tp.Status = 'Completed' THEN tp.Amount ELSE 0 END), 0) as TotalPaid,
        -- Tính số tiền còn thiếu
        (c.TuitionFee - COALESCE(SUM(CASE WHEN tp.Status = 'Completed' THEN tp.Amount ELSE 0 END), 0)) as Remaining
      FROM Class_Student cs
      JOIN Students s ON cs.StudentId = s.StudentId
      JOIN Classes c ON cs.ClassId = c.ClassId
      LEFT JOIN TuitionPayments tp ON cs.ClassId = tp.ClassId AND cs.StudentId = tp.StudentId
      GROUP BY s.StudentId, c.ClassId, s.FullName, s.StudentCode, c.ClassName, c.TuitionFee
      ORDER BY Remaining DESC, c.ClassId ASC
    `;

    const data = await query(q);

    // Tính thêm phần trăm (%) để Frontend vẽ thanh tiến độ
    const processedData = data.map((item) => {
      const fee = parseFloat(item.TuitionFee) || 0;
      const paid = parseFloat(item.TotalPaid) || 0;
      const remaining = parseFloat(item.Remaining) || 0;

      let percent = 0;
      if (fee > 0) {
        percent = Math.round((paid / fee) * 100);
      } else {
        percent = 100; // Học phí = 0 thì coi như xong
      }

      return {
        ...item,
        Percent: percent > 100 ? 100 : percent,
        OverPaid: remaining < 0 ? Math.abs(remaining) : 0, // Nếu đóng thừa
        Remaining: remaining > 0 ? remaining : 0, // Không lấy số âm cho phần còn lại
      };
    });

    return res.status(200).json(processedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi lấy dữ liệu công nợ", error });
  }
};

// 2. Lấy danh sách phiếu thu (GET /api/tuition/all)
export const getAllPayments = async (req, res) => {
  try {
    const sql = `
      SELECT 
        tp.PaymentId, 
        tp.StudentId, 
        tp.ClassId, 
        tp.Amount, 
        tp.PaymentDate, 
        tp.Note, 
        tp.Status,
        s.FullName AS StudentName, 
        s.StudentCode, 
        c.ClassName,
        c.TuitionFee -- Lấy thêm học phí gốc để hiển thị so sánh nếu cần
      FROM TuitionPayments tp
      LEFT JOIN Students s ON tp.StudentId = s.StudentId
      LEFT JOIN Classes c ON tp.ClassId = c.ClassId
      ORDER BY tp.PaymentDate DESC
    `;

    const results = await query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi lấy danh sách học phí.");
  }
};

// 3. Tạo phiếu thu mới (POST /api/tuition/create)
export const createPayment = async (req, res) => {
  try {
    const { ClassId, StudentId, Amount, Status, Note } = req.body;

    // Validate dữ liệu đầu vào
    if (!ClassId || !StudentId || !Amount) {
      return res
        .status(400)
        .json("Thiếu thông tin bắt buộc (Lớp, Học viên, Số tiền).");
    }

    // Mặc định Status là Completed nếu không gửi lên
    const finalStatus = Status || "Completed";

    const sql = `
      INSERT INTO TuitionPayments (ClassId, StudentId, Amount, Status, Note, PaymentDate)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await query(sql, [ClassId, StudentId, Amount, finalStatus, Note]);

    // QUAN TRỌNG: Gọi hàm đồng bộ để cập nhật IsPaid bên bảng Class_Student
    await syncPaymentStatus(ClassId, StudentId);

    return res.status(200).json("Tạo phiếu thu thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi tạo phiếu thu.");
  }
};

// 4. Cập nhật phiếu thu (PUT /api/tuition/:id)
// Dùng khi Admin sửa sai số tiền hoặc ghi chú
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { Amount, Status, Note } = req.body;

    // Cần lấy ClassId và StudentId của phiếu này trước khi sửa
    const currentPayment = await query(
      "SELECT ClassId, StudentId FROM TuitionPayments WHERE PaymentId = ?",
      [id],
    );

    if (!currentPayment || currentPayment.length === 0) {
      return res.status(404).json("Không tìm thấy phiếu thu.");
    }

    const sql = `
      UPDATE TuitionPayments 
      SET Amount = ?, Status = ?, Note = ?
      WHERE PaymentId = ?
    `;

    await query(sql, [Amount, Status, Note, id]);

    // Đồng bộ lại trạng thái vì số tiền hoặc status đã thay đổi
    await syncPaymentStatus(
      currentPayment[0].ClassId,
      currentPayment[0].StudentId,
    );

    return res.status(200).json("Cập nhật phiếu thu thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi cập nhật.");
  }
};

// 5. Cập nhật nhanh trạng thái (PUT /api/tuition/:id/status)
// Dùng cho nút chuyển trạng thái nhanh trên giao diện
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Completed', 'Pending', 'Failed'

    const currentPayment = await query(
      "SELECT ClassId, StudentId FROM TuitionPayments WHERE PaymentId = ?",
      [id],
    );

    if (!currentPayment || currentPayment.length === 0) {
      return res.status(404).json("Không tìm thấy phiếu thu.");
    }

    await query("UPDATE TuitionPayments SET Status = ? WHERE PaymentId = ?", [
      status,
      id,
    ]);

    // Đồng bộ lại trạng thái
    await syncPaymentStatus(
      currentPayment[0].ClassId,
      currentPayment[0].StudentId,
    );

    return res.status(200).json("Cập nhật trạng thái thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server.");
  }
};

export const getTuitionSummary = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(401).json("Không xác thực được người dùng.");
    }

    // QUERY 1: Lấy danh sách các lớp và tính toán số tiền Còn Nợ
    // Logic: (Học phí gốc) - (Tổng tiền đã đóng Completed) = Còn nợ
    const sqlUnpaid = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.TuitionFee as TotalFee,
        COALESCE(SUM(CASE WHEN tp.Status = 'Completed' THEN tp.Amount ELSE 0 END), 0) as PaidAmount,
        (c.TuitionFee - COALESCE(SUM(CASE WHEN tp.Status = 'Completed' THEN tp.Amount ELSE 0 END), 0)) as RemainingDebt
      FROM Class_Student cs
      JOIN Classes c ON cs.ClassId = c.ClassId
      LEFT JOIN TuitionPayments tp ON c.ClassId = tp.ClassId AND tp.StudentId = cs.StudentId
      WHERE cs.StudentId = ?
      GROUP BY c.ClassId, c.ClassName, c.TuitionFee
      HAVING RemainingDebt > 0
    `;

    const unpaidClasses = await query(sqlUnpaid, [studentId]);

    // QUERY 2: Tính tổng số tiền đã đóng từ trước đến nay (để hiển thị thống kê)
    const sqlTotalPaid = `
      SELECT COALESCE(SUM(Amount), 0) as TotalPaid
      FROM TuitionPayments 
      WHERE StudentId = ? AND Status = 'Completed'
    `;
    const [paidResult] = await query(sqlTotalPaid, [studentId]);

    // Tính tổng nợ từ danh sách các lớp nợ
    const totalDebt = unpaidClasses.reduce(
      (acc, curr) => acc + parseFloat(curr.RemainingDebt),
      0,
    );

    return res.status(200).json({
      totalPaid: parseFloat(paidResult.TotalPaid),
      totalDebt: totalDebt,
      unpaidClasses: unpaidClasses, // Danh sách chi tiết các lớp đang nợ để frontend vẽ nút "Thanh toán"
    });
  } catch (err) {
    console.error("Lỗi getTuitionSummary:", err);
    return res
      .status(500)
      .json({ message: "Lỗi lấy thông tin tổng hợp học phí", error: err });
  }
};

// 7. Lấy lịch sử giao dịch (GET /api/tuition/history)
export const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(401).json("Không xác thực được người dùng.");
    }

    const sql = `
      SELECT 
        tp.PaymentId,
        tp.Amount,
        tp.PaymentDate,
        tp.Status,
        tp.Note,
        c.ClassName,
        co.CourseName
      FROM TuitionPayments tp
      LEFT JOIN Classes c ON tp.ClassId = c.ClassId
      LEFT JOIN Courses co ON c.CourseId = co.CourseId
      WHERE tp.StudentId = ?
      ORDER BY tp.PaymentDate DESC
    `;

    const data = await query(sql, [studentId]);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi getPaymentHistory:", err);
    return res
      .status(500)
      .json({ message: "Lỗi lấy lịch sử giao dịch", error: err });
  }
};
