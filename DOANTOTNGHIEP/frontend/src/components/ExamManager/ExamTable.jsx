import React from "react";
import { Table, Button, Badge, Tooltip } from "antd";
import {
  FileText,
  Clock,
  Settings,
  ListChecks,
  Pencil,
  Trash2,
} from "lucide-react";

const ExamTable = ({
  dataSource,
  loading,
  onEdit,
  onSelectQuestions,
  onDelete,
}) => {
  const columns = [
    {
      title: "Tên đề thi",
      dataIndex: "Title",
      width: 300,
      render: (text, record) => (
        <div
          className="flex items-start gap-3 group cursor-pointer"
          onClick={() => onSelectQuestions(record)}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1 transition-colors group-hover:bg-blue-100">
            <FileText size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-700 text-base mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1">
              {text}
            </div>
            <div className="text-xs text-slate-400">{record.CreatedAt}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Cấu hình",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Clock size={14} className="text-slate-400" />
            <span>
              <span className="font-medium text-slate-800">
                {record.Duration} phút
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Settings size={14} className="text-slate-400" />
            <span>
              Đạt:{" "}
              <span className="font-medium text-slate-800">
                {record.PassScore}/10
              </span>
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Câu hỏi",
      dataIndex: "QuestionCount",
      width: 150,
      render: (count) => (
        <Badge count={count} showZero color={count > 0 ? "#3b82f6" : "#cbd5e1"}>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-sm font-medium flex items-center gap-2">
            <ListChecks size={16} />
            <span>câu</span>
          </div>
        </Badge>
      ),
    },
    {
      title: "Thao tác",
      width: 150,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end items-center gap-1">
          <Tooltip title="Soạn câu hỏi">
            <Button
              type="text"
              shape="circle"
              icon={<ListChecks size={18} />}
              className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"
              onClick={(e) => {
                e.stopPropagation();
                onSelectQuestions(record);
              }}
            />
          </Tooltip>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              shape="circle"
              icon={<Pencil size={17} />}
              className="text-amber-600 hover:bg-amber-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              type="text"
              shape="circle"
              icon={<Trash2 size={18} />}
              className=" text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.Id);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm flex-1 flex flex-col  relative">
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="Id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          position: ["bottomRight"],
          className: "pt-4",
        }}
        className="custom-exam-table flex-1"
      />
      <style>{`
        .custom-exam-table .ant-table-thead > tr > th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
        }
        .custom-exam-table .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default ExamTable;
