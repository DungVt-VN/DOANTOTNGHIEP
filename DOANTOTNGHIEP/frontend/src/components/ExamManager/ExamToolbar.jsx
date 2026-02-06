import React from "react";
import { Input, Button, Tooltip } from "antd";
import { Search, Plus, FileText } from "lucide-react"; // Thêm icon FileText
import RefreshButton from "@/components/RefreshButton";

const ExamToolbar = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  loading,
  onAdd,
}) => {
  return (
    <div className="px-6 py-4 border-b rounded-l border-slate-100 flex justify-between items-center gap-4 shrink-0 bg-white rounded-t-lg">
      {/* PHẦN TRÁI: TIÊU ĐỀ & MÔ TẢ */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-sm shadow-blue-100">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0 leading-tight">
            Ngân hàng đề thi
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Quản lý danh sách và cấu trúc đề thi
          </p>
        </div>
      </div>

      {/* PHẦN PHẢI: TÌM KIẾM & NÚT CHỨC NĂNG */}
      <div className="flex items-center gap-3">
        <Input
          prefix={<Search size={16} className="text-slate-400" />}
          placeholder="Tìm kiếm đề thi..."
          // Chỉnh width cố định (w-64) để đẹp hơn, thêm bg-slate-50
          className="w-full rounded-lg py-2 bg-slate-50 border-slate-200 hover:bg-white focus:bg-white transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
        />

        <Tooltip title="Làm mới">
          <span>
            <RefreshButton onClick={onRefresh} />
          </span>
        </Tooltip>

        <Button
          type="primary"
          icon={<Plus size={18} />}
          className="bg-blue-600 hover:!bg-blue-500 h-10 px-5 rounded-lg font-medium shadow-sm shadow-blue-200 flex items-center"
          onClick={onAdd}
        >
          Tạo đề mới
        </Button>
      </div>
    </div>
  );
};

export default ExamToolbar;
