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
} from "antd";
import {
  User,
  Mail,
  Phone,
  UploadCloud,
  Save,
  School,
  Calendar,
  Hash,
  Lock,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";
import { AuthContext } from "@/context/authContext"; // Để update Avatar trên Header ngay lập tức

const StudentProfile = () => {
  const { updateUser } = useContext(AuthContext); // Hàm update context (nếu có)
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form] = Form.useForm();

  // State xử lý ảnh preview
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fileList, setFileList] = useState([]);

  // 1. Fetch Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/student/profile");
        const student = res.data;
        setData(student);
        setAvatarUrl(student.Avatar);

        // Fill data vào Form
        form.setFieldsValue({
          ...student,
          BirthDate: student.BirthDate ? dayjs(student.BirthDate) : null,
        });
      } catch (error) {
        message.error("Lỗi tải thông tin cá nhân");
      }
    };
    fetchProfile();
  }, [form]);

  // 2. Xử lý Upload ảnh (Preview Local)
  const handlePreviewAvatar = ({ file }) => {
    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target.result);
    reader.readAsDataURL(file.originFileObj);
    setFileList([file.originFileObj]); // Lưu file gốc để gửi lên server
  };

  // 3. Submit Form
  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    // Append các field text
    Object.keys(values).forEach((key) => {
      if (key === "BirthDate" && values[key]) {
        formData.append(key, values[key].format("YYYY-MM-DD"));
      } else if (key !== "avatarFile" && values[key] !== null) {
        formData.append(key, values[key]);
      }
    });

    // Append Avatar file (nếu có chọn ảnh mới)
    if (fileList.length > 0) {
      formData.append("avatarFile", fileList[0]);
    } else {
      formData.append("Avatar", avatarUrl); // Giữ link cũ
    }

    try {
      const res = await api.put("/student/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Cập nhật hồ sơ thành công!");

      // Update Context nếu cần (để Header đổi avatar ngay)
      // updateUser(res.data);

      setFileList([]); // Reset file list
    } catch (error) {
      console.error(error);
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
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
          {/* CỘT TRÁI: AVATAR & BẢO MẬT */}
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
                  beforeUpload={() => false} // Chặn auto upload
                  onChange={handlePreviewAvatar}
                  accept="image/*"
                >
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <UploadCloud size={24} />
                  </div>
                </Upload>
              </div>

              <h3 className="text-xl font-bold text-slate-800">
                {data?.FullName}
              </h3>
              <p className="text-slate-500">{data?.Email}</p>
              <p className="text-blue-600 font-semibold mt-1">
                @{data?.UserName}
              </p>
            </Card>

            <Card
              className="rounded-xl shadow-sm border-slate-200"
              title="Bảo mật"
            >
              <Button
                block
                icon={<Lock size={16} />}
                className="text-left mb-2"
              >
                Đổi mật khẩu
              </Button>
              <div className="text-xs text-gray-400 mt-2">
                Lần đăng nhập cuối: {dayjs().format("DD/MM/YYYY HH:mm")}
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: FORM THÔNG TIN */}
          <Col xs={24} md={16}>
            <Card
              className="rounded-xl shadow-sm border-slate-200"
              title="Thông tin chi tiết"
            >
              {/* 1. THÔNG TIN KHÔNG ĐƯỢC SỬA */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Mã sinh viên (Không thể sửa)"
                      name="StudentCode"
                    >
                      <Input
                        prefix={<Hash size={16} className="text-gray-400" />}
                        disabled
                        className="bg-white text-gray-500 font-bold"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Tên đăng nhập" name="UserName">
                      <Input
                        prefix={<User size={16} className="text-gray-400" />}
                        disabled
                        className="bg-white text-gray-500"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider
                orientation="left"
                className="text-blue-600 border-blue-600"
              >
                Thông tin cá nhân
              </Divider>

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
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Email liên hệ"
                    name="Email"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
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

              <div className="flex justify-end mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<Save size={18} />}
                  loading={loading}
                  className="bg-blue-600 px-8"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default StudentProfile;
