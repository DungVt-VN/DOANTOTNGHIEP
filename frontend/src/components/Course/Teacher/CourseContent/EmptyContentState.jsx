import React from "react";
import { Button, Empty } from "antd";
import { Plus } from "lucide-react";
import ChapterModal from "@/components/Course/Teacher/CuriculumModal/ChapterModal";

const EmptyContentState = ({
  onCreateFirstChapter,
  modalProps, // Props truyền xuống modal
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
      <Empty
        description={
          <span className="text-slate-500 text-base">
            Khóa học này chưa có chương trình học nào.
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
      <Button
        type="primary"
        size="large"
        className="mt-6 bg-blue-600 hover:bg-blue-700 shadow-md"
        icon={<Plus size={18} />}
        onClick={onCreateFirstChapter}
      >
        Tạo chương đầu tiên
      </Button>

      {/* Render Modal ở đây để đảm bảo logic hoạt động */}
      <ChapterModal {...modalProps} />
    </div>
  );
};

export default EmptyContentState;
