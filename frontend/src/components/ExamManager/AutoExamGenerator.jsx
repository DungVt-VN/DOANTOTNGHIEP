import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Select,
  InputNumber,
  Button,
  Card,
  Tag,
  Table,
  message,
  Divider,
  Progress,
  Statistic,
} from "antd";
import {
  Wand2,
  RefreshCcw,
  Save,
  BookOpen,
  Layers,
  AlertCircle,
} from "lucide-react";

// --- CONSTANTS & MAPPING ---
// Định nghĩa các loại câu hỏi bắt buộc phải có trong cấu hình
const QUESTION_TYPES = ["SingleChoice", "MultipleChoice", "TextInput"];
const LEVELS = ["Easy", "Medium", "Hard"];

const MAP_TYPE = {
  SingleChoice: "Một đáp án",
  MultipleChoice: "Nhiều đáp án",
  TextInput: "Điền đáp án",
};

const MAP_LEVEL = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
};

const getTypeColor = (type) => {
  switch (type) {
    case "SingleChoice":
      return "cyan";
    case "MultipleChoice":
      return "geekblue";
    case "TextInput":
      return "magenta";
    default:
      return "default";
  }
};

const getLevelColor = (level) => {
  switch (level) {
    case "Easy":
      return "success";
    case "Medium":
      return "warning";
    case "Hard":
      return "error";
    default:
      return "default";
  }
};

const AutoExamGenerator = ({ allQuestions = [], onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [totalSelected, setTotalSelected] = useState(0);

  // State quản lý thống kê
  const [stats, setStats] = useState({
    chapters: [],
    matrix: {}, // { SingleChoice: { Easy: 10, ... }, TextInput: { ... } }
    totalPool: 0,
  });

  // 1. Phân tích dữ liệu khi mount hoặc khi allQuestions thay đổi
  useEffect(() => {
    // Lấy danh sách chương duy nhất
    const chapters = [
      ...new Set(allQuestions.map((q) => q.chapter || "Chương chung")),
    ].sort();

    // Khởi tạo ma trận đếm về 0
    const matrix = {};
    QUESTION_TYPES.forEach((type) => {
      matrix[type] = { Easy: 0, Medium: 0, Hard: 0 };
    });

    // Đếm số lượng câu hỏi thực tế
    allQuestions.forEach((q) => {
      // Nếu loại câu hỏi hoặc độ khó không nằm trong danh sách hỗ trợ thì bỏ qua hoặc handle default
      if (matrix[q.type] && matrix[q.type][q.level] !== undefined) {
        matrix[q.type][q.level]++;
      }
    });

    setStats({
      chapters,
      matrix,
      totalPool: allQuestions.length,
    });
  }, [allQuestions]);

  // Handler: Tính tổng số câu hỏi người dùng muốn tạo (Realtime)
  const handleValuesChange = (_, allValues) => {
    const { selectedChapters } = allValues;

    // Nếu có chọn chương, cần tính lại ma trận khả dụng (Optional - ở đây ta chỉ tính tổng input)
    // Để đơn giản, ta chỉ tính tổng số lượng input người dùng nhập vào
    let total = 0;
    QUESTION_TYPES.forEach((type) => {
      LEVELS.forEach((level) => {
        total += allValues[`${type}_${level}`] || 0;
      });
    });
    setTotalSelected(total);
  };

  // 2. Logic sinh đề thi (CORE LOGIC)
  const handleGenerate = (values) => {
    const { selectedChapters } = values;
    let finalSelection = [];
    let warnings = [];

    // Bước 1: Lọc pool câu hỏi theo CHƯƠNG trước
    const chapterPool = allQuestions.filter(
      (q) =>
        selectedChapters === undefined ||
        selectedChapters.length === 0 ||
        selectedChapters.includes(q.chapter || "Chương chung")
    );

    // Bước 2: Duyệt qua cấu hình matrix người dùng nhập
    QUESTION_TYPES.forEach((type) => {
      LEVELS.forEach((level) => {
        const formKey = `${type}_${level}`; // VD: SingleChoice_Easy
        const countNeeded = values[formKey] || 0;

        if (countNeeded > 0) {
          // Lọc câu hỏi thỏa mãn Loại và Độ khó từ pool chương
          const availableQuestions = chapterPool.filter(
            (q) => q.type === type && q.level === level
          );

          if (availableQuestions.length < countNeeded) {
            warnings.push(
              `${MAP_TYPE[type]} - ${MAP_LEVEL[level]}: Cần ${countNeeded} nhưng chỉ có ${availableQuestions.length}.`
            );
            // Lấy tất cả những gì có thể
            finalSelection = [...finalSelection, ...availableQuestions];
          } else {
            // Shuffle và lấy đủ số lượng
            const picked = availableQuestions
              .sort(() => 0.5 - Math.random()) // Simple shuffle
              .slice(0, countNeeded);
            finalSelection = [...finalSelection, ...picked];
          }
        }
      });
    });

    // Thông báo kết quả
    if (warnings.length > 0) {
      message.warning({
        content:
          "Không đủ câu hỏi cho một số mục. Đã lấy tối đa số lượng có sẵn.",
        duration: 4,
      });
    }

    if (finalSelection.length === 0) {
      message.error("Vui lòng nhập số lượng câu hỏi cần tạo.");
    } else {
      message.success(`Đã sinh ngẫu nhiên ${finalSelection.length} câu hỏi!`);
      setPreviewQuestions(finalSelection);
    }
  };

  // Columns cho bảng xem trước
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <span className="text-slate-400 font-mono text-xs">{index + 1}</span>
      ),
    },
    {
      title: "Nội dung câu hỏi",
      dataIndex: "title",
      ellipsis: true,
      render: (text) => (
        <span className="font-medium text-slate-700">{text}</span>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      width: 130,
      render: (t) => <Tag color={getTypeColor(t)}>{MAP_TYPE[t]}</Tag>,
    },
    {
      title: "Độ khó",
      dataIndex: "level",
      width: 100,
      render: (lv) => <Tag color={getLevelColor(lv)}>{MAP_LEVEL[lv]}</Tag>,
    },
  ];

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT PANEL: CONFIGURATION */}
      <div className="w-[340px] flex flex-col gap-4 overflow-hidden">
        <Card
          title={
            <div className="flex items-center gap-2 text-indigo-700">
              <Wand2 size={18} />
              <span>Cấu hình ma trận</span>
            </div>
          }
          className="shadow-sm border-indigo-100 flex-1 flex flex-col overflow-hidden"
          headStyle={{
            backgroundColor: "#eef2ff",
            borderBottom: "1px solid #e0e7ff",
          }}
          bodyStyle={{
            padding: 0,
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerate}
            onValuesChange={handleValuesChange}
            className="flex flex-col h-full"
            initialValues={{ selectedChapters: [] }}
          >
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* 1. CHỌN CHƯƠNG */}
              <div className="mb-6">
                <h4 className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                  <BookOpen size={14} /> Phạm vi kiến thức
                </h4>
                <Form.Item name="selectedChapters" className="mb-1">
                  <Select
                    mode="multiple"
                    placeholder="Tất cả các chương"
                    options={stats.chapters.map((c) => ({
                      label: c,
                      value: c,
                    }))}
                    maxTagCount="responsive"
                    allowClear
                    className="w-full"
                  />
                </Form.Item>
                <div className="text-xs text-slate-400 italic">
                  Để trống để chọn từ toàn bộ ngân hàng.
                </div>
              </div>

              <Divider className="my-4 border-slate-100" />

              {/* 2. MA TRẬN CÂU HỎI */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h4 className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-wider">
                    <Layers size={14} /> Số lượng & Phân bổ
                  </h4>
                </div>

                <div className="space-y-4">
                  {QUESTION_TYPES.map((type) => {
                    // Tính toán số lượng khả dụng (chưa tính filter chapter để hiển thị tổng quan)
                    const available = stats.matrix[type] || {
                      Easy: 0,
                      Medium: 0,
                      Hard: 0,
                    };
                    const totalAvailableType =
                      available.Easy + available.Medium + available.Hard;

                    return (
                      <div
                        key={type}
                        className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                      >
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 border-dashed">
                          <span className="font-semibold text-slate-700 text-sm">
                            {MAP_TYPE[type]}
                          </span>
                          <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                            Kho: {totalAvailableType}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {LEVELS.map((level) => (
                            <div key={level} className="flex flex-col">
                              <div className="flex justify-between items-center mb-1">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    level === "Easy"
                                      ? "text-green-600"
                                      : level === "Medium"
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {MAP_LEVEL[level]}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  /{available[level]}
                                </span>
                              </div>
                              <Form.Item name={`${type}_${level}`} noStyle>
                                <InputNumber
                                  min={0}
                                  max={999} // Cho phép nhập quá số lượng, sẽ warning sau
                                  className="w-full text-center"
                                  placeholder="0"
                                  size="small"
                                />
                              </Form.Item>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t border-slate-100 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-600">Tổng số câu:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {totalSelected}
                </span>
              </div>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Wand2 size={16} />}
                block
                size="large"
                className="bg-indigo-600 hover:!bg-indigo-500 shadow-md shadow-indigo-200 h-10 font-medium"
              >
                Sinh đề ngay
              </Button>
            </div>
          </Form>
        </Card>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {/* Header Preview */}
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 h-[60px] shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              Kết quả xem trước
              {previewQuestions.length > 0 && (
                <Tag color="blue">{previewQuestions.length} câu</Tag>
              )}
            </h3>
          </div>
          <div className="flex gap-2">
            {previewQuestions.length > 0 && (
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={() => form.submit()}
              >
                Đổi câu khác
              </Button>
            )}
            <Button
              type="primary"
              icon={<Save size={16} />}
              className="bg-blue-600"
              disabled={previewQuestions.length === 0}
              onClick={() => onSave(previewQuestions.map((q) => q.key))}
            >
              Lưu vào đề thi
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          <Table
            dataSource={previewQuestions}
            columns={columns}
            rowKey="key"
            pagination={false}
            size="middle"
            sticky
            locale={{
              emptyText: (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Wand2
                      size={32}
                      className="text-slate-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-base font-medium text-slate-600 mb-1">
                    Chưa có câu hỏi nào được chọn
                  </p>
                  <span className="text-sm text-slate-400 max-w-[250px] text-center">
                    Cấu hình ma trận ở cột bên trái và bấm "Sinh đề ngay" để tạo
                    ngẫu nhiên.
                  </span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AutoExamGenerator;
