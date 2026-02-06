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
  Typography,
} from "antd";
import { Layers, Save, X, Copy } from "lucide-react";

const { Text } = Typography;

const ChapterModal = ({
  open,
  onClose,
  onFinish,
  initialValues,
  existingChapters = [],
  masterChapters = [],
}) => {
  const [form] = Form.useForm();
  const isEditMode = !!initialValues;

  // --- HÀM TÍNH TOÁN STT GỢI Ý ---
  const getNextOrderIndex = () => {
    if (!existingChapters || existingChapters.length === 0) return 1;
    // Lấy danh sách các OrderIndex hiện có
    const orders = existingChapters.map((c) => c.OrderIndex || 0);
    // Tìm max, nếu không có phần tử nào thì mặc định là 0
    const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
    return maxOrder + 1;
  };

  // --- EFFECT: XỬ LÝ KHI MỞ MODAL ---
  useEffect(() => {
    if (open) {
      // Quan trọng: Reset form trước khi điền dữ liệu mới để xóa lỗi cũ/dữ liệu cũ
      form.resetFields();

      if (isEditMode) {
        // Chế độ Edit: Fill dữ liệu cũ
        form.setFieldsValue(initialValues);
      } else {
        // Chế độ Create: Điền STT gợi ý
        form.setFieldsValue({ OrderIndex: getNextOrderIndex() });
      }
    }
  }, [open, initialValues, existingChapters, form, isEditMode]);

  // --- SUBMIT FORM ---
  const handleSubmit = (values) => {
    // Loại bỏ trường sampleChapterId (chỉ dùng cho UI) trước khi gửi lên cha
    const { sampleChapterId, ...submitData } = values;
    onFinish(submitData);
  };

  // --- XỬ LÝ CHỌN DỮ LIỆU MẪU ---
  const handleSelectSample = (value) => {
    // Tìm chapter mẫu dựa trên ID (Lưu ý: masterChapters có thể dùng CourseChapterId hoặc ID khác tùy backend)
    const selectedSample = masterChapters.find(
      (c) => c.CourseChapterId === value || c.ChapterId === value,
    );

    if (selectedSample) {
      form.setFieldsValue({
        Title: selectedSample.Title,
        Description: selectedSample.Description,
        // Giữ nguyên OrderIndex đã tính toán, không ghi đè bằng mẫu
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <Layers size={20} />
          <span className="font-bold text-lg">
            {isEditMode ? "Cập nhật Chương" : "Tạo Chương Mới"}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      maskClosable={false} 
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-5"
      >
        {/* --- KHU VỰC CHỌN MẪU (CHỈ HIỆN KHI TẠO MỚI) --- */}
        {!isEditMode && masterChapters && masterChapters.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Form.Item
              name="sampleChapterId"
              label={
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                  <Copy size={16} />
                  <span>Sao chép nhanh từ Chương trình gốc</span>
                </div>
              }
              className="mb-0"
              help={
                <Text type="secondary" className="text-xs">
                  Chọn một chương mẫu để tự động điền Tên và Mô tả.
                </Text>
              }
            >
              <Select
                placeholder="-- Chọn chương mẫu --"
                onChange={handleSelectSample}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {masterChapters.map((c) => (
                  <Select.Option
                    // Sử dụng ID duy nhất của Master Chapter
                    key={c.CourseChapterId || c.ChapterId}
                    value={c.CourseChapterId || c.ChapterId}
                  >
                    {c.Title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        )}

        {/* --- FORM NHẬP LIỆU CHÍNH --- */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="OrderIndex"
              label="Số thứ tự"
              rules={[{ required: true, message: "Nhập STT" }]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }} // Fix lỗi InputNumber bị bé
                placeholder="1"
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name="Title"
              label="Tên chương"
              rules={[
                { required: true, message: "Vui lòng nhập tên chương" },
                { max: 255, message: "Tên chương không quá 255 ký tự" },
              ]}
            >
              <Input
                placeholder="Ví dụ: Chương 1: Giới thiệu tổng quan"
                autoFocus
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="Description" label="Mô tả nội dung">
          <Input.TextArea
            rows={4}
            placeholder="Mô tả ngắn gọn về những gì học viên sẽ học trong chương này..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* --- FOOTER BUTTONS --- */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <Button onClick={onClose} icon={<X size={16} />}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-blue-600 hover:!bg-blue-700 shadow-md"
            icon={<Save size={16} />}
          >
            {isEditMode ? "Lưu thay đổi" : "Hoàn tất"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ChapterModal;
