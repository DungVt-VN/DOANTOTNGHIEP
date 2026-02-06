import React from "react";
import { Empty, Typography, Divider, Tag } from "antd";
import { PlayCircle, FileText, Info, Clock } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

const LessonPlayer = ({ lesson }) => {
  // Nếu chưa chọn bài học hoặc bài học không tồn tại
  if (!lesson) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-white p-8">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-slate-400">Chọn một bài học để bắt đầu</span>
          }
        />
      </div>
    );
  }

  // Kiểm tra xem bài học có video hay không
  const hasVideo = lesson.VideoUrl && lesson.VideoUrl !== "ddd" && lesson.VideoUrl !== "";

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto custom-scrollbar">
      {/* --- PHẦN 1: VIDEO AREA --- */}
      <div className="w-full bg-black aspect-video flex items-center justify-center shadow-inner relative group">
        {hasVideo ? (
          <video
            key={lesson.LessonId} // Force re-render khi đổi bài học
            controls
            className="w-full h-full max-h-[70vh] object-contain"
            controlsList="nodownload"
            poster={lesson.Thumbnail || ""} // Có thể thêm thumbnail nếu có
          >
            <source src={lesson.VideoUrl} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ xem video.
          </video>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="p-6 bg-slate-800 rounded-full text-slate-600">
               <MonitorPlay size={48} />
            </div>
            <p className="font-medium">Bài học này không có nội dung video</p>
          </div>
        )}
      </div>

      {/* --- PHẦN 2: LESSON INFO --- */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
               <Tag color="blue" className="border-none bg-blue-50 text-blue-600 font-semibold px-2">
                  Lesson {lesson.LessonId}
               </Tag>
               {lesson.IsCompleted && (
                 <Tag color="green" className="border-none bg-green-50 text-green-600 font-semibold px-2">
                   Đã hoàn thành
                 </Tag>
               )}
            </div>
            <Title level={3} className="!mb-2 !text-slate-800 !font-extrabold">
              {lesson.Title}
            </Title>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1">
                    <Clock size={14} /> Thời lượng: {lesson.Duration || "00:00"}
                </span>
                <span className="flex items-center gap-1 text-indigo-500 font-medium">
                    <PlayCircle size={14} /> {lesson.Type === 'video' ? 'Bài học Video' : 'Tài liệu đọc'}
                </span>
            </div>
          </div>
        </div>

        <Divider className="my-6 border-slate-100" />

        {/* Description Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Info size={18} className="text-indigo-600" />
            <span>Mô tả bài học</span>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            {lesson.Description ? (
              <Paragraph className="text-slate-600 leading-relaxed !mb-0">
                {lesson.Description}
              </Paragraph>
            ) : (
              <Text type="secondary" italic>
                Chưa có mô tả chi tiết cho bài học này.
              </Text>
            )}
          </div>
        </div>

        {/* Materials Quick Link (Nếu có) */}
        {lesson.Materials && lesson.Materials.length > 0 && (
            <div className="mt-8">
                <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                    <FileText size={18} className="text-orange-500" />
                    <span>Tài liệu đính kèm ({lesson.Materials.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lesson.Materials.map((mat) => (
                        <div 
                            key={mat.LessonMaterialId}
                            onClick={() => window.open(mat.FileUrl, "_blank")}
                            className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer group"
                        >
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-700 truncate mb-0">
                                    {mat.Title}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">
                                    {mat.Category}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlayer;