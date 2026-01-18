import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  Info,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { Tabs, Button, Badge, Empty, message } from "antd"; // Dùng Ant Design cho nhanh, hoặc bạn có thể code thuần

// --- MOCK DATA (Dữ liệu giả lập) ---
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Nhắc nhở lịch dạy",
    message: "Bạn có lớp Toán 10A1 bắt đầu lúc 18:00 hôm nay tại phòng P101.",
    type: "Schedule",
    isRead: false,
    createdAt: "2024-03-20T10:00:00",
  },
  {
    id: 2,
    title: "Nộp bài tập mới",
    message: "Học sinh Nguyễn Văn Nam đã nộp bài tập 'Phương trình bậc 2'.",
    type: "Assignment",
    isRead: false,
    createdAt: "2024-03-20T09:30:00",
  },
  {
    id: 3,
    title: "Bảo trì hệ thống",
    message: "Hệ thống sẽ bảo trì vào 00:00 ngày mai. Vui lòng lưu dữ liệu.",
    type: "System",
    isRead: true,
    createdAt: "2024-03-19T15:00:00",
  },
  {
    id: 4,
    title: "Cập nhật lương thưởng",
    message: "Bảng lương tháng 2 đã được cập nhật. Vui lòng kiểm tra.",
    type: "Payment",
    isRead: true,
    createdAt: "2024-03-15T08:00:00",
  },
];

const TeacherNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  useEffect(() => {
    // TODO: Gọi API lấy notification thật tại đây
    // const res = await api.get('/teacher/notifications');
    setNotifications(MOCK_NOTIFICATIONS);
  }, []);

  // Hàm lấy icon theo loại thông báo
  const getIcon = (type) => {
    switch (type) {
      case "Schedule":
        return <Calendar className="text-blue-500" size={20} />;
      case "Assignment":
        return <FileText className="text-green-500" size={20} />;
      case "System":
        return <AlertCircle className="text-red-500" size={20} />;
      case "Payment":
        return <Info className="text-purple-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  // Đánh dấu đã đọc 1 tin
  const handleMarkAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    // TODO: Gọi API update status
  };

  // Đánh dấu đã đọc tất cả
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    message.success("Đã đánh dấu tất cả là đã đọc");
    // TODO: Gọi API update all
  };

  // Lọc dữ liệu hiển thị
  const displayList =
    filter === "all" ? notifications : notifications.filter((n) => !n.isRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="text-blue-600" /> Thông báo
          </h1>
          {unreadCount > 0 && (
            <Badge count={unreadCount} overflowCount={99} color="red" />
          )}
        </div>
        <Button
          type="text"
          className="text-blue-600 font-medium hover:bg-blue-50"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <Check size={16} className="mr-1 inline" /> Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Tabs / Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        <div className="border-b px-6 pt-4">
          <Tabs
            defaultActiveKey="all"
            onChange={(key) => setFilter(key)}
            items={[
              { key: "all", label: "Tất cả" },
              { key: "unread", label: "Chưa đọc" },
            ]}
          />
        </div>

        {/* List Notification */}
        <div className="divide-y divide-gray-100">
          {displayList.length > 0 ? (
            displayList.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  !item.isRead ? "bg-blue-50/60" : "bg-white"
                }`}
                onClick={() => handleMarkAsRead(item.id)}
              >
                {/* Icon Box */}
                <div
                  className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${
                    !item.isRead ? "bg-white shadow-sm" : "bg-gray-100"
                  }`}
                >
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4
                      className={`text-base ${
                        !item.isRead
                          ? "font-bold text-gray-900"
                          : "font-medium text-gray-700"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap ml-2">
                      <Clock size={12} />
                      {/* Format ngày giờ đơn giản */}
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-sm ${
                      !item.isRead ? "text-gray-800" : "text-gray-500"
                    }`}
                  >
                    {item.message}
                  </p>
                </div>

                {/* Dot chỉ báo chưa đọc */}
                {!item.isRead && (
                  <div className="self-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center">
              <Empty description="Không có thông báo nào" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherNotification;
