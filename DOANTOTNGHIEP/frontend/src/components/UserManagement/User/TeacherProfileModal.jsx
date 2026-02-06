import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  InputNumber,
  Button,
  message,
  Spin,
  Divider,
} from "antd";
import { Edit, Save, X, User, Mail, KeyRound } from "lucide-react";
import api from "@/utils/axiosInstance";

const TeacherProfileModal = ({ open, teacherId, onClose, onUpdateSuccess }) => {
  const [form] = Form.useForm();

  // --- STATES ---
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const [mode, setMode] = useState("view");
  const [originalData, setOriginalData] = useState({});

  // State lỗi hiển thị thủ công (Đồng bộ cả lỗi Client & Server vào đây)
  const [errors, setErrors] = useState({
    UserName: "",
    email: "",
    password: "",
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (open) {
      setMode("view");
      setErrors({ UserName: "", email: "", password: "" });
      fetchTeacherData();
    }
  }, [open, teacherId]);

  // --- FETCH DATA ---
  const fetchTeacherData = async () => {
    if (!teacherId) return;
    setLoadingGeneral(true);
    try {
      const res = await api.get(`/accounts/teacher/${teacherId}`);
      const data = res.data;

      const { Password, ...rest } = data;
      const initialValues = {
        ...rest,
        UserName: rest.UserName || "",
        Email: rest.Email || "",
      };

      setOriginalData(initialValues);
      form.setFieldsValue(initialValues);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải thông tin hồ sơ.");
    } finally {
      setLoadingGeneral(false);
    }
  };

  // --- 1. HANDLE UPDATE UserName ---
  const handleUpdateUserName = async (e) => {
    e.preventDefault();
    const newUserName = form.getFieldValue("UserName");

    if (!newUserName)
      return setErrors((p) => ({
        ...p,
        UserName: "Vui lòng nhập Tên tài khoản",
      }));

    if (newUserName === originalData.UserName) {
      message.info("Thông tin chưa thay đổi.");
      return;
    }

    setLoadingUser(true);
    setErrors((p) => ({ ...p, UserName: "" }));

    try {
      await api.put("/accounts/update-username", {
        userId: teacherId,
        UserName: newUserName,
      });
      message.success("Cập nhật tên đăng nhập thành công!");
      setOriginalData((prev) => ({ ...prev, UserName: newUserName }));
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      const msg = error.response?.data || "Lỗi cập nhật";
      setErrors((p) => ({ ...p, UserName: msg }));
    } finally {
      setLoadingUser(false);
    }
  };

  // --- 2. HANDLE UPDATE EMAIL (ĐÃ ĐỒNG BỘ LỖI) ---
  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    // Bước 1: Validate Client (Định dạng Email)
    try {
      await form.validateFields(["Email"]);
    } catch (errorInfo) {
      // Lấy lỗi từ Antd và gán vào state errors để hiển thị đồng bộ
      const firstError = errorInfo.errorFields[0].errors[0];
      setErrors((p) => ({ ...p, email: firstError }));
      return;
    }

    const newEmail = form.getFieldValue("Email");

    if (newEmail === originalData.Email) {
      message.info("Thông tin chưa thay đổi.");
      return;
    }

    // Bước 2: Gọi API
    setLoadingEmail(true);
    setErrors((p) => ({ ...p, email: "" }));

    try {
      await api.put("/accounts/update-email", {
        userId: teacherId,
        email: newEmail,
      });
      message.success("Cập nhật Email thành công!");
      setOriginalData((prev) => ({ ...prev, Email: newEmail }));
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      const msg = error.response?.data || "Lỗi cập nhật";
      setErrors((p) => ({ ...p, email: msg }));
    } finally {
      setLoadingEmail(false);
    }
  };

  // --- 3. HANDLE CHANGE PASSWORD (ĐÃ ĐỒNG BỘ LỖI) ---
  const handleChangePassword = async () => {
    // Bước 1: Validate Client (Độ dài, khớp pass)
    try {
      await form.validateFields(["NewPassword", "ConfirmPassword"]);
    } catch (errorInfo) {
      // Lấy lỗi đầu tiên tìm thấy gán vào state password
      const firstError = errorInfo.errorFields[0].errors[0];
      setErrors((p) => ({ ...p, password: firstError }));
      return;
    }

    const newPass = form.getFieldValue("NewPassword");
    setLoadingPass(true);
    setErrors((p) => ({ ...p, password: "" }));

    try {
      await api.put("/accounts/change-password", {
        userId: teacherId,
        newPassword: newPass,
      });
      message.success("Đổi mật khẩu thành công!");
      form.setFieldsValue({ NewPassword: "", ConfirmPassword: "" });
    } catch (error) {
      const msg = error.response?.data || "Lỗi đổi mật khẩu";
      setErrors((p) => ({ ...p, password: msg }));
    } finally {
      setLoadingPass(false);
    }
  };

  // --- 4. UPDATE GENERAL PROFILE ---
  const handleUpdateProfile = async (values) => {
    setLoadingGeneral(true);
    try {
      // Loại bỏ các trường account ra khỏi form update info
      const {
        UserName,
        Email,
        NewPassword,
        ConfirmPassword,
        TeacherCode,
        SalaryRate,
        ...profileData
      } = values;
      await api.put(`/accounts/update-info/teacher/${teacherId}`, profileData);

      message.success("Cập nhật hồ sơ thành công!");
      setMode("view");
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      message.error("Lỗi cập nhật hồ sơ: " + (error.response?.data || ""));
    } finally {
      setLoadingGeneral(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex justify-between items-center pr-8">
          <h2
            className={`text-xl font-bold ${
              mode === "view" ? "text-blue-800" : "text-amber-700"
            }`}
          >
            {mode === "view" ? "Hồ sơ cá nhân" : "Cập nhật thông tin"}
          </h2>
          {mode === "view" && (
            <Button
              type="text"
              icon={<Edit size={18} />}
              className="text-blue-600 hover:bg-blue-50 font-medium"
              onClick={() => setMode("edit")}
            >
              Chỉnh sửa
            </Button>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      maskClosable={false}
    >
      <Spin spinning={loadingGeneral && mode === "view"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          disabled={mode === "view"}
          className="mt-4"
        >
          {/* ========================================================= */}
          {/* KHỐI 1: TÀI KHOẢN (ĐỒNG BỘ BÁO LỖI) */}
          {/* ========================================================= */}
          <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase flex items-center gap-2">
              <User size={16} /> Thông tin tài khoản
            </h4>

            <Row gutter={16}>
              {/* --- UserName --- */}
              <Col span={12}>
                <Form.Item
                  label="Tên tài khoản"
                  // Dùng help và validateStatus ở Outer Item để hiển thị mọi lỗi
                  help={errors.UserName}
                  validateStatus={errors.UserName ? "error" : ""}
                  className="mb-2"
                >
                  <div className="flex gap-2">
                    <Form.Item name="UserName" noStyle>
                      <Input
                        readOnly={mode === "view"}
                        className={
                          mode === "view"
                            ? "!bg-white !text-black !cursor-default"
                            : ""
                        }
                        // Khi gõ lại thì xóa lỗi đi
                        onChange={() =>
                          setErrors((p) => ({ ...p, UserName: "" }))
                        }
                        prefix={<User size={14} className="text-gray-400" />}
                      />
                    </Form.Item>

                    {mode === "edit" && (
                      <Button
                        type="primary"
                        loading={loadingUser}
                        onClick={handleUpdateUserName}
                        className="bg-blue-600 hover:!bg-blue-700 min-w-[80px]"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Cập nhật
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </Col>

              {/* --- EMAIL (ĐÃ SỬA) --- */}
              <Col span={12}>
                <Form.Item
                  label="Email"
                  // QUAN TRỌNG: Hiển thị lỗi từ state 'errors.email' (Client + Server đều vào đây)
                  help={errors.email}
                  validateStatus={errors.email ? "error" : ""}
                  className="mb-2"
                >
                  <div className="flex gap-2">
                    <Form.Item
                      name="Email"
                      noStyle
                      rules={[
                        { required: true, message: "Vui lòng nhập Email" },
                        {
                          type: "email",
                          message: "Email không đúng định dạng",
                        },
                      ]}
                    >
                      <Input
                        readOnly={mode === "view"}
                        className={
                          mode === "view"
                            ? "!bg-white !text-black !cursor-default"
                            : ""
                        }
                        // Khi gõ phím, xóa ngay lập tức lỗi hiển thị
                        onChange={() => setErrors((p) => ({ ...p, email: "" }))}
                        prefix={<Mail size={14} className="text-gray-400" />}
                      />
                    </Form.Item>

                    {mode === "edit" && (
                      <Button
                        type="primary"
                        loading={loadingEmail}
                        onClick={handleUpdateEmail}
                        className="bg-blue-600 hover:!bg-blue-700 min-w-[80px]"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Cập nhật
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </Col>
            </Row>

            {/* --- PASSWORD --- */}
            {mode === "edit" && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-gray-600 text-xs font-bold uppercase">
                  <KeyRound size={14} /> Thay đổi mật khẩu
                </div>

                <Row gutter={12} align="start">
                  <Col span={9}>
                    <Form.Item
                      name="NewPassword"
                      className="mb-0"
                      rules={[{ min: 6, message: "Tối thiểu 6 ký tự" }]}
                      validateStatus={errors.password ? "error" : ""}
                    >
                      <Input.Password
                        placeholder="Mật khẩu mới"
                        onChange={() =>
                          setErrors((p) => ({ ...p, password: "" }))
                        }
                      />
                    </Form.Item>
                    {errors.password && (
                      <div className="text-red-500 ">{errors.password}</div>
                    )}
                  </Col>

                  <Col span={9}>
                    <Form.Item
                      name="ConfirmPassword"
                      className="mb-0"
                      dependencies={["NewPassword"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (
                              !value ||
                              getFieldValue("NewPassword") === value
                            ) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Mật khẩu không khớp!")
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Xác nhận mật khẩu" />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Button
                      block
                      type="primary"
                      onClick={handleChangePassword}
                      loading={loadingPass}
                      className="bg-blue-600 hover:!bg-blue-700"
                    >
                      Cập nhật
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          <Divider
            orientation="left"
            className="!text-blue-600 !font-bold !text-sm uppercase !m-0 !mb-6"
          >
            Thông tin hồ sơ giáo viên
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="FullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã giáo viên" name="TeacherCode">
                <Input
                  disabled={true}
                  className="!bg-gray-100 !text-gray-500 cursor-not-allowed font-medium"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="PhoneNo"
                rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mức lương cơ bản" name="SalaryRate">
                <InputNumber
                  className="w-full !bg-gray-100 !text-gray-500 cursor-not-allowed font-medium"
                  disabled={true}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Địa chỉ liên hệ" name="Address">
                <Input placeholder="Chưa cập nhật địa chỉ" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Giới thiệu bản thân (Bio)" name="Bio">
                <Input.TextArea
                  rows={4}
                  placeholder="Kinh nghiệm, bằng cấp..."
                />
              </Form.Item>
            </Col>
          </Row>

          {/* FOOTER BUTTONS */}
          {mode === "edit" ? (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <Button
                onClick={() => {
                  setMode("view");
                  form.resetFields();
                  setErrors({ UserName: "", email: "", password: "" });
                  fetchTeacherData();
                }}
                icon={<X size={16} />}
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadingGeneral}
                className="bg-blue-600 hover:!bg-blue-700"
                icon={<Save size={16} />}
              >
                Lưu hồ sơ
              </Button>
            </div>
          ) : (
            <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
              <Button onClick={onClose}>Đóng</Button>
            </div>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default TeacherProfileModal;
