import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Row, Col } from "antd";
import { Button } from "@mui/material";

const AdminStudentRegisterModal = ({ open, onCancel, onFinish }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={
        <h3 className="text-lg font-bold text-blue-600">Thêm mới Học viên</h3>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800} // Tăng width lên chút (700 -> 800) để 3 cột đỡ bị chật
    >
      <Form layout="vertical" onFinish={onFinish} form={form}>
        {/* --- PHẦN 1: THÔNG TIN TÀI KHOẢN (3 Cột) --- */}
        <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-100">
          <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">
            Thông tin đăng nhập
          </h4>
          <Row gutter={16}>
            <Col span={8}>
              {" "}
              {/* Đổi từ 12 -> 8 */}
              <Form.Item
                label="Tên tài khoản"
                name="UserName"
                rules={[
                  { required: true, message: "Vui lòng nhập tài khoản" },
                  { min: 4, message: "Tên tài khoản phải từ 4 ký tự" },
                ]}
              >
                <Input placeholder="Ví dụ: sv2024001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              {" "}
              {/* Đổi từ 12 -> 8 */}
              <Form.Item
                label="Email"
                name="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập Email" },
                  { type: "email", message: "Email sai định dạng" },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={8}>
              {" "}
              {/* Đổi từ 12 -> 8 */}
              <Form.Item
                label="Mật khẩu"
                name="Password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu" },
                  { min: 6, message: "Mật khẩu phải từ 6 ký tự" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* --- PHẦN 2: THÔNG TIN CÁ NHÂN (Giữ nguyên 2 cột) --- */}
        <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">
          Thông tin cá nhân
        </h4>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="FullName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Mã sinh viên" name="StudentCode">
              <Input placeholder="SV001" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Số điện thoại" name="PhoneNo">
              <Input placeholder="09xxxxxxx" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="SĐT Phụ huynh" name="ParentPhoneNo">
              <Input placeholder="Số điện thoại phụ huynh" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Ngày sinh" name="BirthDate">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Trường học" name="SchoolName">
              <Input placeholder="THPT..." />
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

export default AdminStudentRegisterModal;
