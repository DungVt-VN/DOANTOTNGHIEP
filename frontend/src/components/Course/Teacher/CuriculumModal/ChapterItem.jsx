import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  GripVertical,
  Play,
  FileText,
  FileSpreadsheet,
  File,
  FileQuestion,
  Paperclip,
  MoreVertical,
  MonitorPlay,
  CheckCircle2,
  BookOpen,
  Video,
  Download,
  X,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { Dropdown, Button, Tooltip, Tag, Modal } from "antd";

// --- HELPER: CHECK LINK YOUTUBE ---
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// --- HELPER: GET FILE CONFIG ---
const getFileConfig = (fileName) => {
  if (!fileName)
    return { icon: File, color: "text-slate-500", bg: "bg-slate-100" };
  const ext = fileName.split(".").pop().toLowerCase();

  if (["xlsx", "xls", "csv"].includes(ext))
    return {
      icon: FileSpreadsheet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    };
  if (["pdf"].includes(ext))
    return { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" };
  if (["doc", "docx"].includes(ext))
    return { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" };

  return { icon: File, color: "text-slate-500", bg: "bg-slate-100" };
};

// --- SUB-COMPONENT: Attachment Chip ---
const AttachmentChip = ({ file, type, onPreview }) => {
  const { icon: Icon, color, bg } = getFileConfig(file.Title);
  const isExercise = type === "exercise";
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onPreview(file);
      }}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all cursor-pointer select-none
        ${
          isExercise
            ? "bg-orange-50 border-orange-100 text-orange-700 hover:border-orange-300"
            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300"
        }`}
    >
      {isExercise ? (
        <FileQuestion size={14} />
      ) : (
        <Icon size={14} className={isExercise ? "" : color} />
      )}
      <span className="truncate max-w-[150px] text-xs font-medium">
        {file.Title}
      </span>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ChapterItem = ({
  chapter,
  index,
  onAddLesson,
  onDeleteChapter,
  onEditChapter, // Nhận prop này từ cha để sửa chương
  onDeleteLesson,
  onEditLesson,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // --- STATE CHO PREVIEW ---
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  const handlePreviewVideo = (lesson) => {
    if (lesson.VideoUrl) {
      setCurrentLesson(lesson);
      setIsVideoModalOpen(true);
    }
  };

  const handlePreviewFile = (file) => setPreviewFile(file);

  // --- MENU CONFIGURATIONS ---
  const getLessonMenuItems = (lesson) => [
    {
      key: "edit",
      icon: <Edit size={14} />,
      label: "Chỉnh sửa",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        if (onEditLesson) onEditLesson(lesson);
      },
    },
    {
      key: "delete",
      icon: <Trash2 size={14} />,
      label: "Xóa bài học",
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        if (onDeleteLesson) onDeleteLesson(lesson);
      },
    },
  ];

  const addMenuItems = [
    {
      key: "1",
      label: "Tạo bài mới",
      icon: <Plus size={14} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAddLesson(chapter.CourseChapterId, "create");
      },
    },
    {
      key: "2",
      label: "Nhập từ kho",
      icon: <Download size={14} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAddLesson(chapter.CourseChapterId, "import");
      },
    },
  ];

  // --- RENDER FILE PREVIEW ---
  const renderFileContent = (file) => {
    if (!file?.FileUrl) return null;
    const ext = (file.Title || "").split(".").pop().toLowerCase();
    const fileUrl = file.FileUrl;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return (
        <img src={fileUrl} className="max-w-full max-h-full object-contain" />
      );
    if (["mp4", "webm"].includes(ext))
      return <video src={fileUrl} controls className="max-w-full max-h-full" />;
    if (ext === "pdf")
      return (
        <iframe src={fileUrl} className="w-full h-full border-none bg-white" />
      );
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      const encodedUrl = encodeURIComponent(fileUrl);
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
          className="w-full h-full border-none bg-white"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Button
          type="primary"
          href={fileUrl}
          target="_blank"
          icon={<Download size={16} />}
        >
          Tải xuống
        </Button>
      </div>
    );
  };
  const renderPreviewTitleIcon = () => {
    if (!previewFile) return null;
    const { icon: Icon } = getFileConfig(previewFile.Title);
    return <Icon size={18} className="text-blue-600" />;
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-6 overflow-hidden group/chapter">
        {/* ========================================================= */}
        {/* 1. CHAPTER HEADER - CẬP NHẬT LOGIC & CSS TRUNCATE         */}
        {/* ========================================================= */}
        <div
          className={`
            relative flex items-center justify-between px-6 py-5 cursor-pointer select-none transition-colors duration-200
            ${
              isExpanded
                ? "bg-white border-b border-slate-100"
                : "bg-slate-50/50 hover:bg-white"
            }
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Left Side: Icon + Title */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={`mt-1 text-slate-400 transition-transform duration-300 ${
                isExpanded ? "rotate-180 text-blue-500" : "rotate-0"
              }`}
            >
              <ChevronDown size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center px-3 py-1 rounded-md bg-blue-600 text-white text-[12px] font-bold tracking-wider uppercase shadow-sm shrink-0">
                  Chương {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover/chapter:text-blue-700 transition-colors truncate">
                  {chapter.Title}
                </h3>
              </div>

              {/* Description: Dùng class truncate để cắt ngắn dòng */}
              {chapter.Description && (
                <p className="text-sm text-slate-500 pl-1 font-medium opacity-80 truncate block">
                  {chapter.Description}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Meta Info + Actions */}
          <div className="flex items-center gap-5 shrink-0 ml-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200 whitespace-nowrap">
              <FolderOpen size={14} />
              {chapter.Lessons ? chapter.Lessons.length : 0} bài học
            </div>

            {/* Action Buttons: Gắn hàm onEditChapter và onDeleteChapter */}
            <div
              className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/chapter:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="Chỉnh sửa chương">
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <Edit
                      size={16}
                      className="text-slate-400 hover:text-blue-600"
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditChapter) onEditChapter(chapter);
                  }}
                />
              </Tooltip>
              <Tooltip title="Xóa chương">
                <Button
                  type="text"
                  shape="circle"
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteChapter) onDeleteChapter();
                  }}
                />
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 2. LESSON LIST (GIỮ NGUYÊN) */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isExpanded
              ? "max-h-[5000px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="bg-slate-50/30 p-4 space-y-3">
            {chapter.Lessons && chapter.Lessons.length > 0 ? (
              chapter.Lessons.map((lesson, idx) => {
                const hasDocuments =
                  lesson.Documents && lesson.Documents.length > 0;
                const hasExercises =
                  lesson.Exercises && lesson.Exercises.length > 0;
                const isEmpty =
                  !lesson.VideoUrl && !hasDocuments && !hasExercises;

                return (
                  <div
                    key={lesson.LessonId || idx}
                    className="group relative bg-white flex flex-col sm:flex-row p-5 gap-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-move text-slate-300 p-2">
                      <GripVertical size={16} />
                    </div>

                    <div className="w-full sm:w-64 shrink-0 self-start ml-4">
                      <div
                        className="w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative group/thumb cursor-pointer flex items-center justify-center shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVideo(lesson);
                        }}
                      >
                        {lesson.VideoUrl ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black" />
                            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white z-10 shadow-2xl group-hover/thumb:scale-110 transition-transform">
                              <Play
                                size={24}
                                fill="currentColor"
                                className="ml-1 opacity-90"
                              />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                              VIDEO
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                              <BookOpen size={24} className="text-slate-300" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              Lý thuyết
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1">
                          <h4
                            className="text-lg font-bold text-slate-800 hover:text-blue-700 transition-colors cursor-pointer mb-1"
                            onClick={() => onEditLesson && onEditLesson(lesson)}
                          >
                            {idx + 1}. {lesson.Title}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {lesson.Description || (
                              <span className="italic text-slate-400 text-xs">
                                Chưa có mô tả.
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Dropdown
                            menu={{ items: getLessonMenuItems(lesson) }}
                            trigger={["click"]}
                            placement="bottomRight"
                          >
                            <Button
                              size="small"
                              type="text"
                              icon={
                                <MoreVertical
                                  size={16}
                                  className="text-slate-400"
                                />
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Dropdown>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {(hasDocuments || hasExercises) && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3 mt-1">
                            {hasDocuments && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {lesson.Documents.map((doc, i) => (
                                  <AttachmentChip
                                    key={doc.LessonMaterialId || i}
                                    file={doc}
                                    type="document"
                                    onPreview={handlePreviewFile}
                                  />
                                ))}
                              </div>
                            )}
                            {hasExercises && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {lesson.Exercises.map((ex, i) => (
                                  <AttachmentChip
                                    key={ex.LessonMaterialId || i}
                                    file={ex}
                                    type="exercise"
                                    onPreview={handlePreviewFile}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {isEmpty && (
                          <div className="py-2 border-t border-dashed border-slate-200 mt-2">
                            <span className="text-xs text-slate-400 italic">
                              Chưa có nội dung chi tiết.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                <MonitorPlay size={40} className="mb-3 text-slate-300" />
                <p className="text-sm font-medium">
                  Chương này chưa có bài học nào.
                </p>
              </div>
            )}
            <div className="bg-slate-50/50 hover:bg-blue-50/50 transition-colors border-t border-slate-100 rounded-b-xl">
              <Dropdown menu={{ items: addMenuItems }} trigger={["click"]}>
                <div className="w-full py-3 flex items-center justify-center gap-2 cursor-pointer text-slate-500 hover:text-blue-600 transition-colors group">
                  <div className="p-1 rounded-full border border-slate-300 group-hover:border-blue-400 group-hover:bg-blue-100 transition-all">
                    <Plus size={14} />
                  </div>
                  <span className="text-sm font-medium">
                    Thêm nội dung vào chương
                  </span>
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal
        open={isVideoModalOpen}
        onCancel={() => setIsVideoModalOpen(false)}
        footer={null}
        centered
        width={900}
        destroyOnHidden
        title={
          <div className="font-semibold text-slate-700">
            {currentLesson?.Title}
          </div>
        }
      >
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
          {currentLesson?.VideoUrl && getYoutubeId(currentLesson.VideoUrl) ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${getYoutubeId(
                currentLesson.VideoUrl
              )}?autoplay=1`}
              title="Preview"
              frameBorder="0"
              allowFullScreen
            />
          ) : (
            <video
              className="w-full h-full object-contain"
              controls
              autoPlay
              src={currentLesson?.VideoUrl}
            />
          )}
        </div>
      </Modal>

      <Modal
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        footer={null}
        centered
        width={1200}
        destroyOnHidden
        closeIcon={null}
        styles={{
          body: {
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            padding: 0,
          },
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              {renderPreviewTitleIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-700 truncate max-w-md text-base">
                {previewFile?.Title}
              </h3>
            </div>
          </div>
          <Button
            type="text"
            icon={<X size={20} />}
            onClick={() => setPreviewFile(null)}
          />
        </div>
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          <div className="w-full h-full flex-1 flex flex-col">
            {!!previewFile && renderFileContent(previewFile)}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ChapterItem;
