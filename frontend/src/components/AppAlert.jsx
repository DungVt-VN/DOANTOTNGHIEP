import React from "react";
import { Modal } from "antd";
import { Trash2, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

const baseConfig = {
  centered: true,
  maskClosable: true,
  width: 420,
  okButtonProps: {
    className: "h-10 px-5 rounded-lg font-medium shadow-none",
  },
  cancelButtonProps: {
    className:
      "h-10 px-5 rounded-lg font-medium hover:bg-slate-50 hover:text-slate-700",
  },
};

export const AppAlert = {
  confirmDelete: ({
    title = "Xóa dữ liệu?",
    content = "Hành động này không thể hoàn tác.",
    onOk,
  }) => {
    Modal.confirm({
      ...baseConfig,
      title: (
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-slate-800">{title}</span>
        </div>
      ),
      icon: null,
      content: (
        <div className="flex flex-col gap-4 mt-1">
          <div className="flex justify-center mb-1">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse-slow">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={28} />
              </div>
            </div>
          </div>
          <div className="text-center text-slate-500 text-sm leading-relaxed px-4">
            {content}
          </div>
        </div>
      ),
      okText: "Xóa ngay",
      cancelText: "Hủy bỏ",
      okType: "danger",
      okButtonProps: {
        ...baseConfig.okButtonProps,
        className: `${baseConfig.okButtonProps.className} bg-red-600 hover:bg-red-400 `,
      },
      onOk,
    });
  },

  confirmAction: ({ title, content, onOk, okText = "Đồng ý" }) => {
    Modal.confirm({
      ...baseConfig,
      title: (
        <span className="text-lg font-semibold text-slate-800">{title}</span>
      ),
      icon: <HelpCircle className="text-blue-600 mr-2 mt-1" size={24} />,
      content: <div className="text-slate-500 mt-2">{content}</div>,
      okText: okText,
      cancelText: "Đóng",
      okButtonProps: {
        ...baseConfig.okButtonProps,
        className: `${baseConfig.okButtonProps.className} bg-blue-600 hover:bg-blue-500`,
      },
      onOk,
    });
  },

  warning: ({ title, content, onOk }) => {
    Modal.confirm({
      ...baseConfig,
      title: (
        <span className="text-lg font-semibold text-slate-800">{title}</span>
      ),
      icon: <AlertCircle className="text-amber-500 mr-2 mt-1" size={24} />,
      content: <div className="text-slate-500 mt-2">{content}</div>,
      okText: "Đã hiểu",
      cancelText: "Hủy",
      okButtonProps: {
        ...baseConfig.okButtonProps,
        className: `${baseConfig.okButtonProps.className} bg-amber-500 hover:bg-amber-400 border-none`,
      },
      onOk,
    });
  },
};
