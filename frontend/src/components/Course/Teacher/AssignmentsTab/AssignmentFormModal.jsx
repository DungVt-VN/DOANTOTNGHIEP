import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  BookOpen,
  Upload as UploadIcon,
  Paperclip,
  X as XIcon,
  CloudUpload,
  Trash2,
} from "lucide-react";
import {
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Upload,
  Radio,
} from "antd";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";
import QuizSelector from "./QuizSelector"; // Đảm bảo đường dẫn import đúng

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
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizSelector, setShowQuizSelector] = useState(false);

  // State quản lý file upload
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setFileList([]);
      setSelectedQuiz(null);
      setAssignmentType("homework");

      if (initialValues) {
        form.setFieldsValue({
          title: initialValues.Title,
          description: initialValues.Description,
          dueDate: initialValues.DueDate ? dayjs(initialValues.DueDate) : null,
          status: initialValues.Status,
          fileUrl: initialValues.FileUrl,
        });

        const type = initialValues.Type || "homework";
        setAssignmentType(type);

        if (initialValues.FileUrl) {
          setFileList([
            {
              uid: "-1",
              name: "Tài liệu hiện tại (Đã tải lên)",
              status: "done",
              url: initialValues.FileUrl,
            },
          ]);
        }

        // Hiển thị Quiz cũ nếu có
        if (initialValues.QuizId) {
          setSelectedQuiz({
            QuizId: initialValues.QuizId,
            // Nếu API danh sách không trả về tên Quiz, hiển thị tạm text này
            // Hoặc bạn cần join bảng ở backend để lấy QuizTitle
            Title: initialValues.QuizTitle || "Đề thi đã chọn",
          });
        }
      }
    }
  }, [open, initialValues, form]);

  // --- 1. UPLOAD FILE THỦ CÔNG ---
  const handleManualUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await api.post("/users/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data.data.url;
      form.setFieldValue("fileUrl", uploadedUrl);

      setFileList((prev) => {
        const newFileList = [...prev];
        const index = newFileList.findIndex((item) => item.uid === file.uid);
        if (index > -1) {
          newFileList[index].status = "done";
          newFileList[index].url = uploadedUrl;
          newFileList[index].name = file.name;
        }
        return newFileList;
      });

      message.success("Tải lên thành công!");
    } catch (err) {
      console.error(err);
      message.error("Tải lên thất bại.");
      setFileList((prev) => {
        const newFileList = [...prev];
        const index = newFileList.findIndex((item) => item.uid === file.uid);
        if (index > -1) newFileList[index].status = "error";
        return newFileList;
      });
    } finally {
      setUploading(false);
    }
  };

  // --- 2. CHẶN AUTO UPLOAD ---
  const handleBeforeUpload = (file) => {
    setFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "origin", // Chưa upload
        originFileObj: file,
      },
    ]);
    return false;
  };

  const handleRemoveFile = () => {
    setFileList([]);
    form.setFieldValue("fileUrl", null);
  };

  const handleSubmit = () => {
    const pendingFile = fileList.find((f) => f.status === "origin");
    if (pendingFile) {
      message.warning("Vui lòng ấn nút 'Tải lên' bên cạnh file trước khi Lưu!");
      return;
    }

    form.validateFields().then((values) => {
      const submitData = {
        ...values,
        type: assignmentType,
        quizId:
          assignmentType === "quiz" && selectedQuiz
            ? selectedQuiz.QuizId
            : null,
        fileUrl: values.fileUrl,
      };
      onFinish(submitData);
    });
  };

  return (
    <>
      <Modal
        title={initialValues ? "Cập nhật bài tập" : "Tạo bài tập mới"}
        open={open}
        onCancel={onCancel}
        width={700}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText="Lưu"
        cancelText="Hủy"
        centered
        destroyOnClose={true}
      >
        <Form form={form} layout="vertical" className="pt-2">
          <Form.Item name="fileUrl" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Loại hình" className="mb-4">
            <Radio.Group
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              buttonStyle="solid"
              // Không cho đổi loại khi đang Edit để tránh lỗi dữ liệu
              disabled={!!initialValues}
              className="w-full grid grid-cols-2 gap-4"
            >
              <Radio.Button value="homework" className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <FileText size={16} /> Tự luận / Nộp file
                </div>
              </Radio.Button>
              <Radio.Button value="quiz" className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Trắc nghiệm (Quiz)
                </div>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="VD: Bài tập về nhà buổi 1" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Hạn nộp"
                name="dueDate"
                rules={[{ required: true, message: "Vui lòng chọn hạn nộp" }]}
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

          {assignmentType === "quiz" && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-800 flex items-center gap-2">
                  <BookOpen size={16} /> Đề thi liên kết:
                </span>
                {selectedQuiz ? (
                  <div className="flex items-center gap-2">
                    <Tag
                      color="green"
                      className="flex items-center gap-1 text-sm py-1 px-2"
                    >
                      <CheckCircle2 size={12} /> {selectedQuiz.Title}
                    </Tag>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<XIcon size={14} />}
                      onClick={() => setSelectedQuiz(null)}
                    />
                  </div>
                ) : (
                  <Button
                    type="dashed"
                    onClick={() => setShowQuizSelector(true)}
                  >
                    + Chọn đề từ ngân hàng
                  </Button>
                )}
              </div>
              {!selectedQuiz && (
                <div className="text-xs text-slate-500 mt-2 ml-6">
                  * Nếu không chọn, hệ thống sẽ hiểu là quiz làm trên giấy.
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Paperclip size={16} /> Tài liệu đính kèm
              </span>
            </div>
            <Form.Item className="mb-0">
              <Upload
                beforeUpload={handleBeforeUpload}
                onRemove={handleRemoveFile}
                fileList={fileList}
                maxCount={1}
                itemRender={(originNode, file) => (
                  <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded mt-2">
                    <div className="flex items-center gap-2 truncate max-w-[60%]">
                      <Paperclip
                        size={14}
                        className="text-slate-400 shrink-0"
                      />
                      <span
                        className={`truncate text-sm ${
                          file.status === "done"
                            ? "text-green-600"
                            : "text-slate-700"
                        }`}
                      >
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status !== "done" && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<CloudUpload size={14} />}
                          loading={uploading}
                          onClick={() => handleManualUpload(file.originFileObj)}
                        >
                          Tải lên
                        </Button>
                      )}
                      {file.status === "done" && (
                        <Tag color="success" className="mr-0">
                          Đã tải lên
                        </Tag>
                      )}
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={handleRemoveFile}
                      />
                    </div>
                  </div>
                )}
              >
                {fileList.length < 1 && (
                  <Button icon={<UploadIcon size={16} />} block>
                    Chọn tệp (PDF, Word, Ảnh...)
                  </Button>
                )}
              </Upload>
            </Form.Item>
          </div>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Hướng dẫn làm bài..." />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status">
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

export default AssignmentFormModal;
