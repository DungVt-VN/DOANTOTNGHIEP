import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Tag,
  Tabs,
  Button,
  message,
  Checkbox,
  Input,
  Empty,
  Tooltip,
} from "antd";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  Filter,
  ChevronLeft, // Icon mới cho nút quay lại
} from "lucide-react";
import AutoExamGenerator from "./AutoExamGenerator";
import { removeVietnameseTones } from "@/js/Helper";

// --- CONSTANTS ---
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

const getTypeLabel = (type) => MAP_TYPE[type] || type;
const getLevelLabel = (level) => MAP_LEVEL[level] || level;

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

const QuestionSelectorModal = ({
  open,
  onCancel,
  onSave,
  examTitle,
  allQuestions = [],
  initialTargetKeys = [],
}) => {
  // State lưu danh sách chính thức đã chọn vào đề
  const [targetKeys, setTargetKeys] = useState([]);

  // State lưu danh sách ĐANG TÍCH CHỌN (Tạm thời) ở 2 bên
  const [leftCheckedKeys, setLeftCheckedKeys] = useState([]);
  const [rightCheckedKeys, setRightCheckedKeys] = useState([]);

  const [activeTab, setActiveTab] = useState("1");
  const [expandedState, setExpandedState] = useState({ left: [], right: [] });

  useEffect(() => {
    if (open) {
      setTargetKeys(initialTargetKeys);
      setLeftCheckedKeys([]);
      setRightCheckedKeys([]);
      setExpandedState({ left: [], right: [] });
    }
  }, [open, initialTargetKeys]);

  // --- PHÂN TÁCH DỮ LIỆU ---
  const { leftDataSource, rightDataSource } = useMemo(() => {
    const right = [];
    const left = [];
    allQuestions.forEach((q) => {
      if (targetKeys.includes(q.key)) right.push(q);
      else left.push(q);
    });
    return { leftDataSource: left, rightDataSource: right };
  }, [allQuestions, targetKeys]);

  // --- ACTIONS CHUYỂN ĐỔI (MOVE) ---

  // 1. Chuyển từ Trái sang Phải (Thêm vào đề)
  const handleMoveRight = () => {
    const newTargetKeys = [...targetKeys, ...leftCheckedKeys];
    setTargetKeys(newTargetKeys);
    setLeftCheckedKeys([]); // Clear check bên trái sau khi chuyển
  };

  // 2. Chuyển từ Phải sang Trái (Xóa khỏi đề)
  const handleMoveLeft = () => {
    const newTargetKeys = targetKeys.filter(
      (key) => !rightCheckedKeys.includes(key)
    );
    setTargetKeys(newTargetKeys);
    setRightCheckedKeys([]); // Clear check bên phải sau khi chuyển
  };

  // --- ACTIONS CHECKBOX (SELECT) ---

  // Xử lý khi click vào 1 item
  const handleItemCheck = (key, direction, checked) => {
    const setChecked =
      direction === "left" ? setLeftCheckedKeys : setRightCheckedKeys;

    setChecked((prev) => {
      if (checked) return [...prev, key];
      return prev.filter((k) => k !== key);
    });
  };

  // Xử lý khi click chọn cả nhóm (Chương)
  const handleGroupCheck = (keysInGroup, direction, shouldCheck) => {
    const setChecked =
      direction === "left" ? setLeftCheckedKeys : setRightCheckedKeys;

    setChecked((prev) => {
      if (shouldCheck) {
        // Thêm tất cả keys trong group vào list check hiện tại (loại bỏ trùng)
        return [...new Set([...prev, ...keysInGroup])];
      } else {
        // Bỏ tất cả keys trong group khỏi list check
        return prev.filter((k) => !keysInGroup.includes(k));
      }
    });
  };

  const handleManualSave = () => onSave(targetKeys);

  const handleAutoSave = (generatedKeys) => {
    const mergedKeys = [...new Set([...targetKeys, ...generatedKeys])];
    setTargetKeys(mergedKeys);
    onSave(mergedKeys);
    message.success(`Đã thêm ${generatedKeys.length} câu hỏi vào đề thi!`);
    setActiveTab("1");
  };

  const toggleChapter = (chapterName, direction) => {
    setExpandedState((prev) => {
      const currentList = prev[direction] || [];
      const newList = currentList.includes(chapterName)
        ? currentList.filter((c) => c !== chapterName)
        : [...currentList, chapterName];
      return { ...prev, [direction]: newList };
    });
  };

  // --- COMPONENT CON: DANH SÁCH ---
  const CustomListPanel = ({
    dataSource,
    direction,
    title,
    icon,
    checkedKeys,
  }) => {
    const [searchText, setSearchText] = useState("");
    const isRight = direction === "right";

    // Lọc dữ liệu
    const filteredData = useMemo(() => {
      if (!searchText) return dataSource;
      const lower = removeVietnameseTones(searchText);
      return dataSource.filter(
        (item) =>
          removeVietnameseTones(item.title).includes(lower) ||
          removeVietnameseTones(item.chapter).includes(lower)
      );
    }, [dataSource, searchText]);

    // Group dữ liệu
    const groupedItems = useMemo(() => {
      return filteredData.reduce((acc, item) => {
        const chapter = item.chapter || "Chương khác";
        if (!acc[chapter]) acc[chapter] = [];
        acc[chapter].push(item);
        return acc;
      }, {});
    }, [filteredData]);

    return (
      <div
        className={`flex flex-col h-full bg-white border rounded-xl overflow-hidden shadow-sm transition-colors duration-300
        ${isRight ? "border-blue-100" : "border-slate-200"}
      `}
      >
        {/* HEADER PANEL */}
        <div
          className={`p-3 border-b flex flex-col gap-3
           ${
             isRight
               ? "bg-blue-50/30 border-blue-100"
               : "bg-slate-50 border-slate-100"
           }
        `}
        >
          <div className="flex items-center justify-between">
            <div
              className={`font-semibold flex items-center gap-2 ${
                isRight ? "text-blue-700" : "text-slate-700"
              }`}
            >
              {icon} {title}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isRight
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {dataSource.length}
              </span>
            </div>
            {checkedKeys.length > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Đã chọn:{" "}
                <b className={isRight ? "text-red-500" : "text-blue-600"}>
                  {checkedKeys.length}
                </b>
              </span>
            )}
          </div>
          <Input
            prefix={<Search size={14} className="text-slate-400" />}
            placeholder={isRight ? "Tìm trong đề..." : "Tìm trong ngân hàng..."}
            className="text-sm rounded-lg bg-white/80"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* BODY PANEL */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2 custom-scrollbar bg-white">
          {filteredData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 select-none">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchText ? "Không tìm thấy kết quả" : "Trống"}
              />
            </div>
          ) : (
            Object.entries(groupedItems).map(([chapter, items]) => {
              const isExpanded = expandedState[direction]?.includes(chapter);
              const itemsKeys = items.map((item) => item.key);

              // Kiểm tra xem tất cả item trong chương này đã được check chưa
              const checkedCountInChapter = itemsKeys.filter((k) =>
                checkedKeys.includes(k)
              ).length;
              const isAllChecked =
                itemsKeys.length > 0 &&
                checkedCountInChapter === itemsKeys.length;
              const isIndeterminate =
                checkedCountInChapter > 0 && !isAllChecked;

              return (
                <div
                  key={chapter}
                  className="mb-2 bg-white rounded-lg border border-slate-100 overflow-hidden shrink-0 group/chapter"
                >
                  {/* CHAPTER HEADER */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleChapter(chapter, direction)}
                  >
                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>

                    <Checkbox
                      checked={isAllChecked}
                      indeterminate={isIndeterminate}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupCheck(itemsKeys, direction, !isAllChecked);
                      }}
                      className="mr-1"
                    />

                    <span className="font-semibold text-slate-700 text-sm flex-1 select-none">
                      {chapter}{" "}
                      <span className="text-slate-400 font-normal">
                        ({items.length})
                      </span>
                    </span>
                  </div>

                  {/* ITEMS LIST */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {items.map((item) => {
                        const isChecked = checkedKeys.includes(item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() =>
                              handleItemCheck(item.key, direction, !isChecked)
                            }
                            className={`
                                group relative flex items-start gap-3 p-3 border-b border-slate-50 last:border-0 cursor-pointer transition-all duration-200
                                ${
                                  isChecked
                                    ? "bg-blue-50/40"
                                    : "hover:bg-slate-50"
                                }
                            `}
                          >
                            <Checkbox
                              checked={isChecked}
                              className="mt-1 shrink-0"
                            />

                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <Tag
                                  color={getTypeColor(item.type)}
                                  className="m-0 text-[10px] px-1.5 py-0 rounded border-0 bg-opacity-10 font-medium"
                                >
                                  {getTypeLabel(item.type)}
                                </Tag>
                                <Tag
                                  color={getLevelColor(item.level)}
                                  className="m-0 text-[10px] px-1.5 py-0 rounded border-0 bg-opacity-10 font-medium"
                                >
                                  {getLevelLabel(item.level)}
                                </Tag>
                              </div>
                              <span
                                className={`text-sm leading-snug line-clamp-2 transition-colors ${
                                  isChecked
                                    ? "text-slate-900 font-medium"
                                    : "text-slate-600"
                                }`}
                                title={item.title}
                              >
                                {item.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      width={1200}
      style={{ top: 20 }}
      centered={false}
      maskClosable={false}
      footer={null}
      className="p-0 select-none"
    >
      <div className="border-b border-slate-100 bg-white rounded-t-lg">
        <div className="flex justify-between items-start p-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800">
                Soạn đề kiểm tra
              </span>
              <span className="text-sm text-slate-500 mt-0.5">
                Đề thi:{" "}
                <span className="font-semibold text-blue-600">{examTitle}</span>
              </span>
            </div>
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "1", label: "Chọn thủ công" },
            { key: "2", label: "Tạo tự động" },
          ]}
          className="px-5"
        />
      </div>

      <div className="p-5 bg-slate-50/50 h-[650px] max-h-[85vh] flex flex-col">
        {activeTab === "1" ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* --- KHU VỰC TRANSFER --- */}
            <div className="flex-1 min-h-0 flex gap-4">
              {/* CỘT TRÁI */}
              <div className="flex-1 min-w-0">
                <CustomListPanel
                  dataSource={leftDataSource}
                  direction="left"
                  title="Ngân hàng câu hỏi"
                  icon={<Filter size={18} className="text-slate-400" />}
                  checkedKeys={leftCheckedKeys} // Truyền state check bên trái
                />
              </div>

              {/* CỘT GIỮA: NÚT ĐIỀU HƯỚNG */}
              <div className="flex flex-col justify-center gap-3 px-1">
                <Button
                  type="primary"
                  disabled={leftCheckedKeys.length === 0} // Disable nếu chưa chọn gì bên trái
                  onClick={handleMoveRight}
                  className="flex items-center gap-1 min-w-[100px] justify-center"
                >
                  Thêm <ChevronRight size={16} />
                </Button>

                <Button
                  danger
                  disabled={rightCheckedKeys.length === 0} // Disable nếu chưa chọn gì bên phải
                  onClick={handleMoveLeft}
                  className="flex items-center gap-1 min-w-[100px] justify-center"
                >
                  <ChevronLeft size={16} /> Xóa
                </Button>
              </div>

              {/* CỘT PHẢI */}
              <div className="flex-1 min-w-0">
                <CustomListPanel
                  dataSource={rightDataSource}
                  direction="right"
                  title="Đã chọn vào đề"
                  icon={<FileText size={18} className="text-blue-500" />}
                  checkedKeys={rightCheckedKeys} // Truyền state check bên phải
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
              <Button size="large" onClick={onCancel}>
                Đóng
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleManualSave}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Lưu câu hỏi ({targetKeys.length})
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <AutoExamGenerator
              allQuestions={allQuestions}
              onSave={handleAutoSave}
              onCancel={onCancel}
            />
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </Modal>
  );
};

export default QuestionSelectorModal;
