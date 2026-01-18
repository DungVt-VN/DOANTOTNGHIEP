import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  message,
  Form,
  Input,
  InputNumber,
  Tooltip,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Popconfirm,
  Space,
} from "antd";
import {
  CalendarDays,
  Search,
  Clock,
  KeyRound,
  RefreshCcw,
  Save,
  Plus,
  BookOpen,
  Settings2,
  Pencil,
  Trash2,
  Filter,
  PlayCircle,
  CheckCircle2,
  Eye, // <--- 1. IMPORT ICON EYE
} from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import api from "@/utils/axiosInstance";
import { removeVietnameseTones } from "@/js/Helper";
import PreviewExamModal from "@/components/BankQuestion/PreviewExamModal";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

// --- CẤU HÌNH STATUS ENUM ---
const STATUS_OPTIONS = [
  {
    value: "upcoming",
    label: "Sắp diễn ra",
    color: "blue",
    icon: <Clock size={12} />,
  },
  {
    value: "ongoing",
    label: "Đang diễn ra",
    color: "green",
    icon: <PlayCircle size={12} />,
  },
  {
    value: "finished",
    label: "Đã kết thúc",
    color: "red",
    icon: <CheckCircle2 size={12} />,
  },
];

const ExamDistribution = ({ courseId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // State Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  // State Modal Preview
  const [previewId, setPreviewId] = useState(null);

  const [classesList, setClassesList] = useState([]);
  const [sourceExams, setSourceExams] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);

  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!courseId) return;

    setDataLoading(true);
    try {
      const [classesRes, templatesRes, scheduledRes] = await Promise.all([
        api.get("/classes/course", { params: { courseId } }),
        api.get("/quizzes", { params: { courseId: courseId, type: "master" } }),
        api.get("/quizzes", { params: { courseId: courseId } }),
      ]);

      setClassesList(
        classesRes.data.map((cls) => ({
          value: cls.ClassId,
          label: cls.ClassName,
        }))
      );

      setSourceExams(
        templatesRes.data.map((quiz) => ({
          value: quiz.QuizId,
          label: quiz.Title,
          duration: quiz.DurationMinutes,
        }))
      );

      setScheduledExams(
        scheduledRes.data.map((item) => ({
          key: item.QuizId,
          examId: item.ParentQuizId || item.QuizId,
          ExamName: item.Title,
          classId: item.ClassId,
          ClassName: item.ClassName || "Unknown Class",
          Duration: item.DurationMinutes,
          StartTime: item.StartTime,
          EndTime: item.EndTime,
          AccessCode: item.AccessCode,
          Status: item.Status,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Không thể tải dữ liệu.");
    } finally {
      setDataLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HELPER ---
  const calculateStatusByTime = (start, end) => {
    const now = dayjs();
    const startTime = dayjs(start);
    const endTime = dayjs(end);

    if (now.isBefore(startTime)) return "upcoming";
    if (now.isAfter(endTime)) return "finished";
    return "ongoing";
  };

  // --- FILTER LOGIC ---
  const filteredData = scheduledExams.filter((item) => {
    const matchSearch =
      removeVietnameseTones(item.ExamName).includes(
        removeVietnameseTones(searchTerm)
      ) ||
      removeVietnameseTones(item.ClassName).includes(
        removeVietnameseTones(searchTerm)
      ) ||
      (item.AccessCode &&
        removeVietnameseTones(item.AccessCode).includes(
          removeVietnameseTones(searchTerm)
        ));

    const matchClass = filterClass ? item.classId === filterClass : true;
    const matchStatus = filterStatus ? item.Status === filterStatus : true;

    return matchSearch && matchClass && matchStatus;
  });

  // --- ACTIONS ---
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldsValue({ accessCode: code });
  };

  const handleOpenCreate = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ duration: 45, status: "upcoming" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      examId: record.examId,
      classIds: [record.classId],
      duration: record.Duration,
      accessCode: record.AccessCode,
      status: record.Status,
      timeRange:
        record.StartTime && record.EndTime
          ? [dayjs(record.StartTime), dayjs(record.EndTime)]
          : [],
    });
    setIsModalOpen(true);
  };

  const handleExamSelect = (examId) => {
    const selectedExam = sourceExams.find((ex) => ex.value === examId);
    if (selectedExam && selectedExam.duration) {
      form.setFieldsValue({ duration: selectedExam.duration });
    }
  };

  const handleDelete = async (quizId) => {
    try {
      setLoading(true);
      await api.delete(`/quizzes/${quizId}`);
      message.success("Đã xóa lịch thi.");
      fetchData();
    } catch (error) {
      message.error("Xóa thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { examId, classIds, timeRange, duration, accessCode, status } =
        values;
      const startTime = timeRange?.[0]
        ? timeRange[0].format("YYYY-MM-DD HH:mm:ss")
        : null;
      const endTime = timeRange?.[1]
        ? timeRange[1].format("YYYY-MM-DD HH:mm:ss")
        : null;

      const title =
        sourceExams.find((e) => e.value === examId)?.label || "Bài kiểm tra";
      const finalStatus = status || calculateStatusByTime(startTime, endTime);

      if (editingKey) {
        const payload = {
          Title: title,
          DurationMinutes: duration,
          StartTime: startTime,
          EndTime: endTime,
          AccessCode: accessCode,
          Status: finalStatus,
        };
        await api.put(`/quizzes/${editingKey}/distribute`, payload);
        message.success("Cập nhật thành công!");
      } else {
        const promises = classIds.map((clsId) => {
          const payload = {
            ParentQuizId: examId,
            ClassId: clsId,
            Title: title,
            DurationMinutes: duration,
            StartTime: startTime,
            EndTime: endTime,
            AccessCode: accessCode,
            Status: finalStatus,
          };
          return api.post(`/quizzes/${examId}/distribute`, payload);
        });
        await Promise.all(promises);
        message.success(`Đã phân phối cho ${classIds.length} lớp!`);
      }

      setIsModalOpen(false);
      setEditingKey(null);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER COLUMNS ---
  const columns = [
    {
      title: "Đề kiểm tra",
      dataIndex: "ExamName",
      width: 220,
      render: (text, record) => (
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => setPreviewId(record.key)}
        >
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
            <BookOpen size={16} />
          </div>
          <span
            className="font-medium text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors"
            title="Xem chi tiết đề"
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: "Lớp",
      dataIndex: "ClassName",
      width: 100,
      align: "center",
      render: (text) => (
        <Tag color="geekblue" className="min-w-[70px] text-center">
          {text}
        </Tag>
      ),
    },
    {
      title: "Cấu hình",
      width: 160,
      render: (_, record) => (
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-orange-500" />
            <span className="font-medium">{record.Duration} phút</span>
          </div>
          {record.AccessCode ? (
            <div className="flex items-center gap-1.5">
              <KeyRound size={12} className="text-indigo-500" />
              Code:{" "}
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 rounded">
                {record.AccessCode}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic pl-4">Không có mã</span>
          )}
        </div>
      ),
    },
    {
      title: "Thời gian",
      width: 240,
      render: (_, record) => (
        <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500">Bắt đầu:</span>
            <span className="text-slate-700 font-medium">
              {record.StartTime
                ? dayjs(record.StartTime).format("HH:mm DD/MM/YYYY")
                : "--"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Kết thúc:</span>
            <span className="text-slate-700 font-medium">
              {record.EndTime
                ? dayjs(record.EndTime).format("HH:mm DD/MM/YYYY")
                : "--"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "Status",
      width: 120,
      align: "center",
      render: (_, record) => {
        const statusConfig = STATUS_OPTIONS.find(
          (s) => s.value === record.Status
        ) || {
          label: "Không xác định",
          color: "default",
          icon: null,
        };
        return (
          <Tag
            color={statusConfig.color}
            className="flex items-center justify-center gap-1 w-fit mx-auto border-0"
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "Action",
      width: 130, // 2. Tăng width để chứa đủ 3 nút
      align: "center",
      render: (_, record) => (
        <Space>
          {/* --- 3. THÊM NÚT XEM CHI TIẾT --- */}
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Eye size={16} className="text-slate-500" />}
              className="hover:bg-emerald-50 hover:text-emerald-600"
              onClick={() => setPreviewId(record.key)}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<Pencil size={15} className="text-slate-500" />}
              className="hover:bg-blue-50 hover:text-blue-600"
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          <Tooltip title="Hủy lịch">
            <Popconfirm
              title="Xóa lịch thi này?"
              description="Hành động này sẽ xóa bài thi khỏi lớp học."
              onConfirm={() => handleDelete(record.key)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: loading }}
            >
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<Trash2 size={15} className="text-slate-400" />}
                className="hover:bg-red-50 hover:text-red-600"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-4 bg-white shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-sm shadow-blue-100">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0 leading-tight">
                Lịch phân phối đề thi
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Quản lý thời gian và lớp học được phép truy cập đề
              </p>
            </div>
          </div>
          <Space>
            <Tooltip title="Làm mới dữ liệu">
              <Button
                icon={
                  <RefreshCcw
                    size={16}
                    className={dataLoading ? "animate-spin" : ""}
                  />
                }
                onClick={fetchData}
                disabled={dataLoading}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              className="bg-blue-600 hover:!bg-blue-500 h-9 px-4 rounded-lg font-medium shadow-sm shadow-blue-200 flex items-center"
              onClick={handleOpenCreate}
            >
              Tạo lịch mới
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div className="flex gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Input
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Tìm kiếm..."
            className="w-64 rounded-md border-slate-200 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Lọc theo Lớp"
            allowClear
            className="w-40"
            options={classesList}
            onChange={setFilterClass}
            suffixIcon={<Filter size={14} className="text-slate-400" />}
            loading={dataLoading}
          />
          <Select
            placeholder="Trạng thái"
            allowClear
            className="w-40"
            onChange={setFilterStatus}
            options={STATUS_OPTIONS}
            suffixIcon={<Clock size={14} className="text-slate-400" />}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-0">
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 8, className: "px-6 py-2" }}
          rowClassName="hover:bg-slate-50 group"
          loading={dataLoading}
          className="custom-exam-table flex-1"
        />
      </div>

      {/* MODAL EDIT/CREATE */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CalendarDays className="text-blue-600" size={20} />
            <span className="text-lg font-semibold text-slate-800">
              {editingKey ? "Cập nhật lịch thi" : "Thiết lập lịch thi mới"}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        centered
        footer={null}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4"
        >
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <BookOpen size={14} /> 1. Chọn đề & Lớp học
            </div>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Đề kiểm tra gốc"
                  name="examId"
                  rules={[{ required: true, message: "Vui lòng chọn đề thi" }]}
                  className="mb-3"
                >
                  <Select
                    showSearch
                    size="large"
                    placeholder="Tìm kiếm..."
                    options={sourceExams}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    onChange={handleExamSelect}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label={editingKey ? "Lớp áp dụng" : "Áp dụng cho các lớp"}
                  name="classIds"
                  rules={[{ required: true, message: "Chọn ít nhất 1 lớp" }]}
                  className="mb-0"
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Chọn lớp..."
                    options={classesList}
                    maxTagCount="responsive"
                    disabled={!!editingKey}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div className="bg-white p-1 mb-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              <Settings2 size={14} /> 2. Cấu hình chi tiết
            </div>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Thời lượng (phút)"
                  name="duration"
                  rules={[{ required: true, message: "Nhập thời gian" }]}
                >
                  <InputNumber
                    min={5}
                    max={180}
                    size="large"
                    className="w-full"
                    placeholder="45"
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Mã bảo vệ (Code)" name="accessCode">
                  <Input
                    size="large"
                    placeholder="Tùy chọn..."
                    addonAfter={
                      <Tooltip title="Tạo mã ngẫu nhiên">
                        <RefreshCcw
                          size={16}
                          className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={generateCode}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item
                  label="Thời gian mở & đóng đề"
                  name="timeRange"
                  rules={[
                    { required: true, message: "Vui lòng chọn thời gian" },
                  ]}
                  className="mb-0"
                >
                  <RangePicker
                    showTime={{ format: "HH:mm" }}
                    format="YYYY-MM-DD HH:mm"
                    size="large"
                    className="w-full"
                    placeholder={["Bắt đầu mở", "Kết thúc"]}
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  label="Trạng thái"
                  name="status"
                  rules={[{ required: true, message: "Chọn trạng thái" }]}
                  className="mb-0"
                >
                  <Select
                    size="large"
                    placeholder="Chọn..."
                    options={STATUS_OPTIONS}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Divider className="my-4" />
          <div className="flex justify-end gap-3">
            <Button size="large" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<Save size={18} />}
              className="bg-blue-600 hover:!bg-blue-500 shadow-sm shadow-blue-200"
            >
              {editingKey ? "Lưu thay đổi" : "Xác nhận lên lịch"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL PREVIEW (MỚI) */}
      <PreviewExamModal
        quizId={previewId}
        open={!!previewId}
        onCancel={() => setPreviewId(null)}
      />
    </div>
  );
};

export default ExamDistribution;
