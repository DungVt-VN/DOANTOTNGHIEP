import React, { useContext, useEffect, useState } from "react";
import {
  Table,
  Card,
  Statistic,
  Tag,
  Button,
  Empty,
  Spin,
  Modal,
  Alert,
  Tooltip,
  message,
} from "antd";
import {
  CreditCard,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  Wallet,
  Copy,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";
import { AuthContext } from "@/context/authContext";

const StudentTuition = () => {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // State dữ liệu từ API
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalDebt: 0,
    unpaidClasses: [],
  });

  // State cho Modal QR Code
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song 2 API mới
        console.log(currentUser);
        const [summaryRes, historyRes] = await Promise.all([
          api.get(`/tuition/summary/${currentUser.StudentId}`),
          api.get(`/tuition/history/${currentUser.StudentId}`),
        ]);

        setSummary(summaryRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu học phí:", error);
        message.error("Không thể tải thông tin học phí");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. HELPERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Xử lý mở Modal QR
  const handleOpenQr = (item) => {
    // Tạo nội dung chuyển khoản tự động: "HP [Tên Lớp]"
    // Bạn có thể tùy chỉnh logic sinh nội dung này
    const memo = `HP ${item.ClassName.replace(/\s/g, "").toUpperCase()}`;

    setSelectedPayment({
      amount: item.RemainingDebt,
      content: memo,
      className: item.ClassName,
    });
    setIsQrModalOpen(true);
  };

  // Copy số tài khoản
  const handleCopyBankNumber = () => {
    navigator.clipboard.writeText("1900888999");
    message.success("Đã sao chép số tài khoản!");
  };

  // --- 3. TABLE COLUMNS ---
  const columns = [
    {
      title: "Mã GD",
      dataIndex: "PaymentId",
      key: "PaymentId",
      render: (id) => (
        <span className="font-mono text-xs text-slate-400">#{id}</span>
      ),
    },
    {
      title: "Lớp học / Nội dung",
      dataIndex: "ClassName",
      key: "ClassName",
      render: (text, record) => (
        <div>
          <div className="font-medium text-slate-700">{text || "N/A"}</div>
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
        <span className="text-slate-500 text-sm">
          {dayjs(date).format("DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      render: (status) => {
        const config = {
          Completed: {
            color: "success",
            text: "Thành công",
            icon: <CheckCircle2 size={12} />,
          },
          Pending: {
            color: "warning",
            text: "Đang duyệt",
            icon: <Clock size={12} />,
          },
          Failed: {
            color: "error",
            text: "Thất bại",
            icon: <AlertCircle size={12} />,
          },
        };
        const curr = config[status] || config.Pending;
        return (
          <Tag
            color={curr.color}
            className="flex w-fit items-center gap-1 border-0"
          >
            {curr.icon} {curr.text}
          </Tag>
        );
      },
    },
  ];

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-blue-600" /> Quản lý học phí
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi công nợ và lịch sử thanh toán của bạn
          </p>
        </div>
      </div>

      {/* 1. STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thẻ Tổng đã đóng */}
        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-gradient-to-br from-blue-50 to-white">
          <Statistic
            title={
              <span className="text-slate-500 font-medium">Tổng đã đóng</span>
            }
            value={summary.totalPaid}
            formatter={formatCurrency}
            prefix={<CheckCircle2 className="text-blue-500 mr-2" size={20} />}
            valueStyle={{ color: "#1e293b", fontWeight: "bold" }}
          />
        </Card>

        {/* Thẻ Cần thanh toán (Nợ) */}
        <Card className="rounded-2xl shadow-sm border border-slate-100 bg-gradient-to-br from-red-50 to-white">
          <Statistic
            title={
              <span className="text-red-500 font-medium">Cần thanh toán</span>
            }
            value={summary.totalDebt}
            formatter={formatCurrency}
            prefix={<AlertCircle className="text-red-500 mr-2" size={20} />}
            valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
          />
        </Card>

        {/* Thẻ Số lớp nợ */}
        <Card className="rounded-2xl shadow-sm border border-slate-100">
          <Statistic
            title={
              <span className="text-slate-500 font-medium">
                Lớp chưa hoàn thành phí
              </span>
            }
            value={summary.unpaidClasses.length}
            suffix="lớp"
            prefix={<CreditCard className="text-orange-400 mr-2" size={20} />}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. MAIN CONTENT - UNPAID CLASSES & HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Danh sách nợ (Chỉ hiện nếu có nợ) */}
          {summary.unpaidClasses.length > 0 && (
            <Card
              title={
                <span className="text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle size={18} /> Các khoản cần thanh toán
                </span>
              }
              className="rounded-2xl shadow-sm border border-red-100 bg-red-50/10"
              headStyle={{ borderBottom: "1px solid #fee2e2" }}
            >
              <div className="flex flex-col gap-4">
                {summary.unpaidClasses.map((item) => (
                  <div
                    key={item.ClassId}
                    className="flex flex-col sm:flex-row justify-between items-center p-5 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-all hover:border-blue-200"
                  >
                    <div className="mb-4 sm:mb-0 w-full sm:w-auto">
                      <h4 className="font-bold text-slate-800 text-lg mb-1">
                        {item.ClassName}
                      </h4>
                      <div className="text-slate-500 text-sm flex flex-wrap gap-x-4 gap-y-1">
                        <span>Học phí: {formatCurrency(item.TotalFee)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-green-600">
                          Đã đóng: {formatCurrency(item.PaidAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-bold">
                          Còn lại
                        </div>
                        <div className="text-xl font-bold text-red-500">
                          {formatCurrency(item.RemainingDebt)}
                        </div>
                      </div>
                      <Button
                        type="primary"
                        danger
                        size="large"
                        icon={<QrCode size={18} />}
                        onClick={() => handleOpenQr(item)}
                        className="rounded-xl shadow-red-200 shadow-md h-10 px-6 font-bold"
                      >
                        Thanh toán
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* B. Lịch sử giao dịch */}
          <Card
            title={
              <div className="flex items-center gap-2 text-slate-700">
                <History size={18} /> Lịch sử giao dịch
              </div>
            }
            className="rounded-2xl shadow-sm border border-slate-100"
          >
            <Table
              columns={columns}
              dataSource={history}
              rowKey="PaymentId"
              pagination={{ pageSize: 5 }}
              locale={{
                emptyText: <Empty description="Chưa có giao dịch nào" />,
              }}
            />
          </Card>
        </div>

        {/* 3. SIDEBAR INFO */}
        <div className="space-y-6">
          <Card
            title="Thông tin chuyển khoản"
            className="rounded-2xl shadow-sm bg-blue-50/30 border border-blue-100"
          >
            <div className="space-y-4">
              {/* Bank Name */}
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Ngân hàng
                </div>
                <div className="font-bold text-lg text-blue-800">
                  Vietcombank (VCB)
                </div>
              </div>

              {/* Account Number */}
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative group">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Số tài khoản
                </div>
                <div className="font-mono text-xl font-black text-slate-800 tracking-wider flex items-center justify-between">
                  1900 888 999
                  <Tooltip title="Sao chép">
                    <Button
                      type="text"
                      icon={<Copy size={16} />}
                      onClick={handleCopyBankNumber}
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    />
                  </Tooltip>
                </div>
              </div>

              {/* Account Name */}
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Chủ tài khoản
                </div>
                <div className="font-bold text-slate-800">
                  TRUNG TAM GIA SU ABC
                </div>
              </div>

              <Alert
                message="Lưu ý quan trọng"
                description="Nội dung chuyển khoản bắt buộc phải có MÃ LỚP để hệ thống tự động ghi nhận."
                type="warning"
                showIcon
                className="rounded-xl border-orange-100 bg-orange-50 text-orange-800"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* --- MODAL VIETQR --- */}
      <Modal
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        centered
        width={400}
        title={
          <div className="text-center font-bold text-lg">
            Quét mã để thanh toán
          </div>
        }
      >
        {selectedPayment && (
          <div className="flex flex-col items-center py-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-lg mb-6 relative">
              {/* Dùng API VietQR để tạo mã */}
              <img
                src={`https://img.vietqr.io/image/VCB-1900888999-compact2.png?amount=${selectedPayment.amount}&addInfo=${encodeURIComponent(selectedPayment.content)}`}
                alt="VietQR"
                className="w-64 h-64 object-contain"
              />
            </div>

            <div className="text-center w-full space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-xl text-blue-600">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-slate-500">Nội dung:</span>
                <span className="font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-800 select-all">
                  {selectedPayment.content}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400 px-4">
              Sau khi chuyển khoản thành công, vui lòng chụp lại biên lai. Hệ
              thống sẽ cập nhật trạng thái trong vòng 24h.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentTuition;
