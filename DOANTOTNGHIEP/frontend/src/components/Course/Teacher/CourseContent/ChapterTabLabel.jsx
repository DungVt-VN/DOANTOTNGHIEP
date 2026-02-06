import React from "react";
import { Tag } from "antd";

const ChapterTabLabel = ({ chapter, index }) => {
  return (
    <div className="text-left w-52 py-1">
      <div className="flex items-center gap-2 mb-1">
        <Tag
          color="blue"
          className="mr-0 font-bold border-none bg-blue-50 text-blue-700"
        >
          CHƯƠNG {chapter.OrderIndex || index + 1}
        </Tag>
      </div>
      <span
        className="text-slate-700 font-semibold block truncate text-sm"
        title={chapter.Title}
      >
        {chapter.Title}
      </span>
    </div>
  );
};

export default ChapterTabLabel;