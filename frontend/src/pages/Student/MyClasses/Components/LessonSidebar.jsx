import React, { useMemo } from "react";
import { Collapse } from "antd";
import { CheckCircle, Circle, PlayCircle, Video, FileQuestion } from "lucide-react";

const { Panel } = Collapse;

const LessonSidebar = ({ 
  chapters, 
  currentLesson, 
  onSelectLesson, 
  completedLessonIds = [] 
}) => {
  
  // Tự động mở Chapter chứa bài học đang học
  const activeChapterKey = useMemo(() => {
    if (!currentLesson || !chapters) return [];
    const activeChapter = chapters.find(c => 
      c.lessons?.some(l => l.LessonId === currentLesson.LessonId)
    );
    return activeChapter ? [activeChapter.ChapterId.toString()] : [];
  }, [currentLesson, chapters]); // Chỉ tính toán lại khi currentLesson thay đổi

  // Hàm xử lý khi click vào bài học
  const handleItemClick = (e, lesson) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt (tránh đóng mở accordion ngoài ý muốn)
    if (onSelectLesson) {
      onSelectLesson(lesson);
    }
  };

  const renderLessonItem = (lesson) => {
    const isSelected = currentLesson?.LessonId === lesson.LessonId;
    const isCompleted = completedLessonIds.includes(lesson.LessonId);
    const TypeIcon = lesson.Type === 'video' ? Video : FileQuestion;

    return (
      <div
        key={lesson.LessonId}
        onClick={(e) => handleItemClick(e, lesson)} // Gọi hàm xử lý click
        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 group relative select-none
          ${isSelected 
            ? "bg-indigo-50 border border-indigo-100 shadow-sm" 
            : "hover:bg-slate-100 border border-transparent"
          }`}
      >
        {/* Chỉ báo đang phát */}
        {isSelected && (
           <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full"></div>
        )}

        {/* Icon trạng thái */}
        <div className="mt-0.5 shrink-0 z-10">
          {isSelected ? (
            <PlayCircle size={18} className="text-indigo-600 animate-pulse" />
          ) : isCompleted ? (
            <CheckCircle size={18} className="text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle size={18} className="text-slate-300 group-hover:text-indigo-400" />
          )}
        </div>

        {/* Nội dung bài */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug mb-1 line-clamp-2 ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
            {lesson.Title}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
             <div className="flex items-center gap-1">
                <TypeIcon size={12} />
                <span>{lesson.Type === 'video' ? 'Video' : 'Quiz'}</span>
             </div>
             {lesson.Duration && lesson.Duration !== "00:00" && (
                <>
                  <span>•</span>
                  <span>{lesson.Duration}</span>
                </>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lesson-sidebar">
      <Collapse
        defaultActiveKey={activeChapterKey}
        ghost
        expandIconPosition="end"
        className="site-collapse-custom-collapse"
      >
        {chapters?.map((chapter) => (
          <Panel
            header={
              <div className="py-1">
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                    {chapter.Title}
                </h4>
                <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
                    {chapter.lessons?.length || 0} bài học
                </p>
              </div>
            }
            key={chapter.ChapterId}
          >
            <div className="flex flex-col pl-1">
              {chapter.lessons && chapter.lessons.length > 0 ? (
                  chapter.lessons.map(renderLessonItem)
              ) : (
                  <div className="text-xs text-slate-400 italic p-2 text-center">Chưa có bài học</div>
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default LessonSidebar;