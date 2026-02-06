import React, { useState, forwardRef } from "react";
import { Tabs } from "antd";
import { Database, FileSignature, CalendarRange } from "lucide-react"; // Đổi icon cho hợp ngữ cảnh

// Import các Component con
import QuestionManager from "./Tabs/QuestionManager";
import ExamManager from "./Tabs/ExamManager";
import ExamDistribution from "./Tabs/ExamDistribution";

const QuestionBankContent = forwardRef(({ courseId }, ref) => {
  const [activeTab, setActiveTab] = useState("1");

  // Custom Label để tái sử dụng
  const TabLabel = ({ icon: Icon, title, subTitle }) => (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <Icon size={18} className="mb-0.5" />
      <div className="flex flex-col items-start leading-tight">
        <span className="font-semibold text-[15px]">{title}</span>
        {/* Nếu muốn thêm dòng mô tả nhỏ bên dưới thì uncomment dòng này */}
        {/* <span className="text-[10px] font-normal opacity-80">{subTitle}</span> */}
      </div>
    </div>
  );

  const items = [
    {
      key: "1",
      label: <TabLabel icon={Database} title="Ngân hàng câu hỏi" />,
      children: <QuestionManager courseId={courseId} ref={ref} />,
    },
    {
      key: "2",
      label: <TabLabel icon={FileSignature} title="Soạn đề kiểm tra" />,
      children: <ExamManager courseId={courseId} />,
    },
    {
      key: "3",
      label: (
        <TabLabel icon={CalendarRange} title="Phân phối & Lịch kiểm tra" />
      ),
      children: <ExamDistribution courseId={courseId} />,
    },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[750px] overflow-hidden flex flex-col">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          className="custom-modern-tabs h-full flex flex-col"
          renderTabBar={(props, DefaultTabBar) => (
            <div className="px-6 pt-2 border-b border-slate-100 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-10">
              <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
            </div>
          )}
        />
      </div>

      {/* CSS Tùy chỉnh để ghi đè style mặc định của Ant Design */}
      <style>{`
        .custom-modern-tabs .ant-tabs-nav::before {
          border-bottom: none !important; /* Xóa line xám mặc định của Antd */
        }
        
        .custom-modern-tabs .ant-tabs-tab {
          padding: 12px 0 12px 0 !important;
          margin: 0 32px 0 0 !important; /* Khoảng cách giữa các tab */
          transition: all 0.3s ease;
          color: #64748b; /* Màu text mặc định (Slate-500) */
        }

        .custom-modern-tabs .ant-tabs-tab:hover {
          color: #2563eb; /* Màu xanh khi hover */
        }

        .custom-modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563eb !important; /* Màu xanh thương hiệu (Blue-600) */
          text-shadow: 0 0 0.25px currentcolor; /* Làm đậm chữ một chút */
        }

        .custom-modern-tabs .ant-tabs-ink-bar {
          background: #2563eb !important; /* Màu thanh gạch chân */
          height: 3px !important;
          border-radius: 3px 3px 0 0;
        }

        /* Đảm bảo nội dung bên trong Tab full chiều cao */
        .custom-modern-tabs .ant-tabs-content-holder {
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .custom-modern-tabs .ant-tabs-content {
          height: 100%;
          flex: 1;
        }
        .custom-modern-tabs .ant-tabs-tabpane {
          height: 100%;
        }
      `}</style>
    </>
  );
});

export default QuestionBankContent;
