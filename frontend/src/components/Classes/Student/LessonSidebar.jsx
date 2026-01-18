import React from "react";
import { Menu } from "antd";
import { CheckCircle, PlayCircle, Lock } from "lucide-react";

const LessonSidebar = ({ chapters, currentLesson, onSelectLesson }) => {
  // Biến đổi data chapters thành items cho Menu Antd
  const menuItems = chapters.map((chap) => ({
    key: `chap_${chap.ChapterId}`,
    label: <span className="font-bold text-slate-700">{chap.Title}</span>,
    type: "group",
    children: chap.lessons.map((les) => ({
      key: les.LessonId.toString(),
      label: (
        <div className="flex items-center gap-3 py-1">
          <div
            className={`shrink-0 ${
              les.IsCompleted ? "text-green-500" : "text-slate-400"
            }`}
          >
            {les.IsLocked ? (
              <Lock size={16} />
            ) : les.IsCompleted ? (
              <CheckCircle size={16} />
            ) : (
              <PlayCircle size={16} />
            )}
          </div>
          <span
            className={`truncate text-sm ${
              currentLesson?.LessonId === les.LessonId
                ? "font-semibold"
                : "font-normal"
            }`}
          >
            {les.Title}
          </span>
        </div>
      ),
      disabled: les.IsLocked, // Nếu bài học bị khóa
    })),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4 max-h-[calc(100vh-40px)] flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
        <span className="font-bold text-slate-700">Nội dung bài học</span>
        <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-0.5 rounded text-slate-500">
          {chapters.reduce((acc, c) => acc + c.lessons.length, 0)} bài
        </span>
      </div>
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <Menu
          mode="inline"
          selectedKeys={[currentLesson?.LessonId?.toString()]}
          className="border-none"
          items={menuItems}
          onClick={({ key }) => onSelectLesson(parseInt(key))}
        />
      </div>
    </div>
  );
};

export default LessonSidebar;
