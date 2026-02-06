import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button } from "antd";
import { FileText, ArrowRight, Save } from "lucide-react";

const ExamFormModal = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();

  // Reset form hoặc set giá trị khi mở modal
  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Map dữ liệu từ initialValues (thường là chữ Hoa từ DB)
        // sang các field name (chữ thường) của Form
        form.setFieldsValue({
          title: initialValues.Title,
          durationMinutes: initialValues.Duration,
          passScore: initialValues.PassScore,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleFinish = (values) => {
    // values bây giờ sẽ là: { title: "...", durationMinutes: 45, passScore: 5 }
    onSubmit(values);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg text-slate-800 py-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FileText size={20} />
          </div>
          {initialValues ? "Cập nhật đề kiểm tra" : "Thiết lập đề kiểm tra"}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
        initialValues={{ durationMinutes: 45, passScore: 5 }}
      >
        <Form.Item
          name="title"
          label="Tên bài kiểm tra"
          rules={[
            { required: true, message: "Vui lòng nhập tên bài kiểm tra" },
          ]}
        >
          <Input
            size="large"
            placeholder="Ví dụ: Kiểm tra 15 phút - Chương 1"
            className="rounded-lg"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="durationMinutes"
            label="Thời gian (phút)"
            rules={[{ required: true, message: "Nhập thời gian" }]}
          >
            <InputNumber
              min={5}
              max={180}
              className="w-full rounded-lg"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="passScore" // Đổi từ "PassScore" -> "passScore"
            label="Điểm đạt (Thang 10)"
            rules={[{ required: true, message: "Nhập điểm đạt" }]}
          >
            <InputNumber
              max={10}
              min={0}
              step={0.1}
              className="w-full rounded-lg"
              size="large"
            />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button size="large" onClick={onCancel} className="rounded-lg">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="bg-blue-600 rounded-lg flex items-center gap-2"
          >
            {initialValues ? (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Save size={18} /> Lưu thay đổi
              </div>
            ) : (
              <div className="flex items-center gap-1 whitespace-nowrap">
                Tiếp tục <ArrowRight size={18} />
              </div>
            )}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ExamFormModal;
