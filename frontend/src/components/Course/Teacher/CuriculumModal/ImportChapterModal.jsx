import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Input, Tag, Empty, Typography } from "antd";
import {
  Search,
  Download,
  BookOpen,
  FileText,
  CheckCircle,
  Video,
} from "lucide-react";

const { Text } = Typography;

const ImportChapterModal = ({
  open,
  onClose,
  onFinish,
  masterChapters = [], // Dữ liệu từ API /courses/course-chapter/:id
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchTerm] = useState("");

  // --- EFFECT: RESET STATE KHI MỞ MODAL ---
  // Giúp xóa lựa chọn cũ nếu người dùng đóng modal mà chưa import
  useEffect(() => {
    if (open) {
      setSelectedRowKeys([]);
      setSearchTerm("");
    }
  }, [open]);

  // --- CONFIG TABLE ---
  const columns = [
    {
      title: "Tên Chương",
      dataIndex: "Title",
      key: "Title",
      render: (text, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-base">{text}</span>
          {record.Description && (
            <span className="text-xs text-slate-500 truncate max-w-md mt-0.5">
              {record.Description}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Bài học",
      dataIndex: "Lessons",
      key: "LessonCount",
      width: 100,
      align: "center",
      render: (lessons) => {
        const count = Array.isArray(lessons) ? lessons.length : 0;
        return (
          <Tag
            color={count > 0 ? "blue" : "default"}
            className="mx-0 font-medium"
          >
            {count} bài
          </Tag>
        );
      },
    },
    {
      title: "Thứ tự gốc",
      dataIndex: "OrderIndex",
      key: "OrderIndex",
      width: 100,
      align: "center",
      render: (val) => <span className="text-slate-400 text-xs">#{val}</span>,
    },
  ];

  // --- FILTER DATA ---
  // Tìm kiếm trong cả Tiêu đề và Mô tả
  const filteredData = masterChapters.filter((item) => {
    const term = searchText.toLowerCase();
    const titleMatch = item.Title?.toLowerCase().includes(term);
    const descMatch = item.Description?.toLowerCase().includes(term);
    return titleMatch || descMatch;
  });

  // --- HANDLERS ---
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 48, // Độ rộng cột checkbox
  };

  const handleSubmit = () => {
    // Trả về danh sách CourseChapterId đã chọn
    onFinish(selectedRowKeys);
  };

  // --- RENDER EXPANDED ROW (CHI TIẾT BÀI HỌC) ---
  const expandedRowRender = (record) => {
    if (!record.Lessons || record.Lessons.length === 0) return null;

    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 ml-10 mr-4 shadow-inner">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <FileText size={14} /> Danh sách bài học đi kèm:
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {record.Lessons.map((lesson, idx) => (
            <div
              key={lesson.LessonId || idx}
              className="flex items-center justify-between text-sm text-slate-700 bg-white px-3 py-2 rounded border border-slate-100"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></div>
                <span className="truncate font-medium">{lesson.Title}</span>
              </div>

              {lesson.VideoUrl && (
                <Tag
                  icon={<Video size={12} className="mr-1" />}
                  color="cyan"
                  className="m-0 text-[10px] flex items-center border-0 bg-cyan-50 text-cyan-600"
                >
                  Video
                </Tag>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 text-slate-800 py-1 border-b border-slate-100 pb-3 -mx-6 px-6 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">
              Nhập từ Kho học liệu
            </div>
            <div className="text-xs text-slate-500 font-normal mt-0.5">
              Sao chép chương trình mẫu vào lớp học
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      centered
      maskClosable={false}
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          size="large"
          className="text-slate-500 hover:text-slate-700"
        >
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<Download size={18} />}
          onClick={handleSubmit}
          disabled={selectedRowKeys.length === 0}
          size="large"
          className={`font-medium px-6 transition-all ${
            selectedRowKeys.length > 0
              ? "bg-blue-600 hover:!bg-blue-700 shadow-md"
              : ""
          }`}
        >
          Nhập{" "}
          {selectedRowKeys.length > 0 ? `${selectedRowKeys.length} chương` : ""}
        </Button>,
      ]}
    >
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <Input
          prefix={<Search size={18} className="text-slate-400 mr-2" />}
          placeholder="Tìm kiếm theo tên chương hoặc từ khóa..."
          size="large"
          className="rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500"
          value={searchText}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />

        {/* Info Banner khi có chọn */}
        {selectedRowKeys.length > 0 && (
          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg text-sm border border-blue-100 animate-fadeIn">
            <CheckCircle size={18} className="text-blue-500" />
            <span>
              Đang chọn <b>{selectedRowKeys.length}</b> chương. Bấm nút{" "}
              <b>"Nhập"</b> bên dưới để thêm vào lớp.
            </span>
          </div>
        )}

        {/* Data Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <Table
            // --- SỬA LỖI QUAN TRỌNG NHẤT ---
            // Dùng CourseChapterId làm key duy nhất cho mỗi dòng
            rowKey={(record) => record.CourseChapterId}
            columns={columns}
            dataSource={filteredData}
            rowSelection={rowSelection}
            expandable={{
              expandedRowRender,
              // Chỉ hiện nút xổ xuống nếu có bài học
              rowExpandable: (record) =>
                record.Lessons && record.Lessons.length > 0,
              expandIconColumnIndex: 0, // Đặt icon cùng cột với checkbox hoặc ngay sau nó
            }}
            pagination={{
              pageSize: 5,
              showTotal: (total) => (
                <span className="text-slate-500">
                  Tổng <b>{total}</b> chương mẫu
                </span>
              ),
            }}
            scroll={{ y: 400 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-slate-400">
                      Không tìm thấy dữ liệu phù hợp
                    </span>
                  }
                />
              ),
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ImportChapterModal;
