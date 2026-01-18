import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
  Bell,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  Row,
  Col,
  Card,
  Button,
  List,
  Avatar,
  DatePicker,
  Modal,
  Table,
  Tag,
  Input,
  Tooltip,
} from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import AdminStatCard from "@/components/DashboardLayout/Admin/AdminStatCard";
import AdminClassesTable from "@/components/Classes/Admin/AdminClassesTable";
import api from "@/utils/axiosInstance";

dayjs.extend(relativeTime);
dayjs.locale("vi");

// Config icon cho Notification
const getTypeConfig = (type) => {
  switch (type?.toLowerCase()) {
    case "payment":
      return {
        icon: <DollarSign size={16} />,
        color: "green",
        label: "Thanh toán",
        bg: "bg-green-100 text-green-600",
      };
    case "register":
      return {
        icon: <Users size={16} />,
        color: "blue",
        label: "Đăng ký",
        bg: "bg-blue-100 text-blue-600",
      };
    case "class":
      return {
        icon: <BookOpen size={16} />,
        color: "purple",
        label: "Lớp học",
        bg: "bg-purple-100 text-purple-600",
      };
    case "warning":
      return {
        icon: <AlertCircle size={16} />,
        color: "red",
        label: "Cảnh báo",
        bg: "bg-red-100 text-red-600",
      };
    default:
      return {
        icon: <Bell size={16} />,
        color: "default",
        label: "Hệ thống",
        bg: "bg-gray-100 text-gray-600",
      };
  }
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  // 1. State cho Tháng được chọn (Mặc định là hiện tại)
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
  });

  // 2. State cho dữ liệu Biểu đồ
  const [chartData, setChartData] = useState([]);

  const [activities, setActivities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [searchText, setSearchText] = useState("");

  const formatShortRevenue = (val) => {
    if (!val) return "0";
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)} Tỷ`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)} Tr`;
    return val.toLocaleString();
  };

  // --- FETCH DATA ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Lấy tháng và năm từ state selectedMonth
      const month = selectedMonth.month() + 1; // dayjs tháng bắt đầu từ 0
      const year = selectedMonth.year();

      // Gọi API với params
      const [statsRes, chartRes, notiRes] = await Promise.all([
        api.get("/dashboard/stats", { params: { month, year } }), // Stats theo tháng
        api.get("/dashboard/chart", { params: { month, year } }), // Chart theo tháng
        api.get("/notifications?limit=5"), // Thông báo (thường không cần lọc theo tháng dashboard)
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data || []);
      setActivities(notiRes.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi lại API mỗi khi selectedMonth thay đổi
  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingModal(true);
    try {
      const res = await api.get("/notifications");
      setAllNotifications(res.data || []);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  // Cấu hình bảng Modal (Giữ nguyên)
  const notificationColumns = [
    {
      title: "Loại",
      dataIndex: "Type",
      width: 120,
      render: (type) => {
        const config = getTypeConfig(type);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
      filters: [
        { text: "Thanh toán", value: "payment" },
        { text: "Đăng ký", value: "register" },
        { text: "Hệ thống", value: "system" },
      ],
      onFilter: (value, record) => record.Type === value,
    },
    {
      title: "Nội dung",
      dataIndex: "Message",
      render: (text, record) => (
        <div>
          <div className="font-semibold text-gray-800">{record.Title}</div>
          <div className="text-gray-500 text-sm">{text}</div>
        </div>
      ),
    },
    {
      title: "Người dùng",
      dataIndex: "FullName",
      width: 200,
      render: (name, record) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={record.Avatar}
            style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
          >
            {name ? name.charAt(0) : "U"}
          </Avatar>
          <span className="font-medium text-gray-700">
            {name || "Hệ thống"}
          </span>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "CreatedAt",
      width: 180,
      sorter: (a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt),
      render: (date) => (
        <Tooltip title={dayjs(date).format("DD/MM/YYYY HH:mm:ss")}>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={14} /> {dayjs(date).format("DD/MM/YYYY HH:mm")}
          </div>
        </Tooltip>
      ),
    },
  ];

  const filteredNotifications = allNotifications.filter(
    (n) =>
      n.Title?.toLowerCase().includes(searchText.toLowerCase()) ||
      n.Message?.toLowerCase().includes(searchText.toLowerCase()) ||
      n.FullName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleExportReport = () => {
    try {
      const monthStr = selectedMonth.format("MM-YYYY");

      // 1. Chuẩn bị dữ liệu cho Sheet 1: TỔNG QUAN
      // Tính tổng học viên mới từ biểu đồ (giả sử chartData.students là số học viên mới theo ngày)
      const totalNewStudents = chartData.reduce(
        (acc, curr) => acc + (curr.students || 0),
        0
      );

      const overviewData = [
        { "Chỉ số": "Báo cáo tháng", "Giá trị": monthStr },
        {
          "Chỉ số": "Ngày xuất",
          "Giá trị": dayjs().format("DD/MM/YYYY HH:mm"),
        },
        { "Chỉ số": "", "Giá trị": "" }, // Dòng trống
        { "Chỉ số": "Tổng doanh thu tháng", "Giá trị": stats.monthlyRevenue },
        {
          "Chỉ số": "Tổng học viên mới trong tháng",
          "Giá trị": totalNewStudents,
        },
        {
          "Chỉ số": "Tổng số lớp đang hoạt động",
          "Giá trị": stats.activeClasses,
        },
        { "Chỉ số": "Tổng giảng viên", "Giá trị": stats.totalTeachers },
        {
          "Chỉ số": "Tổng học viên toàn hệ thống",
          "Giá trị": stats.totalStudents,
        },
      ];

      // 2. Chuẩn bị dữ liệu cho Sheet 2: CHI TIẾT THEO NGÀY (Từ ChartData)
      const dailyData = chartData.map((item) => ({
        Ngày: item.day, // Ví dụ: "01", "02"
        "Doanh thu (VND)": item.revenue,
        "Học viên đăng ký mới": item.students,
      }));

      // 3. Chuẩn bị dữ liệu cho Sheet 3: NHẬT KÝ HOẠT ĐỘNG (5 gần nhất)
      const activityData = activities.map((item) => ({
        "Thời gian": dayjs(item.CreatedAt).format("DD/MM/YYYY HH:mm"),
        Loại: getTypeConfig(item.Type).label,
        "Tiêu đề": item.Title,
        "Người thực hiện": item.FullName || "Hệ thống",
        "Nội dung": item.Message,
      }));

      const workbook = XLSX.utils.book_new();

      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      wsOverview["!cols"] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, wsOverview, "Tổng quan");

      const wsDaily = XLSX.utils.json_to_sheet(dailyData);
      wsDaily["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, wsDaily, "Chi tiết theo ngày");

      const wsActivity = XLSX.utils.json_to_sheet(activityData);
      wsActivity["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 20 },
        { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(workbook, wsActivity, "Hoạt động gần đây");

      XLSX.writeFile(workbook, `Bao_cao_He_thong_Thang_${monthStr}.xlsx`);
    } catch (error) {
      console.error("Lỗi xuất báo cáo:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">
            Tổng quan hệ thống
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Chào mừng quay trở lại, Admin!
          </p>
        </div>
        <div className="flex gap-2">
          {/* DatePicker điều khiển State */}
          <DatePicker
            picker="month"
            placeholder="Chọn tháng"
            className="w-40"
            value={selectedMonth}
            onChange={(date) => {
              if (date) setSelectedMonth(date);
            }}
            format="MM/YYYY"
            allowClear={false}
          />
          <Button
            type="primary"
            className="bg-blue-600"
            onClick={handleExportReport}
            loading={loading}
            icon={<BookOpen size={16} className="mr-1" />}
          >
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Cards Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Tổng Học viên"
          value={stats.totalStudents.toLocaleString()}
          icon={<Users size={24} />}
          colorClass="bg-blue-50 text-blue-600"
          trend={12.5}
          loading={loading}
        />
        <AdminStatCard
          title="Tổng Giảng viên"
          value={stats.totalTeachers.toLocaleString()}
          icon={<GraduationCap size={24} />}
          colorClass="bg-green-50 text-green-600"
          trend={2.1}
          loading={loading}
        />
        <AdminStatCard
          title="Lớp đang hoạt động"
          value={stats.activeClasses.toLocaleString()}
          icon={<BookOpen size={24} />}
          colorClass="bg-purple-50 text-purple-600"
          trend={-5.4}
          loading={loading}
        />
        <AdminStatCard
          title={`Doanh thu T${selectedMonth.month() + 1}`}
          value={loading ? "..." : formatShortRevenue(stats.monthlyRevenue)}
          icon={<DollarSign size={24} />}
          colorClass="bg-yellow-50 text-yellow-600"
          trend={8.2}
          loading={loading}
        />
      </div>

      {/* Charts & Activities */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span className="font-semibold text-gray-700">
                Biểu đồ Doanh thu - Tháng {selectedMonth.month() + 1}/
                {selectedMonth.year()}
              </span>
            }
            variant="borderless"
            className="shadow-sm rounded-xl h-full"
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    {/* Thêm Gradient cho Students nếu cần */}
                    <linearGradient
                      id="colorStudents"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Doanh thu"
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                    name="Học viên mới"
                  />
                </AreaChart>
              </ResponsiveContainer>
              {chartData.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-[-150px]">
                  Chưa có dữ liệu cho tháng này
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Activity List - Giữ nguyên */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="font-semibold text-gray-700">
                Hoạt động gần đây
              </span>
            }
            extra={
              <Button
                type="text"
                size="small"
                className="text-blue-600"
                onClick={handleOpenModal}
              >
                Xem tất cả
              </Button>
            }
            variant="borderless"
            className="shadow-sm rounded-xl h-full flex flex-col"
            styles={{
              body: { flex: 1, display: "flex", flexDirection: "column" },
            }}
          >
            <div className="flex-1 overflow-hidden">
              <List
                itemLayout="horizontal"
                dataSource={activities}
                loading={loading}
                locale={{ emptyText: "Chưa có thông báo nào" }}
                renderItem={(item) => {
                  const config = getTypeConfig(item.Type);
                  return (
                    <List.Item className="border-b-0 py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 cursor-default">
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={config.icon}
                            className={config.bg}
                            shape="square"
                            size="large"
                          />
                        }
                        title={
                          <span className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {item.Title}
                          </span>
                        }
                        description={
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 line-clamp-1">
                              {item.Message}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5">
                              {dayjs(item.CreatedAt).fromNow()}
                            </span>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <AdminClassesTable isDashboard={true} />

      {/* Modal Notifications - Giữ nguyên */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Bell className="text-blue-600" /> Nhật ký hệ thống
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
        centered
      >
        <div className="mb-4">
          <Input
            prefix={<Search size={16} className="text-gray-400" />}
            placeholder="Tìm kiếm..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <Table
          columns={notificationColumns}
          dataSource={filteredNotifications}
          rowKey="NotiId"
          loading={loadingModal}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 700 }}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
