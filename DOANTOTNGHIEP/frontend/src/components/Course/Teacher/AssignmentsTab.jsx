import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  BarChart3,
  Pencil,
  Trash2,
  Eye,
  Save,
  BookOpen,
  Upload as UploadIcon,
  Paperclip,
  X as XIcon,
} from "lucide-react";
import {
  Table,
  Button,
  Input,
  Tag,
  Tooltip,
  Progress,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Descriptions,
  Empty,
  Upload,
  Radio,
} from "antd";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";

// --- SUB-COMPONENT: QUIZ SELECTOR (GIỮ NGUYÊN) ---
const QuizSelector = ({ open, onCancel, onSelectQuiz, courseId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    if (open) fetchQuizzes();
  }, [open]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes`, {
        params: { courseId, type: "master" },
      });
      setQuizzes(res.data);
    } catch (error) {
      message.error("Lỗi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên bài kiểm tra",
      dataIndex: "Title",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Số câu",
      dataIndex: "QuestionCount",
      align: "center",
      render: (c) => <Tag color="blue">{c} câu</Tag>,
    },
    {
      title: "Thời gian",
      dataIndex: "DurationMinutes",
      render: (m) => <span>{m} phút</span>,
    },
  ];

  const handleOk = () => {
    if (!selectedQuizId) return;
    const selectedQuiz = quizzes.find((q) => q.QuizId === selectedQuizId);
    onSelectQuiz(selectedQuiz);
    onCancel();
  };

  return (
    <Modal
      title="Chọn đề thi từ Ngân hàng"
      open={open}
      onCancel={onCancel}
      width={700}
      onOk={handleOk}
      okButtonProps={{ disabled: !selectedQuizId }}
      centered
    >
      <Table
        rowKey="QuizId"
        columns={columns}
        dataSource={quizzes}
        loading={loading}
        rowSelection={{
          type: "radio",
          selectedRowKeys: selectedQuizId ? [selectedQuizId] : [],
          onChange: (keys) => setSelectedQuizId(keys[0]),
        }}
        pagination={{ pageSize: 5 }}
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedQuizId(record.QuizId),
          style: { cursor: "pointer" },
        })}
      />
    </Modal>
  );
};

// --- COMPONENT 1: ASSIGNMENT FORM MODAL (CẬP NHẬT) ---
const AssignmentFormModal = ({
  open,
  onCancel,
  onFinish,
  initialValues,
  loading,
  courseId,
}) => {
  const [form] = Form.useForm();
  const [assignmentType, setAssignmentType] = useState("homework");

  // State cho Quiz Selector
  const [showQuizSelector, setShowQuizSelector] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Edit Mode
        form.setFieldsValue({
          ...initialValues,
          dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
          file: [],
        });
        setAssignmentType(initialValues.type === "quiz" ? "quiz" : "homework");

        if (initialValues.type === "quiz" && initialValues.QuizId) {
          setSelectedQuiz({
            QuizId: initialValues.QuizId,
            Title: initialValues.QuizTitle || "Đề thi đã chọn",
          });
        } else {
          setSelectedQuiz(null);
        }
      } else {
        // Create Mode
        form.resetFields();
        setAssignmentType("homework");
        setSelectedQuiz(null);
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      // --- THAY ĐỔI: KHÔNG CÒN BẮT BUỘC CHỌN QUIZ ---
      // Nếu user chọn type=quiz nhưng không chọn đề từ ngân hàng,
      // hệ thống hiểu là quiz làm trên giấy/file pdf.

      const submitData = {
        ...values,
        type: assignmentType,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        // Chỉ gửi quizId nếu đã chọn, nếu không thì null
        quizId:
          assignmentType === "quiz" && selectedQuiz
            ? selectedQuiz.QuizId
            : null,
        file:
          values.file && values.file.length > 0
            ? values.file[0].originFileObj
            : null,
      };
      onFinish(submitData);
    });
  };

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  return (
    <>
      <Modal
        title={
          <div className="text-lg font-bold text-slate-800">
            {initialValues ? "Cập nhật bài tập" : "Tạo bài tập mới"}
          </div>
        }
        open={open}
        onCancel={onCancel}
        width={700}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<Save size={16} />}
            onClick={handleSubmit}
            loading={loading}
          >
            Lưu
          </Button>,
        ]}
        centered
      >
        <Form form={form} layout="vertical" className="pt-2">
          {/* 1. CHỌN LOẠI BÀI TẬP */}
          <Form.Item label="Loại hình đánh giá" className="mb-4">
            <Radio.Group
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              buttonStyle="solid"
              className="w-full grid grid-cols-2 gap-4"
            >
              <Radio.Button
                value="homework"
                className="text-center h-12 flex items-center justify-center rounded-lg border-slate-300"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} /> Tự luận / Nộp file
                </div>
              </Radio.Button>
              <Radio.Button
                value="quiz"
                className="text-center h-12 flex items-center justify-center rounded-lg border-slate-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} /> Trắc nghiệm (Quiz)
                </div>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: "Nhập tiêu đề" }]}
              >
                <Input size="large" placeholder="VD: Kiểm tra 15 phút..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hạn nộp"
                name="dueDate"
                rules={[{ required: true, message: "Chọn hạn nộp" }]}
              >
                <DatePicker
                  showTime
                  format="HH:mm DD/MM/YYYY"
                  className="w-full"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 2. KHU VỰC RIÊNG CHO TRẮC NGHIỆM (OPTIONAL) */}
          {assignmentType === "quiz" && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 mb-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-800 flex items-center gap-2">
                  <BookOpen size={16} /> Liên kết đề thi (Tùy chọn)
                </span>
                {selectedQuiz ? (
                  <div className="flex items-center gap-2">
                    <Tag
                      color="green"
                      className="m-0 px-2 py-0.5 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> {selectedQuiz.Title}
                    </Tag>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<XIcon size={14} />}
                      onClick={() => setSelectedQuiz(null)}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    Chưa chọn đề nào
                  </span>
                )}
              </div>

              {!selectedQuiz ? (
                <Button
                  block
                  type="dashed"
                  className="border-blue-300 text-blue-500 hover:text-blue-700 hover:border-blue-500"
                  onClick={() => setShowQuizSelector(true)}
                >
                  Chọn đề từ Ngân hàng câu hỏi
                </Button>
              ) : (
                <div className="text-xs text-blue-600 pl-6">
                  Học sinh sẽ làm bài trực tiếp trên hệ thống với đề thi này.
                </div>
              )}
            </div>
          )}

          {/* 3. KHU VỰC UPLOAD FILE (DÙNG CHUNG CHO CẢ 2) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed mb-4">
            <Form.Item
              label={
                <span className="flex items-center gap-2">
                  <Paperclip size={16} /> Tài liệu đính kèm (PDF đề bài, Hình
                  ảnh...)
                </span>
              }
              name="file"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              className="mb-0"
              extra="Nếu không chọn đề từ ngân hàng, hãy tải file đề bài lên đây."
            >
              <Upload
                maxCount={1}
                beforeUpload={() => false}
                listType="picture"
              >
                <Button icon={<UploadIcon size={16} />} block>
                  Tải lên tệp đính kèm
                </Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item label="Mô tả / Ghi chú" name="description">
            <Input.TextArea rows={3} placeholder="Hướng dẫn làm bài..." />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            initialValue="active"
            className="mb-0"
          >
            <Select
              size="large"
              options={[
                { value: "active", label: "Công khai ngay" },
                { value: "draft", label: "Lưu nháp" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <QuizSelector
        open={showQuizSelector}
        onCancel={() => setShowQuizSelector(false)}
        onSelectQuiz={setSelectedQuiz}
        courseId={courseId}
      />
    </>
  );
};

// --- COMPONENT 2: DETAIL MODAL (CẬP NHẬT HIỂN THỊ) ---
const AssignmentDetailModal = ({ open, onCancel, data }) => {
  if (!data) return null;
  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
    >
      <div className="flex items-start justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{data.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={data.type} />
              <StatusBadge status={data.status} />
            </div>
          </div>
        </div>
      </div>
      <Descriptions column={1} layout="vertical">
        <Descriptions.Item label="Thời gian">
          {dayjs(data.dueDate).format("HH:mm DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Tiến độ">
          <Progress
            percent={
              data.total > 0
                ? Math.round((data.submitted / data.total) * 100)
                : 0
            }
          />
        </Descriptions.Item>

        {data.fileUrl && (
          <Descriptions.Item label="Tài liệu đính kèm">
            <Button
              type="primary"
              ghost
              href={data.fileUrl}
              target="_blank"
              icon={<Paperclip size={16} />}
            >
              Tải xuống tài liệu
            </Button>
          </Descriptions.Item>
        )}

        {/* Chỉ hiện info quiz nếu có QuizId */}
        {data.type === "quiz" && data.quizId && (
          <Descriptions.Item label="Đề thi trực tuyến">
            <div className="p-3 bg-blue-50 rounded border border-blue-100 text-blue-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Bài tập này sử dụng đề thi trắc nghiệm
              từ hệ thống.
            </div>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Mô tả">
          <div className="bg-slate-50 p-3 rounded whitespace-pre-wrap">
            {data.description || "Không có mô tả"}
          </div>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

// --- HELPER COMPONENTS ---
const TypeBadge = ({ type }) => {
  const config =
    type === "quiz"
      ? { color: "blue", label: "Trắc nghiệm", icon: CheckCircle2 }
      : { color: "purple", label: "Tự luận", icon: FileText };
  const Icon = config.icon;
  return (
    <Tag color={config.color} className="flex items-center gap-1">
      <Icon size={12} /> {config.label}
    </Tag>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: { color: "success", text: "Đang mở" },
    draft: { color: "default", text: "Nháp" },
  };
  const style = styles[status] || styles.draft;
  return <Tag color={style.color}>{style.text}</Tag>;
};

// --- MAIN COMPONENT ---
const AssignmentsTab = ({ classId, courseId }) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const fetchAssignments = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/assignments/class/${classId}?search=${searchTerm}`
      );
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [classId, searchTerm]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      // Dùng FormData để hỗ trợ file + các trường text
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("dueDate", values.dueDate);
      formData.append("type", values.type);
      formData.append("status", values.status);
      formData.append("classId", classId);

      // Nếu có quizId thì gửi (nếu user chọn)
      if (values.quizId) {
        formData.append("quizId", values.quizId);
      }

      // Nếu có file upload
      if (values.file) {
        formData.append("file", values.file);
      }

      // GỌI API (Backend dùng chung 1 endpoint POST /assignments hỗ trợ multipart)
      if (editingItem) {
        await api.put(`/assignments/${editingItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Cập nhật thành công!");
      } else {
        await api.post("/assignments", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Tạo bài tập thành công!");
      }

      setIsFormOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xóa bài tập?",
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(`/assignments/${record.id}`);
          message.success("Đã xóa");
          fetchAssignments();
        } catch (e) {
          message.error("Lỗi xóa");
        }
      },
    });
  };

  const columns = [
    {
      title: "Tên bài tập",
      key: "title",
      render: (_, record) => (
        <div
          className="cursor-pointer"
          onClick={() => {
            setViewItem(record);
            setIsDetailOpen(true);
          }}
        >
          <div className="font-bold text-slate-700">{record.title}</div>
          <div className="flex gap-1 mt-1">
            <TypeBadge type={record.type} />
            <StatusBadge status={record.status} />
          </div>
        </div>
      ),
    },
    {
      title: "Hạn nộp",
      render: (_, r) => (
        <div className="text-slate-600">
          {dayjs(r.dueDate).format("HH:mm DD/MM")}
        </div>
      ),
    },
    {
      title: "Tiến độ",
      render: (_, r) => (
        <Progress
          percent={r.total > 0 ? Math.round((r.submitted / r.total) * 100) : 0}
          size="small"
        />
      ),
    },
    {
      title: "",
      render: (_, r) => (
        <div className="flex gap-2 justify-end">
          <Button
            size="small"
            icon={<Pencil size={14} />}
            onClick={() => {
              setEditingItem(r);
              setIsFormOpen(true);
            }}
          />
          <Button
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDelete(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          prefix={<Search size={16} className="text-gray-400" />}
          placeholder="Tìm kiếm..."
          className="w-64 rounded-lg"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          type="primary"
          icon={<Plus size={16} />}
          className="bg-blue-600"
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          Tạo mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        className="custom-table"
      />

      <AssignmentFormModal
        open={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onFinish={handleFormSubmit}
        initialValues={editingItem}
        loading={formLoading}
        courseId={courseId}
      />

      <AssignmentDetailModal
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        data={viewItem}
      />

      <style>{`
        .custom-table .ant-table-thead > tr > th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; }
        .custom-table .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
      `}</style>
    </div>
  );
};

export default AssignmentsTab;
