import React, { useState, useContext } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { Lock, KeyRound } from "lucide-react";
import api from "@/utils/axiosInstance";
import { AuthContext } from "@/context/authContext";

const ChangePasswordModal = ({ open, onClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        userId: currentUser.UserId,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công!");
      form.resetFields();
      onClose();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data || "Đã có lỗi xảy ra.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-gray-800">
          <KeyRound size={20} className="text-blue-600" />
          <span>Đổi mật khẩu</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
          ]}
        >
          <Input.Password
            prefix={<Lock size={16} className="text-gray-400" />}
            placeholder="Nhập mật khẩu cũ"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<KeyRound size={16} className="text-gray-400" />}
            placeholder="Nhập mật khẩu mới"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<KeyRound size={16} className="text-gray-400" />}
            placeholder="Nhập lại mật khẩu mới"
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-blue-600"
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
