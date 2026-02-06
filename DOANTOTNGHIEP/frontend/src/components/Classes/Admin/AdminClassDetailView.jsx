import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  message,
  Popconfirm,
  Input,
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Empty,
  Progress,
  Tooltip,
  Divider,
  Upload,
  List,
  Typography,
  Alert,
} from "antd";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  CreditCard,
  Search,
  Phone,
  Mail,
  AlertCircle,
  GraduationCap,
  CalendarDays,
  Clock,
  FileSpreadsheet,
  UploadCloud,
  Download,
  RotateCcw,
} from "lucide-react";
import api from "@/utils/axiosInstance";
import getStatusColor from "@/js/getStatusInfo";
import { removeVietnameseTones } from "@/js/Helper";

const { Dragger } = Upload;
const { Text } = Typography;

const ClassDetailView = ({ classData, onBack }) => {
  // --- STATE ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho Modal thêm học viên lẻ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStudentCode, setAddStudentCode] = useState("");
  const [adding, setAdding] = useState(false);

  // State cho Modal Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // State kết quả Import (MỚI)
  const [importResult, setImportResult] = useState(null);
  // Structure: { successCount: 0, errorCount: 0, errors: [] }

  // State tìm kiếm local
  const [searchText, setSearchText] = useState("");

  const maxStudents = classData?.MaxStudents || 30;

  // --- EFFECT ---
  useEffect(() => {
    if (classData?.ClassId) {
      fetchStudents();
    }
  }, [classData]);

  const statusInfo = getStatusColor(classData.Status);

  // --- API CALLS ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/classes/${classData.ClassId}/students/detail`
      );
      setStudents(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách học viên.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Thêm học viên lẻ
  const handleAddStudent = async () => {
    if (!addStudentCode.trim()) return;
    if (students.length >= maxStudents) {
      message.error(`Lớp đã đạt giới hạn tối đa (${maxStudents} học viên)!`);
      return;
    }

    setAdding(true);
    try {
      await api.post(`/classes/${classData.ClassId}/add-single-student`, {
        studentCode: addStudentCode.trim(),
      });
      message.success(`Đã thêm học viên: ${addStudentCode}`);
      setIsAddModalOpen(false);
      setAddStudentCode("");
      fetchStudents();
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 409) message.error("Lớp đã đầy");
      if (status === 404) message.error("Không tìm thấy Mã sinh viên này.");
      else if (status === 400)
        message.warning(msg || "Học viên này đã có trong lớp.");
      else if (status === 409) message.error(msg || "Lớp đầy.");
      else message.error("Lỗi khi thêm học viên.");
    } finally {
      setAdding(false);
    }
  };

  // 2. Xử lý Import Excel
  const handleImportExcel = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn file Excel để tải lên.");
      return;
    }

    const formData = new FormData();
    // Lấy file object thực sự
    const file = fileList[0].originFileObj || fileList[0];
    formData.append("file", file);

    setUploading(true);
    setImportResult(null); // Reset kết quả cũ

    try {
      const res = await api.post(
        `/classes/${classData.ClassId}/importExcel`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const resultData = res.data;
      console.log(resultData);
      setImportResult({
        successCount: resultData.successCount || resultData.addedCount || 0,
        errorCount:
          resultData.errorCount ||
          (resultData.errors ? resultData.errors.length : 0),
        errors: resultData.errors || [],
      });

      message.success("Xử lý file hoàn tất!");
      setFileList([]);
      fetchStudents(); // Reload lại bảng danh sách chính
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Lỗi khi nhập file Excel."
      );
    } finally {
      setUploading(false);
    }
  };

  // Reset modal import khi đóng hoặc muốn import tiếp
  const resetImportModal = () => {
    setFileList([]);
    setImportResult(null);
  };

  // Cấu hình cho component Upload
  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isExcel =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";

      if (!isExcel) {
        message.error("Chỉ chấp nhận file Excel (.xlsx, .xls)!");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Prevent auto upload
    },
    fileList,
  };

  // 3. Xóa học viên
  const handleRemoveStudent = async (studentId) => {
    try {
      await api.delete(`/classes/${classData.ClassId}/students/${studentId}`);
      message.success("Đã xóa học viên khỏi lớp.");
      setStudents((prev) => prev.filter((s) => s.StudentId !== studentId));
    } catch (error) {
      message.error("Lỗi khi xóa học viên.");
    }
  };

  // --- DATA PROCESSING ---
  const filteredStudents = students.filter(
    (s) =>
      removeVietnameseTones(s.FullName).includes(
        removeVietnameseTones(searchText)
      ) ||
      removeVietnameseTones(s.StudentCode).includes(
        removeVietnameseTones(searchText)
      )
  );

  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.IsPaid).length;
  const percentFull = Math.round((totalStudents / maxStudents) * 100);
  const isFull = totalStudents >= maxStudents;

  // --- RENDER ---
  return (
    <div className="animate-in fade-in zoom-in-95 duration-200 min-h-screen bg-gray-50/50">
      {/* HEADER STICKY (Giữ nguyên) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            type="text"
            icon={<ArrowLeft size={22} />}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
              {classData.ClassName}
              <Tag
                color={statusInfo.color}
                className="font-semibold border-0 px-3 py-0.5 text-sm"
              >
                {statusInfo.label}
              </Tag>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <GraduationCap size={14} />{" "}
                {classData.RoomName || "Chưa xếp phòng"}
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <CalendarDays size={14} /> {classData.Days}
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {classData.StartTime?.slice(0, 5)} -{" "}
                {classData.EndTime?.slice(0, 5)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<FileSpreadsheet size={18} />}
            onClick={() => setIsImportModalOpen(true)}
            disabled={isFull}
            className="hidden sm:flex items-center"
          >
            Nhập Excel
          </Button>

          <Button
            type="primary"
            icon={<UserPlus size={18} />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={isFull}
            className={`${
              isFull ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } shadow-sm transition-all`}
          >
            {isFull ? "Lớp Đã Đầy" : "Thêm Học Viên"}
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* STATS SECTION (Giữ nguyên) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="shadow-sm h-full rounded-lg">
              <div className="flex justify-between items-end mb-2">
                <div className="text-gray-500 font-medium flex items-center gap-2">
                  <Users size={18} className="text-blue-500" /> Sĩ số lớp
                </div>
                <div className="text-right">
                  <span
                    className={`text-2xl font-bold ${
                      isFull ? "text-red-500" : "text-gray-800"
                    }`}
                  >
                    {totalStudents}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">
                    / {maxStudents}
                  </span>
                </div>
              </div>
              <Progress
                percent={percentFull}
                status={isFull ? "exception" : "active"}
                strokeColor={isFull ? "#ef4444" : "#3b82f6"}
                showInfo={false}
                size="small"
                className="mb-1"
              />
              <p className="text-xs text-gray-400 text-right">
                {isFull
                  ? "Đã hết chỗ trống"
                  : `Còn trống ${maxStudents - totalStudents} chỗ`}
              </p>
            </Card>
          </Col>
          <Col xs={24} md={16}>
            {/* ... Card thống kê học phí (Giữ nguyên code cũ) ... */}
            <Card
              bordered={false}
              className="shadow-sm h-full rounded-lg flex flex-col justify-center"
            >
              <Row gutter={24} align="middle" className="h-full">
                <Col
                  span={12}
                  className="border-r border-gray-100 h-full flex items-center"
                >
                  <Statistic
                    title={
                      <span className="flex items-center gap-2 text-green-600 font-medium text-sm">
                        <CheckCircle size={16} /> Đã đóng học phí
                      </span>
                    }
                    value={paidCount}
                    suffix={`/ ${totalStudents}`}
                    valueStyle={{ fontWeight: "bold", color: "#16a34a" }}
                  />
                </Col>
                <Col span={12} className="h-full flex items-center">
                  <Statistic
                    title={
                      <span className="flex items-center gap-2 text-red-500 font-medium text-sm">
                        <AlertCircle size={16} /> Chưa hoàn thành
                      </span>
                    }
                    value={totalStudents - paidCount}
                    valueStyle={{ fontWeight: "bold", color: "#ef4444" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* MAIN TABLE */}
        <Card
          bordered={false}
          className="shadow-md rounded-lg overflow-hidden"
          title={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <span className="text-lg font-bold text-gray-800">
                Danh sách học viên
              </span>
              <Input
                placeholder="Tìm tên hoặc mã SV..."
                prefix={<Search size={16} className="text-gray-400" />}
                className="w-full sm:w-72"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          }
        >
          <Table
            dataSource={filteredStudents}
            rowKey="StudentId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} học viên`,
              showSizeChanger: true,
            }}
            scroll={{ x: 800, y: 350 }}
            locale={{
              emptyText: (
                <Empty
                  description="Lớp chưa có học viên nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          >
            <Table.Column
              title="Mã SV"
              dataIndex="StudentCode"
              width={120}
              render={(text) => (
                <Tag className="font-mono bg-gray-100 border-gray-200 text-gray-700 m-0 text-sm py-0.5">
                  {text}
                </Tag>
              )}
              sorter={(a, b) => a.StudentCode.localeCompare(b.StudentCode)}
            />
            <Table.Column
              title="Họ và Tên"
              dataIndex="FullName"
              render={(text) => (
                <span className="font-semibold text-gray-700">{text}</span>
              )}
              sorter={(a, b) => a.FullName.localeCompare(b.FullName)}
            />

            <Table.Column
              title="Số điện thoại"
              dataIndex="PhoneNo"
              width={150}
              render={(phoneNo) =>
                phoneNo ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} className="text-blue-500" /> {phoneNo}
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">--</span>
                )
              }
            />

            {/* Cột Email */}
            <Table.Column
              title="Email"
              dataIndex="Email"
              width={200}
              render={(email) =>
                email ? (
                  <div
                    className="flex items-center gap-2 text-gray-600 truncate"
                    title={email}
                  >
                    <Mail size={14} className="text-orange-500" /> {email}
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">--</span>
                )
              }
            />

            <Table.Column
              title="Trạng thái HP"
              align="center"
              width={160}
              render={(_, r) => (
                <div className="cursor-pointer group inline-block">
                  {r.IsPaid ? (
                    <Tag className="m-0 px-3 py-1 rounded-full bg-green-50 text-green-700 border-green-200 flex items-center gap-1 group-hover:bg-green-100 transition-colors">
                      <CheckCircle size={14} className="mb-[1px]" /> Đã đóng
                    </Tag>
                  ) : (
                    <Tag className="m-0 px-3 py-1 rounded-full bg-red-50 text-red-600 border-red-200 flex items-center gap-1 group-hover:bg-red-100 transition-colors">
                      <CreditCard size={14} className="mb-[1px]" /> Chưa đóng
                    </Tag>
                  )}
                </div>
              )}
              filters={[
                { text: "Đã đóng", value: true },
                { text: "Chưa đóng", value: false },
              ]}
              onFilter={(value, record) => record.IsPaid === value}
            />
            <Table.Column
              width={80}
              align="center"
              render={(_, r) => (
                <Popconfirm
                  title="Xóa học viên?"
                  description={`Xóa ${r.FullName} khỏi lớp này?`}
                  onConfirm={() => handleRemoveStudent(r.StudentId)}
                  okButtonProps={{ danger: true }}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    className="opacity-60 hover:opacity-100 hover:bg-red-50 rounded-full transition-all"
                  />
                </Popconfirm>
              )}
            />
          </Table>
        </Card>
      </div>

      {/* --- MODAL ADD SINGLE STUDENT --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
            <UserPlus size={22} /> Thêm Học Viên Vào Lớp
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          setAddStudentCode("");
        }}
        onOk={handleAddStudent}
        confirmLoading={adding}
        okText="Xác nhận thêm"
        cancelText="Hủy bỏ"
        okButtonProps={{ className: "bg-blue-600" }}
        centered
      >
        {/* ... (Nội dung modal thêm lẻ giữ nguyên) ... */}
        <div className="pt-4 pb-2">
          <Input
            size="large"
            placeholder="Nhập Mã Sinh Viên (VD: SV2024...)"
            value={addStudentCode}
            onChange={(e) => setAddStudentCode(e.target.value)}
            prefix={<Search size={18} className="text-gray-400" />}
            autoFocus
          />
          {/* ... Thống kê sĩ số ... */}
        </div>
      </Modal>

      {/* --- MODAL IMPORT EXCEL --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-green-700 font-semibold text-lg">
            <FileSpreadsheet size={22} /> Nhập Danh Sách Từ Excel
          </div>
        }
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false);
          resetImportModal(); // Reset khi đóng
        }}
        // Nếu đã có kết quả -> Nút OK sẽ là "Đóng" hoặc "Import tiếp"
        // Nếu chưa -> Nút OK là "Tiến hành nhập"
        footer={
          importResult
            ? [
                <Button
                  key="reset"
                  icon={<RotateCcw size={16} />}
                  onClick={resetImportModal}
                >
                  Import file khác
                </Button>,
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Đóng
                </Button>,
              ]
            : undefined
        }
        onOk={!importResult ? handleImportExcel : undefined}
        confirmLoading={uploading}
        okText="Tiến hành nhập"
        cancelText="Hủy bỏ"
        okButtonProps={{ className: "bg-green-600" }}
        centered
        width={600}
      >
        <div className="py-4">
          {/* TRƯỜNG HỢP 1: CHƯA IMPORT HOẶC ĐANG IMPORT -> HIỆN UPLOAD */}
          {!importResult && (
            <>
              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Download size={14} /> Hướng dẫn file mẫu:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    File định dạng <b>.xlsx</b> hoặc <b>.xls</b>.
                  </li>
                  <li>
                    Cột đầu tiên chứa <b>Mã Sinh Viên</b>.
                  </li>
                </ul>
              </div>

              <Dragger {...uploadProps} className="w-full">
                <p className="ant-upload-drag-icon flex justify-center text-green-500">
                  <UploadCloud size={48} />
                </p>
                <p className="ant-upload-text text-gray-700 font-medium">
                  Kéo thả file Excel hoặc click để chọn
                </p>
                <p className="ant-upload-hint text-gray-400 text-xs">
                  Chỉ hỗ trợ file .xlsx, .xls (Tối đa 1 file)
                </p>
              </Dragger>
            </>
          )}

          {/* TRƯỜNG HỢP 2: ĐÃ IMPORT XONG -> HIỆN KẾT QUẢ */}
          {importResult && (
            <div className="space-y-4">
              {/* Tổng quan kết quả */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-gray-500 text-xs uppercase font-semibold">
                    Thành công
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {importResult.successCount}
                  </p>
                  <p className="text-green-600 text-xs">sinh viên đã thêm</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-gray-500 text-xs uppercase font-semibold">
                    Thất bại / Bỏ qua
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {importResult.errorCount}
                  </p>
                  <p className="text-red-600 text-xs">sinh viên</p>
                </div>
              </div>

              {/* Danh sách lỗi (Nếu có) */}
              {importResult.errorCount > 0 && (
                <div className="border rounded-lg overflow-hidden mt-2">
                  <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 text-sm border-b">
                    Chi tiết lỗi ({importResult.errors.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto bg-white">
                    <List
                      size="small"
                      dataSource={importResult.errors}
                      renderItem={(item) => (
                        <List.Item>
                          <div className="flex w-full justify-between items-start gap-2">
                            <span className="font-mono bg-gray-200 px-2 rounded text-xs text-gray-800 shrink-0">
                              {item.studentCode || item.StudentCode || "N/A"}
                            </span>
                            <span className="text-red-500 text-xs text-right flex-1">
                              {item.message ||
                                item.reason ||
                                "Lỗi không xác định"}
                            </span>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </div>
              )}

              {importResult.errorCount === 0 && (
                <Alert
                  message="Tuyệt vời!"
                  description="Tất cả sinh viên trong file đều được thêm thành công."
                  type="success"
                  showIcon
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ClassDetailView;
