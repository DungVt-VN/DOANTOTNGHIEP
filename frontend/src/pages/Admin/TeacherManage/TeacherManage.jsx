import React, { useEffect, useState, useMemo } from "react";
import {
  message,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Table,
  Tag,
  InputNumber,
} from "antd";
import api from "@/utils/axiosInstance";
import { Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Import,
  Search,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Plus,
} from "lucide-react";

import AdminTeacherManageTable from "@/components/UserManagement/Admin/AdminTeacherManageTable";
import ImportData from "@/js/ImportData";
import AdminTeacherRegisterModal from "@/components/UserManagement/Admin/AdminTeacherRegisterModal";
import { removeVietnameseTones } from "@/js/Helper";

function TeacherManage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // State Import
  const [importResult, setImportResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [searchText, setSearchText] = useState("");

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [form] = Form.useForm();

  // State update single field (Account/Email)
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  // --- API CALLS ---
  const fetchTeachers = async () => {
    try {
      const response = await api.get("/accounts/manage-accounts/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("Không thể tải danh sách giáo viên.");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    if (!searchText) return teachers;

    const normalizedSearchText = removeVietnameseTones(searchText);

    return teachers.filter((teacher) => {
      return (
        removeVietnameseTones(teacher.FullName).includes(
          normalizedSearchText
        ) ||
        removeVietnameseTones(teacher.Email).includes(normalizedSearchText) ||
        removeVietnameseTones(teacher.TeacherCode).includes(
          normalizedSearchText
        ) ||
        removeVietnameseTones(teacher.PhoneNo).includes(normalizedSearchText) ||
        removeVietnameseTones(teacher.UserName).includes(
          normalizedSearchText
        ) ||
        removeVietnameseTones(teacher.Account).includes(normalizedSearchText)
      );
    });
  }, [teachers, searchText]);

  const executeDelete = async (ids) => {
    try {
      await api.delete("/accounts/delete/", {
        data: { ids: ids },
      });
      message.success("Xóa tài khoản giáo viên thành công!");
      setSelectedIds([]);
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teachers:", error);
      message.error("Lỗi khi xóa tài khoản.");
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedIds.length} giáo viên đã chọn?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => executeDelete(selectedIds),
    });
  };

  const handleSingleDelete = (teacher) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: (
        <div>
          Bạn có chắc chắn muốn xóa giáo viên: <b>{teacher.FullName}</b>?
          <br />
          <span className="text-red-500 text-xs">
            Hành động này sẽ xóa cả tài khoản đăng nhập.
          </span>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => executeDelete([teacher.UserId]),
    });
  };

  const handleUpdateSingleField = async (
    field,
    value,
    setLoading,
    setError
  ) => {
    if (!currentTeacher) return;

    const trimmedValue = value ? value.toString().trim() : "";
    if (!trimmedValue) {
      setError("Không được để trống thông tin này");
      return;
    }

    if (field === "Email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        setError("Email không đúng định dạng (ví dụ: abc@gmail.com)");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const updateData = {
        [field]: trimmedValue,
        UserId: currentTeacher.UserId,
      };

      await api.put(`/accounts/update-${field}/`, updateData);

      const fieldNameVN = field === "UserName" ? "tài khoản" : "email";
      message.success(`Cập nhật ${fieldNameVN} thành công!`);

      setCurrentTeacher((prev) => ({ ...prev, [field]: trimmedValue }));

      fetchTeachers();
    } catch (err) {
      console.error("Single update error:", err);

      const errorMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response?.data
          : "Lỗi cập nhật không xác định");

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (teacher, mode) => {
    setModalMode(mode);
    setCurrentTeacher(teacher);

    form.setFieldsValue({
      ...teacher,
    });

    setAccountError("");
    setEmailError("");
    setIsModalOpen(true);
  };

  const handleUpdateTeacher = async (values) => {
    try {
      const { UserName, Email, ...rest } = values;

      const updateData = {
        ...rest,
        UserId: currentTeacher.UserId,
      };
      // Backend route: PUT /api/accounts/update-info/teacher/:id
      await api.put(
        `/accounts/update-info/teacher/${currentTeacher.UserId}`,
        updateData
      );

      message.success("Cập nhật thông tin giáo viên thành công!");
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error("Update error", error);
      message.error(error.response?.data || "Lỗi khi cập nhật.");
    }
  };

  const handleReload = () => {
    fetchTeachers();
    setSelectedIds([]);
    setSearchText("");
  };

  const handleCheckboxChange = (event) => {
    const id = event.target.value;
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) =>
        prev.filter((item) => item.toString() !== id.toString())
      );
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      message.warning("Vui lòng chọn file trước!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      // Backend route: POST /api/accounts/import-excel-teachers
      const res = await api.post("/accounts/import-excel-teachers", formData);

      const { successCount, errorCount, errors } = res.data;
      setSelectedFile(null);
      fetchTeachers();

      if (errorCount > 0) {
        setImportResult({ successCount, errorCount, errors });
        setShowResultModal(true);
      } else {
        message.success(`Thành công! Đã thêm ${successCount} giáo viên.`);
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTeacher = async (values) => {
    try {
      // Gọi API tạo giáo viên
      await api.post("/accounts/create/teacher", values);

      message.success("Tạo giáo viên mới thành công!");
      setIsCreateModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Lỗi khi tạo mới.";
      message.error(
        typeof errorMessage === "string" ? errorMessage : "Có lỗi xảy ra"
      );
    }
  };

  return (
    <div className="rounded-b-lg min-h-[620px] -mx-6 -my-6 bg-[#F5F5F5]">
      <div className="p-4 flex flex-col gap-4">
        {/* Header & Search */}
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-700 text-lg">Quản lý Giáo viên</h3>
          <Input
            placeholder="Tìm tên, email, Mã GV..."
            prefix={<Search size={18} className="text-gray-400 mr-1" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-80"
            size="middle"
          />
        </div>

        <div className="flex justify-between items-center px-2">
          <div className="flex justify-center items-center">
            <div
              onClick={handleReload}
              className="hover:bg-slate-200 hover:rounded-md p-1 cursor-pointer transition-colors text-slate-600"
              title="Tải lại"
            >
              <RefreshIcon />
            </div>
            <span className="mx-2 text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">
              Hiển thị {filteredTeachers.length} kết quả
            </span>
            {selectedIds.length > 0 && (
              <>
                <span className="mx-2 text-slate-400">|</span>
                <span
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 hover:bg-slate-200 hover:rounded-md text-blue-700 text-sm font-medium cursor-pointer transition-colors"
                >
                  Bỏ chọn ({selectedIds.length})
                </span>
              </>
            )}
          </div>

          <div className="flex justify-between items-center gap-3">
            {selectedIds.length === 0 ? (
              <div className="flex gap-2 items-center">
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={<Import size={16} />}
                  sx={{
                    textTransform: "none",

                    width: selectedFile ? 240 : "auto",
                    justifyContent: "flex-start",

                    whiteSpace: selectedFile ? "nowrap" : "normal",
                    overflow: selectedFile ? "hidden" : "visible",
                    textOverflow: selectedFile ? "ellipsis" : "unset",

                    bgcolor: selectedFile ? "#16a34a" : "#2563eb",
                    "&:hover": {
                      bgcolor: selectedFile ? "#15803d" : "#1d4ed8",
                    },
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      flex: selectedFile ? 1 : "unset",
                      overflow: selectedFile ? "hidden" : "visible",
                      textOverflow: selectedFile ? "ellipsis" : "unset",
                      whiteSpace: selectedFile ? "nowrap" : "normal",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "Chọn File Excel"}
                  </span>

                  <ImportData setFile={setSelectedFile} />
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => {
                    form.resetFields();
                    setIsCreateModalOpen(true);
                  }}
                  sx={{
                    textTransform: "none",
                    bgcolor: "#16a34a",
                    "&:hover": {
                      bgcolor: "#15803d",
                    },
                  }}
                >
                  Thêm mới
                </Button>

                {selectedFile && (
                  <>
                    <Button
                      onClick={handleUploadFile}
                      variant="contained"
                      size="small"
                      startIcon={<Upload size={16} />}
                      sx={{ textTransform: "none", bgcolor: "#ea580c" }}
                    >
                      Lưu (Upload)
                    </Button>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      variant="text"
                      size="small"
                      color="error"
                      startIcon={<X size={16} />}
                      sx={{ textTransform: "none" }}
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div
                onClick={handleBatchDelete}
                className="flex justify-center items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md cursor-pointer transition-colors"
              >
                <DeleteIcon
                  style={{ color: "rgb(220 38 38)", fontSize: "20px" }}
                />
                <span className="text-red-600 text-sm font-semibold">
                  Xóa {selectedIds.length} tài khoản
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="mx-3">
        <AdminTeacherManageTable
          teachers={filteredTeachers}
          handleCheckboxChange={handleCheckboxChange}
          selectedIds={selectedIds}
          onView={(t) => handleOpenModal(t, "view")}
          onEdit={(t) => handleOpenModal(t, "edit")}
          onDelete={(t) => handleSingleDelete(t)}
        />
      </div>

      {/* Modal Import Error Result */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle /> Kết quả Import có lỗi
          </div>
        }
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowResultModal(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {importResult && (
          <div>
            <div className="flex gap-4 mb-4">
              <Tag color="success" className="text-base py-1 px-3">
                <CheckCircle size={14} className="inline mr-1" />
                Thành công: <b>{importResult.successCount}</b>
              </Tag>
              <Tag color="error" className="text-base py-1 px-3">
                <AlertTriangle size={14} className="inline mr-1" />
                Thất bại: <b>{importResult.errorCount}</b>
              </Tag>
            </div>

            <h4 className="font-bold mb-2 text-gray-700">Chi tiết lỗi:</h4>
            <Table
              dataSource={importResult.errors}
              rowKey={(record, index) => index}
              pagination={{ pageSize: 5 }}
              size="small"
              bordered
              columns={[
                {
                  title: "Tài khoản (UserName)",
                  dataIndex: "UserName",
                  key: "UserName",
                  width: 180,
                  render: (text) => <b className="text-blue-700">{text}</b>,
                },
                {
                  title: "Nguyên nhân lỗi",
                  dataIndex: "error",
                  key: "error",
                  render: (text) => (
                    <span className="text-red-500">{text}</span>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Modal Edit/View Teacher */}
      <Modal
        title={
          <h2
            className={`text-xl font-semibold ${
              modalMode === "view" ? "text-blue-800" : "text-amber-700"
            }`}
          >
            {modalMode === "view"
              ? "Chi tiết giáo viên"
              : "Cập nhật thông tin giáo viên"}
          </h2>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setAccountError("");
          setEmailError("");
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateTeacher}>
          <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
            <h4 className="text-sm font-bold text-gray-600 mb-2 uppercase">
              Thông tin tài khoản
            </h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên tài khoản"
                  help={accountError}
                  validateStatus={accountError ? "error" : ""}
                >
                  <div className="flex gap-2">
                    <Form.Item name="UserName" noStyle>
                      <Input
                        readOnly={modalMode === "view"}
                        className={
                          modalMode === "view"
                            ? "!bg-white !text-black !cursor-default"
                            : ""
                        }
                        onChange={() => setAccountError("")}
                      />
                    </Form.Item>

                    {modalMode === "edit" && (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={loadingAccount}
                        onClick={(e) => {
                          e.preventDefault();
                          const val = form.getFieldValue("UserName");
                          handleUpdateSingleField(
                            "UserName",
                            val,
                            setLoadingAccount,
                            setAccountError
                          );
                        }}
                        sx={{
                          minWidth: "80px",
                          fontSize: "0.7rem",
                          bgcolor: "#2563eb",
                        }}
                      >
                        {loadingAccount ? "..." : "Cập nhật"}
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Email"
                  help={emailError}
                  validateStatus={emailError ? "error" : ""}
                >
                  <div className="flex gap-2">
                    <Form.Item
                      name="Email"
                      noStyle
                      rules={[{ type: "email", message: "Email không hợp lệ" }]}
                    >
                      <Input
                        readOnly={modalMode === "view"}
                        className={
                          modalMode === "view"
                            ? "!bg-white !text-black !cursor-default"
                            : ""
                        }
                        onChange={() => setEmailError("")}
                      />
                    </Form.Item>

                    {modalMode === "edit" && (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={loadingEmail}
                        onClick={(e) => {
                          e.preventDefault();
                          form
                            .validateFields(["Email"])
                            .then((values) => {
                              handleUpdateSingleField(
                                "Email",
                                values.Email,
                                setLoadingEmail,
                                setEmailError
                              );
                            })
                            .catch((errorInfo) => {
                              setEmailError("Email không đúng định dạng");
                            });
                        }}
                        sx={{ minWidth: "80px", fontSize: "0.7rem" }}
                      >
                        {loadingEmail ? "..." : "Cập nhật"}
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <h4 className="text-sm font-bold text-gray-600 mb-2 uppercase">
            Thông tin cá nhân
          </h4>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="FullName"
                rules={[{ required: true, message: "Nhập họ tên" }]}
              >
                <Input
                  readOnly={modalMode === "view"}
                  className={
                    modalMode === "view"
                      ? "!bg-white !text-black !cursor-default"
                      : ""
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Mã giáo viên"
                name="TeacherCode"
                rules={[{ required: true, message: "Nhập mã GV" }]}
              >
                <Input
                  readOnly={modalMode === "view"}
                  className={
                    modalMode === "view"
                      ? "!bg-white !text-black !cursor-default"
                      : ""
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="PhoneNo">
                <Input
                  readOnly={modalMode === "view"}
                  className={
                    modalMode === "view"
                      ? "!bg-white !text-black !cursor-default"
                      : ""
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Mức lương (Salary Rate)" name="SalaryRate">
                {modalMode === "view" ? (
                  <Input
                    readOnly
                    className="!bg-white !text-black !cursor-default"
                  />
                ) : (
                  <InputNumber
                    className="w-full"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "")}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          {/* Địa chỉ */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Địa chỉ" name="Address">
                <Input
                  readOnly={modalMode === "view"}
                  className={
                    modalMode === "view"
                      ? "!bg-white !text-black !cursor-default"
                      : ""
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Bio - Giới thiệu */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Giới thiệu (Bio)" name="Bio">
                <Input.TextArea
                  rows={3}
                  readOnly={modalMode === "view"}
                  className={
                    modalMode === "view"
                      ? "!bg-white !text-black !cursor-default"
                      : ""
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {modalMode === "edit" && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="outlined"
                color="error"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="contained"
                type="submit"
                sx={{ bgcolor: "#2563eb" }}
              >
                Lưu tất cả thay đổi
              </Button>
            </div>
          )}
        </Form>
      </Modal>
      {/* Tạo Teacher*/}
      <AdminTeacherRegisterModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onFinish={handleCreateTeacher}
      />
    </div>
  );
}

export default TeacherManage;
