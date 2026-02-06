import React from "react";
import { Video, FileText, Download, Trash2, Eye } from "lucide-react";

const MaterialList = ({ materials, onDelete }) => {
  if (!materials || materials.length === 0)
    return (
      <div className="text-xs text-slate-400 italic mt-2">
        Chưa có tài liệu.
      </div>
    );
  return (
    <div className="space-y-2 mt-3">
      {materials.map((file) => (
        <div
          key={file.id || Math.random()}
          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors group"
        >
          {/* --- PHẦN CLICKABLE (ICON + TÊN) --- */}
          {/* Nếu có file.onClick (Video) thì hiển thị cursor-pointer và bắt sự kiện click */}
          <div
            className={`flex items-center gap-3 overflow-hidden flex-1 min-w-0 ${
              file.onClick ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (file.onClick) file.onClick();
            }}
          >
            <div
              className={`p-1.5 rounded-md shrink-0 ${
                file.type === "video"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {file.type === "video" ? (
                <Video size={16} />
              ) : (
                <FileText size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-slate-700 truncate"
                title={file.Title}
              >
                {file.Title}
              </p>
            </div>
          </div>

          {/* --- PHẦN ACTION BUTTONS --- */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {/* Nút Xem/Download: Nếu là video thì icon Mắt (Xem), còn lại là Download */}
            {file.type === "video" && file.onClick ? (
              <button
                onClick={() => file.onClick()}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Xem video"
              >
                <Eye size={14} />
              </button>
            ) : (
              <a
                href={file.Url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Mở tài liệu"
              >
                <Download size={14} />
              </a>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn click lan ra ngoài
                onDelete(file);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaterialList;
