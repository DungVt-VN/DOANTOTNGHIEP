import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Statistic,
  Tag,
  Button,
  Empty,
  Spin,
  Timeline,
} from "antd";
import {
  CreditCard,
  DollarSign,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";

const StudentTuition = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    lastPaymentDate: null,
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/student/tuition");
        setPayments(res.data);

        // Tính toán thống kê local (hoặc trả về từ API)
        const totalPaid = res.data
          .filter((p) => p.Status === "Completed")
          .reduce((acc, curr) => acc + Number(curr.Amount), 0);

        const totalPending = res.data
          .filter((p) => p.Status === "Pending")
          .reduce((acc, curr) => acc + Number(curr.Amount), 0);

        setStats({
          totalPaid,
          totalPending,
          lastPaymentDate: res.data.length > 0 ? res.data[0].PaymentDate : null,
        });
      } catch (error) {
        console.error("Lỗi tải học phí:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: "Mã giao dịch",
      dataIndex: "PaymentId",
      key: "PaymentId",
      render: (id) => (
        <span className="font-mono text-slate-500">
          #TRX-{id.toString().padStart(6, "0")}
        </span>
      ),
    },
    {
      title: "Lớp học / Nội dung",
      dataIndex: "ClassName",
      key: "ClassName",
      render: (text, record) => (
        <div>
          <div className="font-medium text-slate-700">{text}</div>
          <div className="text-xs text-slate-400">{record.CourseName}</div>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "Amount",
      key: "Amount",
      render: (amount) => (
        <span className="font-bold text-slate-700">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "PaymentDate",
      key: "PaymentDate",
      render: (date) => (
        <span className="text-slate-600">
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      render: (status) => {
        let color = "default";
        let text = status;
        let icon = null;

        if (status === "Completed") {
          color = "success";
          text = "Thành công";
          icon = <CheckCircle size={14} />;
        } else if (status === "Pending") {
          color = "warning";
          text = "Chờ duyệt";
          icon = <Clock size={14} />;
        } else if (status === "Failed") {
          color = "error";
          text = "Thất bại";
          icon = <AlertCircle size={14} />;
        }

        return (
          <Tag color={color} className="flex w-fit items-center gap-1">
            {icon} {text}
          </Tag>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "Note",
      key: "Note",
      render: (note) => (
        <span className="text-slate-500 text-sm italic">{note || "-"}</span>
      ),
    },
  ];

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <CreditCard className="text-blue-600" /> Thông tin học phí
      </h1>

      {/* 1. THỐNG KÊ (STATS CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-xl shadow-sm border-l-4 border-l-green-500">
          <Statistic
            title="Tổng tiền đã đóng"
            value={stats.totalPaid}
            formatter={(value) => formatCurrency(value)}
            prefix={<CheckCircle className="text-green-500 mr-2" />}
          />
        </Card>
        <Card className="rounded-xl shadow-sm border-l-4 border-l-orange-400">
          <Statistic
            title="Đang chờ xử lý"
            value={stats.totalPending}
            formatter={(value) => formatCurrency(value)}
            prefix={<Clock className="text-orange-400 mr-2" />}
            valueStyle={{
              color: stats.totalPending > 0 ? "#fb923c" : "#64748b",
            }}
          />
        </Card>
        <Card className="rounded-xl shadow-sm border-l-4 border-l-blue-500">
          <Statistic
            title="Giao dịch gần nhất"
            value={
              stats.lastPaymentDate
                ? dayjs(stats.lastPaymentDate).format("DD/MM/YYYY")
                : "--"
            }
            prefix={<History className="text-blue-500 mr-2" />}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. BẢNG LỊCH SỬ (MAIN CONTENT) */}
        <div className="lg:col-span-2">
          <Card
            title="Lịch sử giao dịch"
            className="rounded-xl shadow-sm border-slate-200"
          >
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="PaymentId"
              pagination={{ pageSize: 5 }}
              locale={{
                emptyText: <Empty description="Chưa có giao dịch nào" />,
              }}
            />
          </Card>
        </div>

        {/* 3. THÔNG TIN CHUYỂN KHOẢN (SIDEBAR) */}
        <div>
          <Card
            title="Thông tin chuyển khoản"
            className="rounded-xl shadow-sm border-slate-200 h-full bg-blue-50/50"
          >
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Ngân hàng
                </p>
                <p className="font-semibold text-lg text-blue-800">
                  Vietcombank (VCB)
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Số tài khoản
                </p>
                <p className="font-mono text-xl font-bold tracking-wider text-slate-800">
                  1900 888 999
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Chủ tài khoản
                </p>
                <p className="font-semibold text-slate-800">
                  TRUNG TAM GIA SU ABC
                </p>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle size={14} /> Lưu ý:
                </p>
                <p className="mt-1">
                  Nội dung chuyển khoản: <b>HỌ TÊN HS + MÃ LỚP</b>
                </p>
                <p className="mt-1">
                  Vui lòng chụp lại biên lai để đối chiếu khi cần thiết.
                </p>
              </div>

              {/* Diagram illustrating the payment processing flow */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentTuition;
