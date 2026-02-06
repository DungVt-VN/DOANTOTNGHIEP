import { db } from "../../db.js";
import util from "util";

// Chuyển đổi callback sang promise để dùng async/await
const queryAsync = util.promisify(db.query).bind(db);

// ==================================================================
// HÀM PHỤ TRỢ: Tự động tính toán và cập nhật trạng thái IsPaid
// ==================================================================
const syncPaymentStatus = async (classId, studentId) => {
  try {
    // 1. Lấy mức học phí chuẩn của lớp (TuitionFee)
    const [classInfo] = await queryAsync(
      "SELECT TuitionFee FROM Classes WHERE ClassId = ?",
      [classId]
    );

    // Nếu không tìm thấy lớp, dừng lại
    if (!classInfo) return;

    const requiredFee = parseFloat(classInfo.TuitionFee) || 0;

    // 2. Tính tổng số tiền học viên ĐÃ ĐÓNG (Chỉ tính trạng thái 'Completed')
    const [paymentSum] = await queryAsync(
      `SELECT SUM(Amount) as TotalPaid 
       FROM TuitionPayments 
       WHERE ClassId = ? AND StudentId = ? AND Status = 'Completed'`,
      [classId, studentId]
    );

    const totalPaid = parseFloat(paymentSum.TotalPaid) || 0;

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
    await queryAsync(
      "UPDATE Class_Student SET IsPaid = ? WHERE ClassId = ? AND StudentId = ?",
      [isPaid, classId, studentId]
    );

    // Log ra console để debug (có thể xóa khi chạy production)
    console.log(
      `[Sync Payment] Class: ${classId}, Student: ${studentId} | Fee: ${requiredFee}, Paid: ${totalPaid} -> IsPaid: ${isPaid}`
    );
  } catch (error) {
    console.error("Lỗi khi đồng bộ trạng thái IsPaid:", error);
    // Không throw lỗi ra ngoài để tránh làm crash luồng chính
  }
};

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
      let percent = 0;
      if (item.TuitionFee > 0) {
        percent = Math.round((item.TotalPaid / item.TuitionFee) * 100);
      } else {
        percent = 100; // Học phí = 0 thì coi như xong
      }

      return {
        ...item,
        Percent: percent > 100 ? 100 : percent,
        OverPaid: item.Remaining < 0 ? Math.abs(item.Remaining) : 0, // Nếu đóng thừa
        Remaining: item.Remaining > 0 ? item.Remaining : 0, // Không lấy số âm
      };
    });

    return res.status(200).json(processedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi lấy dữ liệu công nợ", error });
  }
};

// ==================================================================
// API HANDLERS
// ==================================================================

// 1. Lấy danh sách phiếu thu (GET /api/tuition/all)
export const getAllPayments = async (req, res) => {
  try {
    const query = `
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

    const results = await queryAsync(query);
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi lấy danh sách học phí.");
  }
};

// 2. Tạo phiếu thu mới (POST /api/tuition/create)
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

    const query = `
      INSERT INTO TuitionPayments (ClassId, StudentId, Amount, Status, Note, PaymentDate)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await queryAsync(query, [ClassId, StudentId, Amount, finalStatus, Note]);

    // QUAN TRỌNG: Gọi hàm đồng bộ để cập nhật IsPaid bên bảng Class_Student
    await syncPaymentStatus(ClassId, StudentId);

    return res.status(200).json("Tạo phiếu thu thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi tạo phiếu thu.");
  }
};

// 3. Cập nhật phiếu thu (PUT /api/tuition/:id)
// Dùng khi Admin sửa sai số tiền hoặc ghi chú
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { Amount, Status, Note } = req.body;

    // Cần lấy ClassId và StudentId của phiếu này trước khi sửa
    const [currentPayment] = await queryAsync(
      "SELECT ClassId, StudentId FROM TuitionPayments WHERE PaymentId = ?",
      [id]
    );

    if (!currentPayment) {
      return res.status(404).json("Không tìm thấy phiếu thu.");
    }

    const query = `
      UPDATE TuitionPayments 
      SET Amount = ?, Status = ?, Note = ?
      WHERE PaymentId = ?
    `;

    await queryAsync(query, [Amount, Status, Note, id]);

    // Đồng bộ lại trạng thái vì số tiền hoặc status đã thay đổi
    await syncPaymentStatus(currentPayment.ClassId, currentPayment.StudentId);

    return res.status(200).json("Cập nhật phiếu thu thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server khi cập nhật.");
  }
};

// 4. Cập nhật nhanh trạng thái (PUT /api/tuition/:id/status)
// Dùng cho nút chuyển trạng thái nhanh trên giao diện
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Completed', 'Pending', 'Failed'

    const [currentPayment] = await queryAsync(
      "SELECT ClassId, StudentId FROM TuitionPayments WHERE PaymentId = ?",
      [id]
    );

    if (!currentPayment) {
      return res.status(404).json("Không tìm thấy phiếu thu.");
    }

    await queryAsync(
      "UPDATE TuitionPayments SET Status = ? WHERE PaymentId = ?",
      [status, id]
    );

    // Đồng bộ lại trạng thái
    await syncPaymentStatus(currentPayment.ClassId, currentPayment.StudentId);

    return res.status(200).json("Cập nhật trạng thái thành công.");
  } catch (err) {
    console.error(err);
    return res.status(500).json("Lỗi server.");
  }
};
