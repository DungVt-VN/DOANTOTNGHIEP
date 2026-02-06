import React from "react";
import { Button, Tooltip, Empty } from "antd";
import { Plus, Edit, Trash2, BookOpenCheck } from "lucide-react";
import LessonItem from "./LessonItem";

const ChapterPane = ({
  chapter,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}) => {
  // Dữ liệu lessons đã được API cha (CourseContent) fetch và truyền xuống trong object 'chapter'
  const lessons = chapter.Lessons || [];

  return (
    <div className="px-6 py-4 h-full overflow-y-auto custom-scrollbar">
      {/* --- CHAPTER HEADER --- */}
      <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200/60 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                Chương {chapter.OrderIndex}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {lessons.length} bài học
              </span>
            </div>
            <h3 className="font-bold text-xl text-slate-800 leading-tight">
              {chapter.Title}
            </h3>
            {chapter.Description && (
              <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-3xl">
                {chapter.Description}
              </p>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            <Tooltip title="Chỉnh sửa chương">
              <Button
                size="small"
                type="text"
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                icon={<Edit size={16} />}
                onClick={() => onEditChapter(chapter)}
              />
            </Tooltip>
            <Tooltip title="Xóa chương">
              <Button
                size="small"
                type="text"
                danger
                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                icon={<Trash2 size={16} />}
                onClick={() => onDeleteChapter(chapter.CourseChapterId)}
              />
            </Tooltip>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-end">
          <Button
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 shadow-sm h-9 px-4 text-sm font-medium flex items-center gap-2"
            icon={<Plus size={16} />}
            onClick={() => onAddLesson(chapter.CourseChapterId)}
          >
            Thêm bài học mới
          </Button>
        </div>
      </div>

      {/* --- LESSON LIST --- */}
      <div className="pb-20">
        {lessons.length > 0 ? (
          <div className="flex flex-col gap-2">
            {lessons.map((lesson, index) => (
              <LessonItem
                key={lesson.LessonId}
                lesson={lesson}
                index={index}
                onEdit={(l) => onEditLesson(l, chapter.CourseChapterId)}
                onDelete={onDeleteLesson}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
              <BookOpenCheck className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Chưa có bài học nào trong chương này
            </p>
            <p className="text-slate-400 text-xs mt-1 mb-4 max-w-xs text-center">
              Hãy bắt đầu xây dựng nội dung bài giảng để học viên có thể tham
              gia học tập.
            </p>
            <Button
              type="dashed"
              icon={<Plus size={16} />}
              onClick={() => onAddLesson(chapter.CourseChapterId)}
            >
              Tạo bài học đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterPane;
