import React, { useState } from "react";
import { Modal, Table, Button, Input, Tag, Empty } from "antd";
import { Search, Download, BookOpen, FileText } from "lucide-react";

const ImportChapterModal = ({
  open,
  onClose,
  onFinish,
  masterChapters = [], // Dữ liệu nguồn từ kho
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchTerm] = useState("");

  // --- CONFIG TABLE ---

  // 1. Cấu hình cột
  const columns = [
    {
      title: "Tên Chương",
      dataIndex: "Title",
      key: "Title",
      render: (text, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{text}</span>
          {record.Description && (
            <span className="text-xs text-slate-500 truncate max-w-xs">
              {record.Description}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Số bài học",
      dataIndex: "LessonCount",
      key: "LessonCount",
      width: 120,
      align: "center",
      render: (count) => (
        <Tag color="blue" className="mx-0">
          {count} bài
        </Tag>
      ),
    },
    {
      title: "Chủ đề",
      dataIndex: "Subject", // Giả sử có trường Subject
      key: "Subject",
      width: 150,
      render: (text) => (
        <span className="text-slate-600">{text || "Chung"}</span>
      ),
    },
  ];

  // 2. Cấu hình chọn dòng (Checkbox)
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // 3. Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredData = masterChapters.filter((item) =>
    item.Title.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- HANDLERS ---

  const handleSubmit = () => {
    // Trả về danh sách ID các chương đã chọn
    onFinish(selectedRowKeys);
    // Reset selection sau khi submit
    setSelectedRowKeys([]);
  };

  // Hiển thị nội dung chi tiết (Expandable Row) - Optional: Để xem bài học bên trong
  const expandedRowRender = (record) => {
    if (!record.Lessons || record.Lessons.length === 0) {
      return (
        <Empty
          description="Chương này chưa có bài học mẫu"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    return (
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
          Danh sách bài học mẫu:
        </h4>
        <ul className="space-y-1">
          {record.Lessons.map((lesson, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <FileText size={14} className="text-slate-400" />
              {lesson.Title}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen size={20} />
          </div>
          <span className="text-lg font-bold">Nhập chương từ Kho học liệu</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      centered
      footer={[
        <Button key="cancel" onClick={onClose} size="large">
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<Download size={18} />}
          onClick={handleSubmit}
          disabled={selectedRowKeys.length === 0}
          size="large"
          className="bg-blue-600 hover:!bg-blue-500 font-medium"
        >
          Nhập{" "}
          {selectedRowKeys.length > 0 ? `${selectedRowKeys.length} chương` : ""}
        </Button>,
      ]}
    >
      <div className="pt-4 flex flex-col gap-4">
        {/* Search Bar */}
        <Input
          prefix={<Search size={18} className="text-slate-400" />}
          placeholder="Tìm kiếm chương mẫu..."
          size="large"
          className="rounded-xl"
          value={searchText}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />

        {/* Data Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <Table
            rowKey="ChapterId" // Quan trọng: Phải trùng với key ID trong data của bạn
            columns={columns}
            dataSource={filteredData}
            rowSelection={rowSelection}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => true,
            }}
            pagination={{ pageSize: 5 }}
            scroll={{ y: 350 }} // Scroll dọc nếu danh sách dài
            locale={{
              emptyText: <Empty description="Không tìm thấy chương nào" />,
            }}
          />
        </div>

        <p className="text-xs text-slate-500 italic text-right">
          * Các chương được chọn sẽ được sao chép vào lớp học hiện tại cùng với
          các bài học bên trong.
        </p>
      </div>
    </Modal>
  );
};

export default ImportChapterModal;
