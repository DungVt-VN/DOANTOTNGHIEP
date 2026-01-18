import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Row, Col } from "antd";
import { Button } from "@mui/material";

const AdminTeacherRegisterModal = ({ open, onCancel, onFinish }) => {
  const [form] = Form.useForm();

  // Reset form mỗi khi mở Modal
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={
        <h3 className="text-lg font-bold text-blue-600">Thêm mới Giáo viên</h3>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800} // Rộng hơn một chút so với Student để chứa nhiều info hơn
    >
      <Form layout="vertical" onFinish={onFinish} form={form}>
        {/* --- PHẦN 1: THÔNG TIN TÀI KHOẢN --- */}
        <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-100">
          <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">
            Thông tin đăng nhập
          </h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tên tài khoản"
                name="UserName"
                rules={[
                  { required: true, message: "Nhập tên tài khoản" },
                  { min: 4, message: "Tối thiểu 4 ký tự" },
                ]}
              >
                <Input placeholder="vd: gv_nguyena" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="Email"
                rules={[
                  { required: true, message: "Nhập Email" },
                  { type: "email", message: "Email sai định dạng" },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mật khẩu"
                name="Password"
                rules={[
                  { required: true, message: "Nhập mật khẩu" },
                  { min: 6, message: "Tối thiểu 6 ký tự" },
                ]}
              >
                <Input.Password placeholder="******" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* --- PHẦN 2: THÔNG TIN CÁ NHÂN --- */}
        <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
          Thông tin cá nhân
        </h4>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="FullName"
              rules={[{ required: true, message: "Nhập họ tên" }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Mã giáo viên"
              name="TeacherCode"
              rules={[{ required: true, message: "Nhập mã GV" }]}
            >
              <Input placeholder="GV2024..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="PhoneNo"
              rules={[{ required: true, message: "Nhập SĐT" }]}
            >
              <Input placeholder="09xxxxxxx" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Mức lương cơ bản" name="SalaryRate">
              <InputNumber
                className="w-full"
                placeholder="Nhập số tiền (VNĐ)"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Địa chỉ" name="Address">
              <Input placeholder="Nhập địa chỉ liên hệ" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Giới thiệu (Bio)" name="Bio">
              <Input.TextArea
                rows={3}
                placeholder="Kinh nghiệm, bằng cấp, giới thiệu ngắn..."
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="outlined"
            color="error"
            onClick={onCancel}
            sx={{ textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{ textTransform: "none", bgcolor: "#2563eb" }}
          >
            Xác nhận tạo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AdminTeacherRegisterModal;
