import React, { useEffect, useState, useContext } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Upload,
  message,
  Row,
  Col,
  Avatar,
  Divider,
  Spin,
  Modal,
} from "antd";
import {
  User,
  Mail,
  Phone,
  UploadCloud,
  Save,
  School,
  Hash,
  Lock,
  KeyRound,
} from "lucide-react"; // Đã bỏ import Tag ở đây
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";
import { AuthContext } from "@/context/authContext";

const StudentProfile = () => {
  const { currentUser } = useContext(AuthContext);

  // State cho Profile
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState("");

  // State cho Modal Đổi mật khẩu
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  // 1. Fetch Data Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const res = await api.get(
          `/accounts/student/${currentUser.StudentId}/${currentUser.UserId}`,
        );
        const student = res.data;
        setData(student);
        setAvatarUrl(student.Avatar);

        form.setFieldsValue({
          ...student,
          BirthDate: student.BirthDate ? dayjs(student.BirthDate) : null,
          Email: student.Email,
        });
      } catch (error) {
        console.error(error);
        message.error("Lỗi tải thông tin cá nhân");
      }
    };
    fetchProfile();
  }, [currentUser, form]);

  // 2. Preview Avatar
  const handlePreviewAvatar = ({ file }) => {
    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target.result);
    reader.readAsDataURL(file.originFileObj);
    message.info(
      "Tính năng lưu ảnh đại diện đang được bảo trì (Backend cần middleware upload).",
    );
  };

  // 3. Submit Update Profile
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        FullName: values.FullName,
        PhoneNo: values.PhoneNo,
        ParentPhoneNo: values.ParentPhoneNo,
        SchoolName: values.SchoolName,
        StudentCode: values.StudentCode,
        Email: values.Email,
        BirthDate: values.BirthDate
          ? values.BirthDate.format("YYYY-MM-DD")
          : null,
      };

      await api.put(`/accounts/update-info/student`, payload);

      message.success("Cập nhật hồ sơ thành công!");
      setData((prev) => ({ ...prev, ...payload }));
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        message.error(error.response.data);
      } else {
        message.error("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Change Password
  const onChangePasswordFinish = async (values) => {
    setPasswordLoading(true);
    try {
      await api.put("/auth/change-password", {
        userId: currentUser.UserId,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công!");
      setIsChangePasswordOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message ||
          "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!data && !form.getFieldValue("FullName")) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <User className="text-blue-600" /> Hồ sơ cá nhân
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="h-full"
      >
        <Row gutter={24}>
          {/* CỘT TRÁI */}
          <Col xs={24} md={8}>
            <Card className="rounded-xl shadow-sm border-slate-200 text-center mb-6">
              <div className="relative inline-block group">
                <Avatar
                  size={120}
                  src={avatarUrl}
                  icon={<User />}
                  className="mb-4 border-4 border-blue-50 cursor-pointer"
                />
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handlePreviewAvatar}
                  accept="image/*"
                >
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <UploadCloud size={24} />
                  </div>
                </Upload>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mt-2">
                {data?.FullName || "Học viên"}
              </h3>
              <p className="text-slate-500 text-sm">{data?.Email}</p>

              {/* ĐÃ SỬA: Thay Tag bằng div */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="w-full text-center py-1.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-lg text-sm">
                  @{data?.UserName || "..."}
                </div>
                <div className="w-full text-center py-1.5 bg-purple-50 text-purple-700 border border-purple-200 font-semibold rounded-lg text-sm">
                  {data?.StudentCode || "..."}
                </div>
              </div>
            </Card>

            <Card
              className="rounded-xl shadow-sm border-slate-200"
              title={<span className="font-bold text-slate-700">Bảo mật</span>}
            >
              <Button
                block
                icon={<Lock size={16} />}
                className="text-left mb-2 h-10 rounded-lg hover:text-blue-600 hover:border-blue-600"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                Đổi mật khẩu
              </Button>
              <div className="text-xs text-gray-400 mt-2 text-center">
                Cập nhật lần cuối: {dayjs().format("DD/MM/YYYY")}
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: FORM PROFILE */}
          <Col xs={24} md={16}>
            <Card
              className="rounded-xl shadow-sm border-slate-200"
              title={
                <span className="font-bold text-lg text-blue-800">
                  Thông tin chi tiết
                </span>
              }
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Họ và tên"
                    name="FullName"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<User size={16} className="text-gray-400" />}
                      placeholder="Nhập họ và tên..."
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Email liên hệ (Đăng nhập)"
                    name="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                    help="Thay đổi email sẽ thay đổi thông tin đăng nhập."
                  >
                    <Input
                      prefix={<Mail size={16} className="text-gray-400" />}
                    />
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
                  <Form.Item label="Số điện thoại cá nhân" name="PhoneNo">
                    <Input
                      prefix={<Phone size={16} className="text-gray-400" />}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="SĐT Phụ huynh" name="ParentPhoneNo">
                    <Input
                      prefix={<Phone size={16} className="text-gray-400" />}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Trường đang học" name="SchoolName">
                    <Input
                      prefix={<School size={16} className="text-gray-400" />}
                      placeholder="VD: THPT Chu Văn An"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<Save size={18} />}
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-8 h-10 rounded-lg shadow-md shadow-blue-200"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* --- MODAL ĐỔI MẬT KHẨU --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-700">
            <KeyRound className="text-blue-600" size={20} /> Đổi mật khẩu
          </div>
        }
        open={isChangePasswordOpen}
        onCancel={() => {
          setIsChangePasswordOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        centered
      >
        <div className="pt-4">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={onChangePasswordFinish}
          >
            <Form.Item
              name="oldPassword"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu cũ..." />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới..." />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng nhập lại mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu nhập lại không khớp!"),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Xác nhận mật khẩu mới..." />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  passwordForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                className="bg-blue-600"
              >
                Xác nhận đổi
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProfile;
