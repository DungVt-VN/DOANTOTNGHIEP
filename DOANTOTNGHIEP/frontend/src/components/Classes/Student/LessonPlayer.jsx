import React from "react";
import ReactPlayer from "react-player";
import { Button } from "antd";
import { PlayCircle, FileText, Download } from "lucide-react";

const LessonPlayer = ({ lesson }) => {
  if (!lesson) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300 text-slate-400">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <PlayCircle size={40} className="opacity-50" />
        </div>
        <p className="font-medium">Chọn một bài học từ danh sách để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player Wrapper */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
        {lesson.VideoUrl ? (
          <ReactPlayer
            url={lesson.VideoUrl}
            width="100%"
            height="100%"
            controls
            config={{ file: { attributes: { controlsList: "nodownload" } } }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-slate-100">
            <PlayCircle size={48} className="mb-2 opacity-50" />
            <p>Bài học này không có video</p>
          </div>
        )}
      </div>

      {/* Lesson Info */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            {lesson.Title}
          </h1>
          <div className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
            {lesson.Description || "Không có mô tả chi tiết cho bài học này."}
          </div>
        </div>

        {/* Materials Section */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <FileText size={18} className="text-blue-600" /> Tài liệu bài học
          </h3>

          {/* Mock Materials List (Cần API trả về materials) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group bg-white"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-red-50 text-red-500 p-2 rounded-lg border border-red-100">
                    <FileText size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium text-slate-700 text-sm">
                      Tai_lieu_tham_khao_bai_{i}.pdf
                    </span>
                    <span className="text-xs text-slate-400">PDF • 2.4 MB</span>
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<Download size={16} />}
                  className="text-slate-400 hover:text-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
