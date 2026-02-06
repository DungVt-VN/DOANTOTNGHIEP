import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Spin,
  Tabs,
  Progress,
  Typography,
} from "antd";
import {
  DollarSign,
  Filter,
  Plus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  TrendingUp,
  CreditCard,
  Edit,
  AlertCircle,
  Wallet,
  History,
} from "lucide-react";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";
import { removeVietnameseTones } from "@/js/Helper";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

const TuitionManage = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("1"); // 1: Công nợ, 2: Lịch sử
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]); // Danh sách học viên đang học
  const [loading, setLoading] = useState(false);

  // Mới: State lọc theo tháng năm
  const [filterDate, setFilterDate] = useState(dayjs());

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const [modalStudents, setModalStudents] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Instance Form
  const [form] = Form.useForm();

  // State Filter
  const [searchText, setSearchText] = useState("");
  const [filterClass, setFilterClass] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        month: filterDate.month() + 1,
        year: filterDate.year(),
      };

      const [paymentRes, classRes, enrollmentRes] = await Promise.all([
        api.get("/tuition/all", { params }),
        api.get("/classes/all-classes"),
        api.get("/classes/enrollments/all"),
      ]);

      setPayments(paymentRes.data || []);
      setClasses(classRes.data || []);
      setEnrollments(enrollmentRes.data || []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate]); // Tự động fetch lại khi đổi tháng năm

  // --- 2. LOGIC TÍNH CÔNG NỢ ---
  const debtData = useMemo(() => {
    if (!enrollments.length || !classes.length) return [];

    return enrollments.map((enr) => {
      const classInfo = classes.find((c) => c.ClassId === enr.ClassId);
      const tuitionFee = Number(classInfo?.TuitionFee || 0);

      const totalPaid = payments
        .filter(
          (p) =>
            p.ClassId === enr.ClassId &&
            p.StudentId === enr.StudentId &&
            p.Status === "Completed"
        )
        .reduce((sum, p) => sum + Number(p.Amount || 0), 0);

      const remaining = tuitionFee - totalPaid;

      const percent =
        tuitionFee > 0 ? Math.round((totalPaid / tuitionFee) * 100) : 100;

      return {
        key: `${enr.ClassId}-${enr.StudentId}`,
        ...enr,
        TuitionFee: tuitionFee,
        TotalPaid: totalPaid,
        Remaining: remaining > 0 ? remaining : 0,
        Percent: percent > 100 ? 100 : percent,
        OverPaid: remaining < 0 ? Math.abs(remaining) : 0,
      };
    });
  }, [enrollments, classes, payments]);

  // --- 3. FILTER LOGIC ---
  const filteredHistory = payments.filter((item) => {
    const searchLower = removeVietnameseTones(searchText).toLowerCase();
    const nameMatch = removeVietnameseTones(item.StudentName || "")
      .toLowerCase()
      .includes(searchLower);
    const codeMatch = (item.StudentCode || "")
      .toLowerCase()
      .includes(searchLower);
    const classMatch = filterClass ? item.ClassId === filterClass : true;
    const statusMatch = filterStatus ? item.Status === filterStatus : true;

    let dateMatch = true;
    if (dateRange) {
      const pDate = dayjs(item.PaymentDate);
      dateMatch = pDate.isAfter(dateRange[0]) && pDate.isBefore(dateRange[1]);
    }
    return (nameMatch || codeMatch) && classMatch && statusMatch && dateMatch;
  });

  const filteredDebts = debtData.filter((item) => {
    const searchLower = removeVietnameseTones(searchText).toLowerCase();
    const nameMatch = removeVietnameseTones(item.FullName || "")
      .toLowerCase()
      .includes(searchLower);
    const codeMatch = (item.StudentCode || "")
      .toLowerCase()
      .includes(searchLower);
    const classMatch = filterClass ? item.ClassId === filterClass : true;

    let statusMatch = true;
    if (filterStatus === "Completed") statusMatch = item.Remaining === 0;
    if (filterStatus === "Pending") statusMatch = item.Remaining > 0;

    return (nameMatch || codeMatch) && classMatch && statusMatch;
  });

  // --- 4. MODAL & ACTIONS ---
  const loadStudentsByClass = async (classId) => {
    if (!classId) return;
    setIsFetchingStudents(true);
    try {
      const res = await api.get(`classes/${classId}/students/detail`);
      const studentList = Array.isArray(res.data)
        ? res.data
        : res.data.students || [];
      setModalStudents(studentList);
    } catch (error) {
      setModalStudents([]);
    } finally {
      setIsFetchingStudents(false);
    }
  };

  const handleClassChange = async (classId) => {
    form.setFieldValue("StudentId", null);

    if (!isEditMode) {
      const selectedClass = classes.find((c) => c.ClassId === classId);
      if (selectedClass) {
        form.setFieldValue("Amount", Number(selectedClass.TuitionFee || 0));
      }
    }

    if (classId) await loadStudentsByClass(classId);
    else setModalStudents([]);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingPayment(null);
    setModalStudents([]);
    form.resetFields();
    form.setFieldsValue({ Status: "Completed", Amount: 0 });
    setIsModalOpen(true);
  };

  const openQuickPayModal = (record) => {
    setIsEditMode(false);
    setEditingPayment(null);

    setModalStudents([
      {
        StudentId: record.StudentId,
        FullName: record.FullName,
        StudentCode: record.StudentCode,
      },
    ]);

    form.setFieldsValue({
      ClassId: record.ClassId,
      StudentId: record.StudentId,
      Amount: record.Remaining,
      Status: "Completed",
      Note: `Thanh toán nốt học phí lớp ${record.ClassName}`,
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (record) => {
    setIsEditMode(true);
    setEditingPayment(record);
    form.resetFields();

    if (record.ClassId) {
      loadStudentsByClass(record.ClassId);
    }

    form.setFieldsValue({
      ClassId: record.ClassId,
      StudentId: record.StudentId,
      Amount: record.Amount,
      Status: record.Status,
      Note: record.Note,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isEditMode && editingPayment) {
        await api.put(`/tuition/${editingPayment.PaymentId}`, {
          Amount: values.Amount,
          Status: values.Status,
          Note: values.Note,
        });
        message.success("Cập nhật thành công!");
      } else {
        await api.post("/tuition/create", values);
        message.success("Tạo phiếu thu thành công!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      await api.put(`/tuition/${paymentId}/status`, { status: newStatus });
      message.success("Đã cập nhật trạng thái");
      fetchData();
    } catch (error) {
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  // --- COLUMNS ---
  const historyColumns = [
    {
      title: "Mã GD",
      dataIndex: "PaymentId",
      width: 80,
      render: (id) => <span className="text-gray-400 font-mono">#{id}</span>,
    },
    {
      title: "Học viên",
      dataIndex: "StudentName",
      render: (text, record) => (
        <div>
          <div className="font-medium text-gray-700">{text}</div>
          <div className="text-xs text-gray-400">{record.StudentCode}</div>
        </div>
      ),
    },
    {
      title: "Lớp học",
      dataIndex: "ClassName",
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Số tiền",
      dataIndex: "Amount",
      align: "right",
      render: (val) => (
        <span className="font-bold text-gray-700">{formatCurrency(val)}</span>
      ),
      sorter: (a, b) => a.Amount - b.Amount,
    },
    {
      title: "Ngày thu",
      dataIndex: "PaymentDate",
      render: (val) => (
        <span className="text-sm text-gray-500">
          {dayjs(val).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      align: "center",
      render: (status) => {
        let color = "default";
        let icon = null;
        let label = status;
        switch (status) {
          case "Completed":
            color = "success";
            icon = <CheckCircle size={14} />;
            label = "Hoàn thành";
            break;
          case "Pending":
            color = "warning";
            icon = <Clock size={14} />;
            label = "Chờ duyệt";
            break;
          case "Failed":
            color = "error";
            icon = <XCircle size={14} />;
            label = "Hủy bỏ";
            break;
          default:
            break;
        }
        return (
          <Tag
            color={color}
            className="flex items-center justify-center gap-1 w-28 mx-auto"
          >
            {icon} {label}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} />}
              className="text-blue-600"
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          {record.Status === "Pending" && (
            <Popconfirm
              title="Xác nhận thu?"
              onConfirm={() =>
                handleUpdateStatus(record.PaymentId, "Completed")
              }
            >
              <Button
                type="text"
                size="small"
                className="text-green-600"
                icon={<CheckCircle size={18} />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const debtColumns = [
    {
      title: "Học viên",
      dataIndex: "FullName",
      render: (text, record) => (
        <div>
          <div className="font-medium text-gray-700">{text}</div>
          <div className="text-xs text-gray-400">{record.StudentCode}</div>
        </div>
      ),
    },
    {
      title: "Lớp học",
      dataIndex: "ClassName",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Học phí gốc",
      dataIndex: "TuitionFee",
      align: "right",
      render: (val) => (
        <span className="text-gray-500">{formatCurrency(val)}</span>
      ),
    },
    {
      title: "Đã đóng",
      dataIndex: "TotalPaid",
      align: "right",
      render: (val) => (
        <span className="font-medium text-green-600">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "Còn thiếu",
      dataIndex: "Remaining",
      align: "right",
      render: (val) => (
        <span
          className={`font-bold ${val > 0 ? "text-red-600" : "text-gray-400"}`}
        >
          {formatCurrency(val)}
        </span>
      ),
      sorter: (a, b) => a.Remaining - b.Remaining,
    },
    {
      title: "Trạng thái",
      align: "center",
      render: (_, record) => {
        if (record.Remaining <= 0)
          return (
            <Tag color="success" icon={<CheckCircle size={12} />}>
              Đã xong
            </Tag>
          );
        return (
          <Tag color="error" icon={<AlertCircle size={12} />}>
            Còn nợ
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      align: "center",
      render: (_, record) =>
        record.Remaining > 0 ? (
          <Button
            type="primary"
            size="small"
            className="bg-blue-600 shadow-none text-xs"
            onClick={() => openQuickPayModal(record)}
          >
            Thu tiền
          </Button>
        ) : (
          <span className="text-gray-300 text-xs">--</span>
        ),
    },
  ];

  const totalDebtSystem = debtData.reduce(
    (sum, item) => sum + item.Remaining,
    0
  );

  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3 bg-white px-4 pt-3 rounded-t-lg sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <DollarSign size={24} />
          </div>
          <div>
            <h4 className="font-bold text-xl text-gray-800 m-0">
              Quản lý Học phí
            </h4>
            <span className="text-xs text-gray-500">
              Theo dõi công nợ và lịch sử giao dịch
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Mới: Bộ lọc tháng năm */}
          <DatePicker
            picker="month"
            placeholder="Chọn tháng"
            value={filterDate}
            onChange={(date) => date && setFilterDate(date)}
            format="MM/YYYY"
            allowClear={false}
          />
          <Button icon={<RefreshCcw size={16} />} onClick={fetchData}>
            Làm mới
          </Button>
          <Button
            type="primary"
            className="bg-blue-600"
            icon={<Plus size={18} />}
            onClick={openCreateModal}
          >
            Tạo phiếu thu
          </Button>
        </div>
      </div>

      <div className="px-2 pb-4">
        <Row gutter={16} className="mb-4">
          <Col span={24} md={8}>
            <Card variant="borderless" className="shadow-sm">
              <Statistic
                title={
                  <span className="flex items-center gap-2 text-gray-500">
                    <TrendingUp size={16} /> Thực thu (Tháng{" "}
                    {filterDate.format("MM/YYYY")})
                  </span>
                }
                value={payments
                  .filter(
                    (p) =>
                      p.Status === "Completed" &&
                      dayjs(p.PaymentDate).isSame(filterDate, "month") &&
                      dayjs(p.PaymentDate).isSame(filterDate, "year")
                  )
                  .reduce((s, p) => s + Number(p.Amount), 0)}
                precision={0}
                valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                formatter={(val) => formatCurrency(val)}
              />
            </Card>
          </Col>
          <Col span={24} md={8}>
            <Card variant="borderless" className="shadow-sm">
              <Statistic
                title={
                  <span className="flex items-center gap-2 text-gray-500">
                    <AlertCircle size={16} /> Tổng công nợ chưa thu
                  </span>
                }
                value={totalDebtSystem}
                precision={0}
                valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
                formatter={(val) => formatCurrency(val)}
              />
            </Card>
          </Col>
          <Col span={24} md={8}>
            <Card
              variant="borderless"
              className="shadow-sm bg-blue-50 border border-blue-100"
            >
              <div className="flex flex-col h-full justify-center">
                <span className="text-blue-800 font-medium">
                  Hôm nay: {dayjs().format("DD/MM/YYYY")}
                </span>
                <span className="text-xs text-blue-600">
                  Dữ liệu được lọc theo tháng {filterDate.format("MM/YYYY")}
                </span>
              </div>
            </Card>
          </Col>
        </Row>

        <Card variant="borderless" className="shadow-sm mb-4">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            items={[
              {
                key: "1",
                label: (
                  <span className="flex items-center gap-2">
                    <Wallet size={16} /> Theo dõi công nợ
                  </span>
                ),
              },
              {
                key: "2",
                label: (
                  <span className="flex items-center gap-2">
                    <History size={16} /> Lịch sử giao dịch
                  </span>
                ),
              },
            ]}
          />
          {/* THANH FILTER CHUNG - TỐI ƯU UI/UX */}
          <Row
            gutter={[12, 0]}
            align="middle"
            wrap={false}
            className="mt-4 mb-2 overflow-x-auto pb-2 custom-scrollbar"
          >
            {/* 1. Tìm kiếm theo từ khóa - GIỚI HẠN ĐỘ RỘNG */}
            <Col flex="350px">
              {" "}
              {/* Thay auto bằng 350px để cố định độ rộng vừa đủ */}
              <Input
                prefix={<Search size={18} className="text-gray-400" />}
                placeholder="Tìm tên, mã học viên..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="rounded-lg shadow-sm"
              />
            </Col>

            {/* 2. Lọc theo lớp */}
            <Col flex="200px">
              {" "}
              {/* Thu nhỏ nhẹ từ 220px xuống 200px */}
              <Select
                className="w-full shadow-sm"
                placeholder="Tất cả lớp học"
                allowClear
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  removeVietnameseTones(option?.label ?? "").includes(
                    removeVietnameseTones(input)
                  )
                }
                onChange={setFilterClass}
                options={classes.map((c) => ({
                  label: c.ClassName,
                  value: c.ClassId,
                }))}
              />
            </Col>

            {/* 3. Lọc theo thời gian (Nếu có) */}
            {activeTab === "2" && (
              <Col flex="260px">
                <RangePicker
                  className="w-full shadow-sm rounded-lg"
                  placeholder={["Từ ngày", "Đến ngày"]}
                  format="DD/MM/YYYY"
                  onChange={setDateRange}
                />
              </Col>
            )}

            {/* 4. Lọc theo trạng thái */}
            <Col flex="160px">
              {" "}
              {/* Thu nhỏ nhẹ từ 180px xuống 160px */}
              <Select
                className="w-full shadow-sm"
                placeholder="Trạng thái"
                allowClear
                onChange={setFilterStatus}
                options={
                  activeTab === "1"
                    ? [
                        { label: "Đã hoàn thành", value: "Completed" },
                        { label: "Còn nợ", value: "Pending" },
                      ]
                    : [
                        { label: "Hoàn thành", value: "Completed" },
                        { label: "Chờ duyệt", value: "Pending" },
                        { label: "Hủy bỏ", value: "Failed" },
                      ]
                }
              />
            </Col>

            {/* 5. Nút Lọc và Nút Reset (Thêm nút Reset để UX tốt hơn) */}
            <Col flex="none">
              <Space>
                <Button
                  type="primary"
                  icon={<Filter size={16} />}
                  onClick={fetchData}
                  className="flex items-center justify-center rounded-lg bg-blue-600 border-blue-600"
                >
                  Lọc
                </Button>

                {/* Nút Xóa nhanh bộ lọc - Giúp người dùng quay lại trạng thái ban đầu nhanh chóng */}
                <Tooltip title="Xóa bộ lọc">
                  <Button
                    icon={<RefreshCcw size={16} />}
                    onClick={() => {
                      setSearchText("");
                      setFilterClass(null);
                      setFilterStatus(null);
                      setDateRange(null);
                      fetchData();
                    }}
                    className="flex items-center justify-center rounded-lg"
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card
          variant="borderless"
          className="shadow-sm"
          styles={{ body: { padding: "0px" } }}
        >
          {activeTab === "1" ? (
            <Table
              columns={debtColumns}
              dataSource={filteredDebts}
              rowKey="key"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} học viên`,
              }}
              scroll={{ x: 800 }}
              // Mới: Thêm summary cho bảng công nợ
              summary={(pageData) => {
                let totalFee = 0;
                let totalPaid = 0;
                let totalRemaining = 0;

                pageData.forEach(({ TuitionFee, TotalPaid, Remaining }) => {
                  totalFee += TuitionFee;
                  totalPaid += TotalPaid;
                  totalRemaining += Remaining;
                });

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-gray-50 font-bold">
                      <Table.Summary.Cell index={0} colSpan={2}>
                        TỔNG CỘNG
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        {formatCurrency(totalFee)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text type="success">{formatCurrency(totalPaid)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text type="danger">
                          {formatCurrency(totalRemaining)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          ) : (
            <Table
              columns={historyColumns}
              dataSource={filteredHistory}
              rowKey="PaymentId"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} phiếu thu`,
              }}
              scroll={{ x: 800 }}
              // Mới: Thêm summary cho bảng lịch sử
              summary={(pageData) => {
                let totalAmount = 0;
                pageData.forEach(({ Amount }) => {
                  totalAmount += Number(Amount);
                });
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-gray-50 font-bold">
                      <Table.Summary.Cell index={0} colSpan={3}>
                        TỔNG THU TRÊN TRANG NÀY
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text type="success">
                          {formatCurrency(totalAmount)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} colSpan={3} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          )}
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-700">
            <CreditCard size={20} />{" "}
            {isEditMode ? "Cập Nhật Phiếu Thu" : "Tạo Phiếu Thu Mới"}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={500}
        forceRender // QUAN TRỌNG: FIX LỖI useForm not connected
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="ClassId"
            label="Chọn Lớp Học"
            rules={[{ required: true, message: "Vui lòng chọn lớp" }]}
          >
            <Select
              placeholder="Chọn lớp..."
              showSearch
              optionFilterProp="label"
              onChange={handleClassChange}
              disabled={
                isEditMode ||
                (form.getFieldValue("Amount") > 0 &&
                  form.getFieldValue("StudentId"))
              }
              filterOption={(input, option) =>
                removeVietnameseTones(option?.label ?? "").includes(
                  removeVietnameseTones(input)
                )
              }
              options={classes.map((c) => ({
                label: c.ClassName,
                value: c.ClassId,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="StudentId"
            label="Chọn Học Viên"
            rules={[{ required: true, message: "Vui lòng chọn học viên" }]}
            help={isFetchingStudents ? <Spin size="small" /> : null}
          >
            <Select
              placeholder="Chọn học viên..."
              showSearch
              optionFilterProp="label"
              disabled={!modalStudents.length || isEditMode}
              filterOption={(input, option) =>
                removeVietnameseTones(option?.label ?? "").includes(
                  removeVietnameseTones(input)
                )
              }
              options={modalStudents.map((s) => ({
                label: `${s.FullName} - ${s.StudentCode}`,
                value: s.StudentId,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="Amount"
                label="Số tiền thu"
                rules={[{ required: true }]}
              >
                <InputNumber
                  className="w-full font-bold text-green-700"
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ"
                  }
                  parser={(value) => value.replace(/\s?VNĐ|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Status" label="Trạng thái">
                <Select>
                  <Select.Option value="Completed">
                    <Tag color="success">Hoàn thành</Tag>
                  </Select.Option>
                  <Select.Option value="Pending">
                    <Tag color="warning">Chờ duyệt</Tag>
                  </Select.Option>
                  <Select.Option value="Failed">
                    <Tag color="error">Hủy bỏ</Tag>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="Note" label="Ghi chú">
            <TextArea rows={2} placeholder="Nhập nội dung thu tiền..." />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-blue-600"
              icon={<CheckCircle size={16} />}
            >
              {isEditMode ? "Lưu thay đổi" : "Xác nhận thu"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TuitionManage;
