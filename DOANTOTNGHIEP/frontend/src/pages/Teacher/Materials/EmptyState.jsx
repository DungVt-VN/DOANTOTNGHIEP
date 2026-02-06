import React from "react";
import { Filter } from "lucide-react";

const EmptyState = ({ searchTerm, onClearSearch }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Filter className="text-slate-300" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-600">
        Không tìm thấy kết quả
      </h3>
      <p className="text-slate-400 text-sm mt-1">
        {searchTerm
          ? `Không có môn nào khớp với "${searchTerm}"`
          : "Hệ thống chưa có khóa học nào."}
      </p>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="mt-4 text-blue-600 font-medium hover:underline text-sm"
        >
          Xóa bộ lọc tìm kiếm
        </button>
      )}
    </div>
  );
};

export default EmptyState;
