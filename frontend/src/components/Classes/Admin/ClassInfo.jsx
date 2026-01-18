import React, { useMemo } from "react";
import { Button, Tag, Card, Row, Col, Divider, Descriptions } from "antd";
import {
  ChevronLeft,
  LayoutDashboard,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Coins,
  Info,
  Edit,
} from "lucide-react";
import dayjs from "dayjs";

const ClassInfo = ({ data, onBack, onEnterDetail, onEdit }) => {
  if (!data) return null;

  // --- LOGIC TÍNH TOÁN FALLBACK ---
  // Tính tổng số buổi dựa trên StartDate, EndDate và Days nếu data.TotalSessions bị thiếu hoặc = 0
  const calculatedTotalSessions = useMemo(() => {
    // Nếu có sẵn data hợp lệ từ DB thì dùng luôn
    if (data.TotalSessions && data.TotalSessions > 0) return data.TotalSessions;

    // Nếu không, tính toán lại
    if (!data.StartDate || !data.EndDate || !data.Days) return 0;

    const start = dayjs(data.StartDate);
    const end = dayjs(data.EndDate);
    if (end.isBefore(start)) return 0;

    // Chuyển chuỗi "2,4,6" thành mảng số [2, 4, 6]
    // Lưu ý: Dayjs dùng 0 cho Chủ nhật, 1 cho Thứ 2...
    // Antd/Data dùng 2-7 cho Thứ 2-7, 8 hoặc 0 cho Chủ nhật (tuỳ quy ước DB của bạn)
    // Giả sử DB lưu: "2" là Thứ 2, "8" là Chủ nhật
    const targetDays = data.Days.split(",").map((d) => {
      const val = parseInt(d.trim());
      return val === 8 ? 0 : val - 1; // Map về chuẩn Dayjs (0=CN, 1=T2...)
    });

    let count = 0;
    let current = start.clone();

    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (targetDays.includes(current.day())) {
        count++;
      }
      current = current.add(1, "day");
    }
    return count;
  }, [data.StartDate, data.EndDate, data.Days, data.TotalSessions]);

  // Tính đơn giá/buổi nếu data.FeePerSession thiếu
  const calculatedFeePerSession = useMemo(() => {
    if (data.FeePerSession && data.FeePerSession > 0) return data.FeePerSession;

    // Nếu có Tổng học phí và Tổng số buổi -> Tính ngược lại
    if (data.TuitionFee && calculatedTotalSessions > 0) {
      return Math.round(data.TuitionFee / calculatedTotalSessions);
    }
    return 0;
  }, [data.FeePerSession, data.TuitionFee, calculatedTotalSessions]);

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (val) =>
    val ? `${new Intl.NumberFormat("vi-VN").format(val)} đ` : "0 đ";

  const renderStatusTag = (status) => {
    const config = {
      Recruiting: { color: "cyan", label: "Đang tuyển sinh" },
      Upcoming: { color: "blue", label: "Sắp mở" },
      Active: { color: "green", label: "Đang hoạt động" },
      Finished: { color: "default", label: "Đã kết thúc" },
      Cancelled: { color: "red", label: "Đã hủy" },
    };
    const current = config[status] || { color: "default", label: status };
    return <Tag color={current.color}>{current.label}</Tag>;
  };

  const formatDays = (daysString) => {
    if (!daysString) return "--";
    return daysString
      .split(",")
      .map((d) => (d.trim() === "8" ? "CN" : `T${d.trim()}`))
      .join(" - ");
  };

  const formatTime = (time) => {
    if (!time) return "";
    return time.split(":").slice(0, 2).join(":");
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3 bg-white px-4 pt-3 rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            onClick={onBack}
            type="text"
            icon={<ChevronLeft size={22} />}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <div>
            <h4 className="font-bold text-xl text-gray-800 m-0">
              Chi tiết lớp học
            </h4>
            <span className="text-xs text-gray-500">
              Xem thông tin chi tiết và quản lý học viên
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button icon={<Edit size={16} />} onClick={() => onEdit(data)}>
              Sửa thông tin
            </Button>
          )}
          <Button
            type="primary"
            className="bg-blue-600"
            onClick={() => onEnterDetail(data)}
            icon={<LayoutDashboard size={16} />}
          >
            Quản lý Học viên
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div className="px-2 pb-4">
        <Row gutter={24}>
          {/* CỘT TRÁI: THÔNG TIN CHÍNH & LỊCH TRÌNH */}
          <Col span={24} lg={16}>
            {/* Card 1: Thông tin cơ bản */}
            <Card
              bordered={false}
              className="shadow-sm mb-4"
              title={
                <div className="flex items-center gap-2 text-blue-700">
                  <Info size={18} />
                  <span>Thông tin chung</span>
                </div>
              }
              extra={renderStatusTag(data.Status)}
            >
              <Descriptions column={2} size="middle">
                <Descriptions.Item label="Tên lớp" span={2}>
                  <span className="font-bold text-lg text-blue-900">
                    {data.ClassName}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Giáo viên">
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-medium">
                      {data.FullName || "Chưa phân công"}
                    </span>
                    {data.TeacherCode && (
                      <span className="text-xs text-gray-400">
                        ({data.TeacherCode})
                      </span>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Phòng học">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{data.RoomName || "--"}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Card 2: Thời gian & Lịch học */}
            <Card
              bordered={false}
              className="shadow-sm"
              title={
                <div className="flex items-center gap-2 text-blue-700">
                  <CalendarDays size={18} />
                  <span>Thời gian & Lịch học</span>
                </div>
              }
            >
              <div className="bg-blue-50/50 p-4 rounded-lg mb-4 border border-blue-100">
                <Row gutter={16}>
                  <Col span={12} className="border-r border-blue-100">
                    <div className="text-gray-500 text-xs uppercase mb-1">
                      Ngày bắt đầu
                    </div>
                    <div className="font-semibold text-gray-800">
                      {data.StartDate
                        ? dayjs(data.StartDate).format("DD/MM/YYYY")
                        : "--"}
                    </div>
                  </Col>
                  <Col span={12} className="pl-4">
                    <div className="text-gray-500 text-xs uppercase mb-1">
                      Ngày kết thúc
                    </div>
                    <div className="font-semibold text-gray-800">
                      {data.EndDate
                        ? dayjs(data.EndDate).format("DD/MM/YYYY")
                        : "--"}
                    </div>
                  </Col>
                </Row>
              </div>

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Lịch học trong tuần">
                  <Tag color="geekblue" className="text-sm px-3 py-1">
                    {formatDays(data.Days)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Khung giờ">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock size={14} className="text-orange-500" />
                    {formatTime(data.StartTime)} - {formatTime(data.EndTime)}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* CỘT PHẢI: TÀI CHÍNH */}
          <Col span={24} lg={8}>
            <Card
              bordered={false}
              className="shadow-sm h-full border-t-4 border-t-orange-400"
              title={
                <div className="flex items-center gap-2 text-orange-600">
                  <Coins size={18} />
                  <span>Thông tin Học phí</span>
                </div>
              }
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Đơn giá / buổi:</span>
                <span className="font-medium">
                  {/* SỬ DỤNG GIÁ TRỊ TÍNH TOÁN */}
                  {formatCurrency(calculatedFeePerSession)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Tổng số buổi:</span>
                <span className="font-medium">
                  {/* SỬ DỤNG GIÁ TRỊ TÍNH TOÁN */}
                  {calculatedTotalSessions}
                </span>
              </div>

              <Divider className="my-3" />

              <div>
                <div className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Tổng học phí toàn khóa
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.TuitionFee)}
                </div>
                <p className="text-xs text-gray-400 mt-1 italic">
                  * Áp dụng cho mỗi học viên đăng ký khóa này
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ClassInfo;
