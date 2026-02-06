import React from "react";
import {
  ArrowLeft,
  Settings,
  Clock,
  BookOpen,
  Users,
  FileText,
} from "lucide-react";
import RefreshButton from "@/components/RefreshButton";

// --- COMPONENT TAB MỚI (Style: Modern Pill) ---
const TabItem = ({ id, label, icon, activeTab, setActiveTab }) => {
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out whitespace-nowrap
        ${
          isActive
            ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" // Style khi Active
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900" // Style khi Inactive
        }
      `}
    >
      {/* Icon: Đổi màu theo trạng thái cha */}
      {React.cloneElement(icon, {
        size: 18,
        className: `transition-colors duration-200 ${
          isActive
            ? "text-blue-600"
            : "text-slate-400 group-hover:text-slate-500"
        }`,
        strokeWidth: isActive ? 2.5 : 2,
      })}

      {/* Label */}
      <span>{label}</span>
    </button>
  );
};

const ClassHeader = ({
  classData,
  onBack,
  activeTab,
  setActiveTab,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
      {/* --- Top Bar --- */}
      <div className="px-6 py-4 flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="group p-2.5 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
          title="Quay lại"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
        </button>

        {/* Class Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
            {classData.CourseName}
          </span>
          <h1
            className="text-xl md:text-2xl font-bold text-slate-800 truncate leading-tight tracking-tight"
            title={classData.ClassName}
          >
            {classData.ClassName}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>

      {/* --- Bottom Bar: Tabs (Redesigned) --- */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <TabItem
            id="overview"
            label="Tổng quan"
            icon={<Clock />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabItem
            id="curriculum"
            label="Chương trình"
            icon={<BookOpen />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabItem
            id="students"
            label="Học viên"
            icon={<Users />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabItem
            id="assignments"
            label="Bài tập"
            icon={<FileText />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassHeader;
