import React, { useState } from "react";
import { Button, Modal, Dropdown, Menu, Tooltip } from "antd";
import {
  Edit,
  Trash2,
  Video,
  FileText,
  FileSpreadsheet,
  File,
  MoreVertical,
  Download,
  Play,
  FileQuestion,
  Eye,
  AlertCircle,
  X,
  Paperclip,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

// --- HELPER: LẤY ID YOUTUBE ---
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// --- HELPER: CẤU HÌNH ICON FILE ---
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

  const borderClass = isExercise
    ? "border-orange-200 hover:border-orange-400 bg-white"
    : "border-slate-200 hover:border-blue-400 bg-white";

  const iconBoxClass = isExercise
    ? "bg-orange-50 text-orange-600"
    : `${bg} ${color}`;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onPreview(file);
      }}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg border shadow-sm transition-all cursor-pointer select-none ${borderClass}`}
      title="Nhấn để xem trước"
    >
      <div
        className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${iconBoxClass}`}
      >
        {isExercise ? <FileQuestion size={16} /> : <Icon size={16} />}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="truncate max-w-[160px] text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
          {file.Title}
        </span>
        <span className="text-[10px] text-slate-400 uppercase font-medium">
          {isExercise ? "Bài tập" : file.Title.split(".").pop()}
        </span>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const LessonItem = ({ lesson, index, onEdit, onDelete }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const handlePreviewVideo = (e) => {
    e?.stopPropagation();
    if (lesson.VideoUrl) setIsVideoModalOpen(true);
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<Edit size={14} />}
        onClick={() => onEdit(lesson)}
      >
        Chỉnh sửa bài học
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<Trash2 size={14} />}
        danger
        onClick={() => onDelete(lesson.LessonId)}
      >
        Xóa bài học
      </Menu.Item>
    </Menu>
  );

  // --- LOGIC HIỂN THỊ NỘI DUNG FILE (QUAN TRỌNG) ---
  const renderFileContent = (file) => {
    if (!file?.FileUrl) return null;
    const ext = (file.Title || "").split(".").pop().toLowerCase();
    const fileUrl = file.FileUrl;

    // 1. ẢNH
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900/5 p-4">
          <img
            src={fileUrl}
            alt={file.Title}
            className="max-w-full max-h-full object-contain shadow-md rounded-lg"
          />
        </div>
      );
    }

    // 2. VIDEO
    if (["mp4", "webm", "mov"].includes(ext)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video src={fileUrl} controls className="max-w-full max-h-full" />
        </div>
      );
    }

    // 3. PDF (Dùng trình đọc native của trình duyệt)
    if (ext === "pdf") {
      return (
        <iframe
          src={fileUrl}
          title="PDF Viewer"
          className="w-full h-full border-none bg-white block"
        />
      );
    }

    // 4. OFFICE FILES (Excel, Word, PowerPoint) - Dùng MS Office Viewer
    // Lưu ý: FileUrl phải là public URL (không phải localhost)
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      const encodedUrl = encodeURIComponent(fileUrl);
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

      return (
        <iframe
          src={officeViewerUrl}
          title="Office Viewer"
          className="w-full h-full border-none bg-white block"
        />
      );
    }

    // 5. FILE TEXT/CODE
    if (["txt", "json", "html", "css", "js"].includes(ext)) {
      return (
        <iframe
          src={fileUrl}
          title="Text Viewer"
          className="w-full h-full border-none bg-white p-4 font-mono text-sm block"
        />
      );
    }

    // 6. KHÔNG HỖ TRỢ XEM TRƯỚC -> HIỆN NÚT TẢI
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle size={32} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">
          Không thể xem trước
        </h3>
        <p className="text-sm mb-6 mt-1 text-slate-400">
          Định dạng <b>.{ext}</b> này cần được tải về để xem.
        </p>
        <Button
          type="primary"
          href={fileUrl}
          target="_blank"
          icon={<Download size={16} />}
          className="h-10 px-6 rounded-full"
        >
          Tải xuống ngay
        </Button>
      </div>
    );
  };

  const renderPreviewTitleIcon = () => {
    if (!previewFile) return null;
    const { icon: Icon } = getFileConfig(previewFile.Title);
    return <Icon size={18} className="text-blue-600" />;
  };

  const hasDocuments = lesson.Documents && lesson.Documents.length > 0;
  const hasExercises = lesson.Exercises && lesson.Exercises.length > 0;
  const isEmpty = !lesson.VideoUrl && !hasDocuments && !hasExercises;

  return (
    <>
      <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row p-4 gap-5">
        {/* --- 1. LEFT SIDE: VIDEO THUMBNAIL --- */}
        <div className="w-full sm:w-64 shrink-0 self-start">
          <div
            className="w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative group/thumb cursor-pointer flex items-center justify-center shadow-md"
            onClick={lesson.VideoUrl ? handlePreviewVideo : undefined}
          >
            {lesson.VideoUrl ? (
              <>
                {/* Background Styling */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-70 group-hover/thumb:scale-110 transition-transform duration-700" />
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Play Button */}
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white z-10 shadow-2xl group-hover/thumb:scale-110 group-hover/thumb:bg-rose-600 group-hover/thumb:border-rose-500 transition-all duration-300">
                  <Play
                    size={24}
                    fill="currentColor"
                    className="ml-1 opacity-90"
                  />
                </div>

                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md tracking-wider border border-white/5 shadow-sm">
                  VIDEO
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <BookOpen size={24} className="text-slate-300" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Lý thuyết
                </span>
              </div>
            )}
          </div>
        </div>

        {/* --- 2. RIGHT SIDE: CONTENT --- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* HEADER */}
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                  Bài học {index + 1}
                </span>
              </div>
              <h3
                className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer leading-tight mb-1"
                onClick={() => onEdit(lesson)}
                title={lesson.Title}
              >
                {lesson.Title}
              </h3>

              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {lesson.Description || (
                  <span className="italic text-slate-400 text-xs">
                    Chưa có mô tả cho bài học này.
                  </span>
                )}
              </p>
            </div>

            <Dropdown
              overlay={menu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                className="text-slate-400 hover:text-slate-600 -mr-2"
              >
                <MoreVertical size={20} />
              </Button>
            </Dropdown>
          </div>

          {/* RESOURCES AREA */}
          <div className="mt-auto">
            {(hasDocuments || hasExercises) && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3 mt-1">
                {/* SECTION: TÀI LIỆU */}
                {hasDocuments && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip size={12} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tài liệu tham khảo ({lesson.Documents.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {lesson.Documents.map((doc) => (
                        <AttachmentChip
                          key={doc.LessonMaterialId}
                          file={doc}
                          type="document"
                          onPreview={handlePreviewFile}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {hasDocuments && hasExercises && (
                  <div className="h-px bg-slate-200 w-full" />
                )}

                {/* SECTION: BÀI TẬP */}
                {hasExercises && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={12} className="text-orange-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Bài tập thực hành ({lesson.Exercises.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {lesson.Exercises.map((ex) => (
                        <AttachmentChip
                          key={ex.LessonMaterialId}
                          file={ex}
                          type="exercise"
                          onPreview={handlePreviewFile}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {isEmpty && (
              <div className="py-2 border-t border-dashed border-slate-200 mt-2">
                <span className="text-xs text-slate-400 italic flex items-center gap-1">
                  <AlertCircle size={12} /> Chưa có nội dung chi tiết (Video/Tài
                  liệu).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- VIDEO MODAL --- */}
      <Modal
        open={isVideoModalOpen}
        onCancel={() => setIsVideoModalOpen(false)}
        footer={null}
        centered
        width={900}
        destroyOnHidden
        title={
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-lg py-1">
            <Video size={20} className="text-rose-500" /> {lesson.Title}
          </div>
        }
      >
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          {lesson.VideoUrl ? (
            getYoutubeId(lesson.VideoUrl) ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYoutubeId(
                  lesson.VideoUrl
                )}?autoplay=1`}
                title="Video Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                className="w-full h-full object-contain"
                controls
                autoPlay
                src={lesson.VideoUrl}
              />
            )
          ) : (
            <div className="text-white">Không có video</div>
          )}
        </div>
      </Modal>

      {/* --- FILE PREVIEW MODAL --- */}
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
            height: "85vh", // Tăng chiều cao để xem thoải mái
            display: "flex",
            flexDirection: "column",
            padding: 0,
          },
        }}
        classNames={{ wrapper: "backdrop-blur-sm" }}
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
              <p className="text-xs text-slate-400">
                Chế độ xem trước •{" "}
                {previewFile?.Title.split(".").pop().toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              href={previewFile?.FileUrl}
              target="_blank"
              icon={<Download size={16} />}
              className="font-medium"
            >
              Tải xuống
            </Button>
            <Button
              type="text"
              icon={<X size={20} />}
              onClick={() => setPreviewFile(null)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50"
            />
          </div>
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

export default LessonItem;
