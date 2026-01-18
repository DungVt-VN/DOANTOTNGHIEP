import { db } from "../../db.js";

// --- QUAN TRỌNG: Hàm wrapper để biến callback thành Promise ---
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

// 1. Xóa một thông báo cụ thể
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const q = "DELETE FROM Notifications WHERE NotiId = ?";

    // SỬA: Dùng query() và lấy result trực tiếp (không cần [ ])
    const result = await query(q, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông báo để xóa." });
    }

    return res.status(200).json({ message: "Đã xóa thông báo thành công." });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi xóa thông báo." });
  }
};

// 2. Đánh dấu TẤT CẢ thông báo của một User là đã đọc
export const markAllAsRead = async (req, res) => {
  const { userId } = req.body;
  try {
    const q = "UPDATE Notifications SET IsRead = 1 WHERE IsRead = 0";
    // Nếu muốn filter theo user thì thêm logic WHERE UserId = ? vào đây

    // SỬA: Dùng query()
    await query(q);

    return res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// 3. Xóa sạch thông báo (Dọn dẹp hệ thống)
export const clearAllNotifications = async (req, res) => {
  try {
    const q = "DELETE FROM Notifications";

    // SỬA: Dùng query()
    await query(q);

    return res
      .status(200)
      .json({ message: "Đã dọn dẹp toàn bộ thông báo hệ thống." });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// 4. Lấy danh sách thông báo
export const getNotifications = async (req, res) => {
  const { limit } = req.query;

  try {
    let q = `
      SELECT 
        n.NotiId, n.Title, n.Message, n.Type, n.IsRead, n.CreatedAt,
        u.UserId, u.UserName, u.Avatar 
      FROM Notifications n
      LEFT JOIN Users u ON n.UserId = u.UserId
      ORDER BY n.CreatedAt DESC
    `;

    const params = [];

    if (limit) {
      q += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    // --- SỬA QUAN TRỌNG ---
    // 1. Dùng hàm query()
    // 2. KHÔNG DÙNG const [notifications], mà dùng const notifications
    // Vì hàm wrapper trả về thẳng rows, không phải [rows, fields]
    const notifications = await query(q, params);

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy thông báo." });
  }
};

// 5. Đánh dấu 1 thông báo đã đọc
export const markAsRead = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Thiếu ID thông báo" });

  try {
    const q = `UPDATE Notifications SET IsRead = 1 WHERE NotiId = ?`;

    // SỬA: Dùng query()
    await query(q, [id]);

    return res.status(200).json({ message: "Đã đánh dấu đã đọc." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// 6. Hàm Helper nội bộ
export const createNotificationInternal = async (
  userId,
  title,
  message,
  type
) => {
  try {
    const q = `INSERT INTO Notifications (UserId, Title, Message, Type) VALUES (?, ?, ?, ?)`;

    // SỬA: Dùng query()
    await query(q, [userId, title, message, type]);
  } catch (error) {
    console.error("Error creating notification log:", error);
  }
};
