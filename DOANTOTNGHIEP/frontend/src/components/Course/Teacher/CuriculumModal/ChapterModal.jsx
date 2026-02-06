import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  InputNumber,
  Row,
  Col,
  Select,
} from "antd";
import { Layers, Save, X, Copy } from "lucide-react";

const ChapterModal = ({
  open,
  onClose,
  onFinish,
  initialValues,
  existingChapters = [],
  masterChapters = [], // Dữ liệu mẫu từ kho
}) => {
  const [form] = Form.useForm();

  // Hàm tính toán STT gợi ý (Max + 1)
  // Chỉ dùng để điền mặc định, không bắt buộc dùng
  const getNextOrderIndex = () => {
    if (!existingChapters || existingChapters.length === 0) return 1;
    const maxOrder = Math.max(
      ...existingChapters.map((c) => c.OrderIndex || 0)
    );
    return maxOrder + 1;
  };

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Chế độ Edit: Fill dữ liệu cũ
        form.setFieldsValue(initialValues);
      } else {
        // Chế độ Create: Reset và điền STT gợi ý
        form.resetFields();
        form.setFieldsValue({ OrderIndex: getNextOrderIndex() });
      }
    }
  }, [open, initialValues, existingChapters, form]);

  const handleSubmit = (values) => {
    // Loại bỏ trường sampleChapterId thừa trước khi gửi lên cha
    const { sampleChapterId, ...submitData } = values;
    onFinish(submitData);
  };

  // --- XỬ LÝ CHỌN DỮ LIỆU MẪU ---
  const handleSelectSample = (value) => {
    const selectedSample = masterChapters.find(
      (c) => c.CourseChapterId === value
    );
    if (selectedSample) {
      form.setFieldsValue({
        Title: selectedSample.Title,
        Description: selectedSample.Description,
        // Không set OrderIndex để giữ nguyên tính toán của lớp hiện tại
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-orange-700">
          <Layers size={20} />
          <span>{initialValues ? "Cập nhật Chương" : "Tạo Chương Mới"}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        {/* Chỉ hiện phần chọn mẫu khi đang tạo mới */}
        {!initialValues && masterChapters.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <Form.Item
              name="sampleChapterId"
              label={
                <span className="flex items-center gap-2 text-orange-800 font-semibold">
                  <Copy size={14} /> Sao chép từ Chương trình gốc
                </span>
              }
              className="mb-0"
            >
              <Select
                placeholder="-- Chọn chương mẫu để điền nhanh --"
                onChange={handleSelectSample}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {masterChapters.map((c) => (
                  <Select.Option
                    key={c.CourseChapterId}
                    value={c.CourseChapterId}
                  >
                    {c.Title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        )}

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="OrderIndex"
              label="Số thứ tự"
              // Cho phép trùng, chỉ cần required
              rules={[{ required: true, message: "Nhập STT" }]}
            >
              <InputNumber min={1} className="w-full" placeholder="VD: 1" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name="Title"
              label="Tên chương"
              rules={[{ required: true, message: "Vui lòng nhập tên chương" }]}
            >
              <Input placeholder="Ví dụ: Giới thiệu tổng quan" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="Description" label="Mô tả ngắn">
          <Input.TextArea rows={4} placeholder="Mô tả nội dung chính..." />
        </Form.Item>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <Button onClick={onClose} icon={<X size={16} />}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-orange-600 hover:!bg-orange-700"
            icon={<Save size={16} />}
          >
            {initialValues ? "Lưu thay đổi" : "Tạo chương"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ChapterModal;
