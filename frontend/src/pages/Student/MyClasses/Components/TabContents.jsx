import React, { useState } from "react";
import { Empty, Modal, Tooltip } from "antd";
import {
  FileText,
  Download,
  Trophy,
  Clock,
  Eye,
  Calendar,
  File,
} from "lucide-react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// =========================================================
// 1. DOCUMENT LIST (Dạng List + Preview Modal)
// =========================================================
export const DocumentList = ({ documents }) => {
  const [previewDoc, setPreviewDoc] = useState(null);

  // Xử lý mở preview
  const handlePreview = (doc) => {
    setPreviewDoc(doc);
  };

  // Xử lý download (chặn sự kiện click vào dòng)
  const handleDownload = (e, url) => {
    e.stopPropagation();
    window.open(url, "_blank");
  };

  if (!documents || documents.length === 0)
    return <Empty description="Chưa có tài liệu nào" />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4 flex justify-between items-center">
        <span>Tài liệu học tập</span>
        <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
          {documents.length} files
        </span>
      </h3>

      {/* --- LIST VIEW --- */}
      <div className="flex flex-col border border-gray-100 rounded-xl overflow-hidden">
        {/* Header Row (Desktop) */}
        <div className="hidden md:flex items-center bg-gray-50 p-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <div className="flex-1 pl-14">Tên tài liệu</div>
          <div className="w-32">Ngày tạo</div>
          <div className="w-24 text-center">Định dạng</div>
          <div className="w-20 text-right pr-2">Thao tác</div>
        </div>

        {/* Items */}
        {documents.map((doc, idx) => (
          <div
            key={idx}
            onClick={() => handlePreview(doc)}
            className="group flex items-center p-3 border-b last:border-0 border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mr-4">
              <FileText size={20} />
            </div>

            {/* Name + Date (Mobile) */}
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-semibold text-gray-700 text-sm truncate group-hover:text-blue-600 transition-colors mb-0.5">
                {doc.Title}
              </h4>
              <div className="md:hidden text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={10} />
                {doc.CreatedAt
                  ? new Date(doc.CreatedAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </div>
            </div>

            {/* Date (Desktop) */}
            <div className="w-32 hidden md:flex text-sm text-gray-500 items-center gap-2">
              {doc.CreatedAt
                ? new Date(doc.CreatedAt).toLocaleDateString("vi-VN")
                : "N/A"}
            </div>

            {/* Type */}
            <div className="w-24 flex justify-center">
              <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded-md group-hover:bg-white group-hover:shadow-sm">
                {doc.FileType || "FILE"}
              </span>
            </div>

            {/* Actions */}
            <div className="w-20 flex items-center justify-end gap-1">
              <Tooltip title="Xem trước ">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all">
                  <Eye size={18} />
                </button>
              </Tooltip>

              <Tooltip title="Tải xuống ">
                <button
                  onClick={(e) => handleDownload(e, doc.FileUrl)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-full transition-all"
                >
                  <Download size={18} />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {/* --- PREVIEW MODAL --- */}
      <Modal
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        footer={null}
        width={1000}
        centered
        title={
          <div className="flex items-center gap-2 pr-8 max-w-full">
            <FileText size={18} className="text-blue-600 shrink-0" />
            <span className="truncate">{previewDoc?.Title}</span>
          </div>
        }
        styles={{ body: { height: "80vh", padding: 0 } }}
      >
        {previewDoc && (
          <div className="h-full w-full bg-gray-50 rounded-b-lg overflow-hidden">
            <DocViewer
              documents={[
                { uri: previewDoc.FileUrl, fileType: previewDoc.FileType },
              ]}
              pluginRenderers={DocViewerRenderers}
              style={{ height: "100%" }}
              config={{
                header: {
                  disableHeader: true,
                  disableFileName: true,
                  retainURLParams: false,
                },
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
