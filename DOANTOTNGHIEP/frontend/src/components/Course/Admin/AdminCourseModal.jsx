import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Upload,
  message,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  DeleteOutlined, // Import thêm icon xóa
} from "@ant-design/icons";
import { Button } from "@mui/material";
import api from "@/utils/axiosInstance";

const AdminCourseModal = ({ open, mode, data, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const isView = mode === "view";

  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (open) {
      if (data) {
        form.setFieldsValue({
          ...data,
          BaseTuitionFee: data.BaseTuitionFee ? Number(data.BaseTuitionFee) : 0,
        });

        const validImg = data.CourseImage || "";
        setImageUrl(validImg);

        if (validImg) {
          setFileList([
            { uid: "-1", name: "image", status: "done", url: validImg },
          ]);
        }
      } else {
        form.resetFields();
        setFileList([]);
        setImageUrl("");
      }
    }
  }, [open, data, form]);

  const handleBeforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("Chỉ được upload file JPG hoặc PNG!");
      return Upload.LIST_IGNORE;
    }
    setFileList([file]);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImageUrl(reader.result);
    return false; // Ngăn auto upload của Antd
  };

  const handleRemoveImage = () => {
    setFileList([]);
    setImageUrl(""); // Xóa URL trong state để biết là user muốn xóa ảnh
  };

  const uploadImageToServer = async (courseId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/users/course-image/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      message.error("Lỗi khi tải ảnh lên server.");
    }
  };

  const handleSubmit = async (values) => {
    if (isView) return;

    setUploading(true);
    try {
      let courseId = data?.CourseId;

      // --- LOGIC FIX: QUAN TRỌNG ---
      // Nếu imageUrl rỗng (do user xóa), gửi null lên server.
      // Nếu imageUrl còn giá trị, giữ nguyên giá trị cũ (hoặc null nếu tạo mới),
      // việc upload ảnh mới sẽ được xử lý riêng ở bước sau.
      const payload = {
        ...values,
        CourseImage: imageUrl ? data?.CourseImage || null : null,
      };

      if (mode === "create") {
        const res = await api.post("/courses", payload); // Gửi payload thay vì values để đảm bảo field ảnh đúng
        courseId = res.data.courseId;
      } else {
        await api.put(`/courses/${courseId}`, payload);
      }

      // Chỉ upload nếu có file mới (file chưa có url thực)
      const file = fileList[0];
      if (file && !file.url) {
        await uploadImageToServer(courseId, file);
      }

      message.success(
        mode === "create" ? "Tạo mới thành công!" : "Cập nhật thành công!"
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  return (
    <Modal
      title={
        <h3 className="text-lg font-bold text-blue-600">
          {isView ? "Chi tiết" : mode === "create" ? "Thêm mới" : "Cập nhật"}{" "}
          Khóa học
        </h3>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        disabled={isView || uploading}
      >
        <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-100">
          <h4 className="text-sm font-bold text-blue-800 uppercase mb-3">
            Thông tin cơ bản
          </h4>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Tên khóa học"
                name="CourseName"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khóa học" },
                ]}
              >
                <Input
                  placeholder="Ví dụ: Lập trình Web Fullstack"
                  className={
                    isView ? "!bg-white !text-black !cursor-default" : ""
                  }
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Môn học" name="Subject">
                    <Input
                      placeholder="CNTT, Tiếng Anh..."
                      className={
                        isView ? "!bg-white !text-black !cursor-default" : ""
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Học phí (VNĐ)"
                    name="BaseTuitionFee"
                    rules={[
                      { required: true, message: "Vui lòng nhập học phí" },
                      {
                        type: "number",
                        min: 0,
                        message: "Học phí không được phép âm!",
                      },
                    ]}
                  >
                    <InputNumber
                      className={
                        isView
                          ? "!bg-white !text-black !cursor-default w-full"
                          : "w-full"
                      }
                      formatter={(val) =>
                        `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(val) =>
                        val ? val.replace(/\$\s?|(,*)/g, "") : ""
                      }
                      placeholder="Nhập số tiền..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* PHẦN ẢNH VÀ NÚT XÓA */}
            <Col span={8} className="flex flex-col items-center">
              <Form.Item label="Ảnh đại diện" className="mb-0">
                <div className="relative group">
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    beforeUpload={handleBeforeUpload}
                    fileList={fileList}
                    disabled={isView}
                    style={{ width: 120, height: 120, overflow: "hidden" }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                          opacity: isView ? 0.9 : 1,
                        }}
                      />
                    ) : (
                      uploadButton
                    )}
                  </Upload>

                  {/* UI Nút xóa ảnh mới: Nằm đè lên góc hoặc ngay bên dưới */}
                  {imageUrl && !isView && (
                    <div className="flex justify-center mt-2">
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        startIcon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        sx={{
                          fontSize: "0.75rem",
                          textTransform: "none",
                          color: "#ef4444",
                          "&:hover": {
                            backgroundColor: "#fee2e2",
                          },
                        }}
                      >
                        Xóa ảnh
                      </Button>
                    </div>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item label="Mô tả chi tiết" name="Description">
          <Input.TextArea
            rows={4}
            placeholder="Nhập mô tả về khóa học..."
            className={isView ? "!bg-white !text-black !cursor-default" : ""}
          />
        </Form.Item>

        {!isView && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outlined"
              color="error"
              onClick={onCancel}
              sx={{ textTransform: "none" }}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              type="submit"
              sx={{ textTransform: "none", bgcolor: "#2563eb" }}
              disabled={uploading}
              startIcon={uploading ? <LoadingOutlined /> : null}
            >
              {uploading ? "Đang lưu..." : "Lưu dữ liệu"}
            </Button>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default AdminCourseModal;
