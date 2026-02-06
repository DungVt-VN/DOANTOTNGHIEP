import React from "react";
import { Breadcrumb, Button, Tag, Tabs } from "antd";
import { Link } from "react-router-dom";
import {
  BookOpen,
  MonitorPlay,
  CheckCircle,
  FileText,
  Trophy,
  MoreHorizontal,
  AlertCircle,
  User,
} from "lucide-react";
import getStatusColor from "@/js/getStatusInfo";



const ClassHeader = ({
  classInfo,
  stats,
  activeTab,
  setActiveTab,
  assignmentsCount,
  quizzesCount,
}) => {
  if (!classInfo) return null;

  // 2. Lấy thông tin màu sắc và nhãn hiển thị từ helper
  const statusMeta = getStatusColor(classInfo.Status);

  return (
    <div className="relative bg-white border-b border-gray-200">
      {/* Background Image */}
      <div className="absolute inset-0 h-64 overflow-hidden z-0">
        {classInfo.Image ? (
          <img
            src={classInfo.Image}
            alt=""
            className="w-full h-full object-cover opacity-10 blur-sm scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-6">
        {/* Breadcrumb - Giữ nguyên whitespace-nowrap */}
        <div className="overflow-x-auto no-scrollbar">
          <Breadcrumb
            items={[
              {
                title: (
                  <Link
                    to="/student/classes"
                    className="text-gray-500 hover:text-indigo-600 whitespace-nowrap"
                  >
                    Lớp học
                  </Link>
                ),
              },
              {
                title: (
                  <span className="font-semibold text-gray-800 whitespace-nowrap">
                    {classInfo.ClassName}
                  </span>
                ),
              },
            ]}
            className="mb-6"
          />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8">
          <div className="flex gap-6 items-center w-full md:w-auto">
            {/* Ảnh đại diện lớp */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-gray-200 shrink-0">
              {classInfo.Image ? (
                <img
                  src={classInfo.Image}
                  alt="Course"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                  <BookOpen size={32} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Tags Area */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Subject Tag */}
                <Tag
                  color="blue"
                  className="border-0 bg-blue-100 text-blue-700 font-bold m-0 flex items-center"
                >
                  {classInfo.Subject}
                </Tag>

                {/* Status Tag - Đã dùng helper */}
                <Tag
                  color={statusMeta.color} // Lấy màu từ helper
                  className="border-0 font-bold m-0 flex items-center"
                >
                  {statusMeta.label} {/* Lấy tên tiếng Việt từ helper */}
                </Tag>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                {classInfo.ClassName}
              </h1>

              <p className="text-gray-500 font-medium flex items-center gap-2 whitespace-nowrap">
                <User size={16} /> {classInfo.Teacher.Name}
              </p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <Button
              icon={<MoreHorizontal />}
              size="large"
              className="rounded-xl border-gray-300 flex items-center justify-center"
            />
            {!stats.IsPaid && (
              <Button
                type="primary"
                danger
                size="large"
                className="rounded-xl font-bold shadow-red-200 shadow-lg flex items-center gap-2"
              >
                <AlertCircle size={16} /> <span>Đóng học phí</span>
              </Button>
            )}
          </div>
        </div>

        {/* TABS - Giữ nguyên logic căn chỉnh Icon + Text và không xuống dòng */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs"
          size="large"
          items={[
            {
              key: "overview",
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <BookOpen size={18} />
                  <span>Tổng quan</span>
                </div>
              ),
            },
            {
              key: "learning",
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <MonitorPlay size={18} />
                  <span>Vào học</span>
                </div>
              ),
            },
            {
              key: "assignments",
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <CheckCircle size={18} />
                  <span>Bài tập ({assignmentsCount})</span>
                </div>
              ),
            },
            {
              key: "documents",
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <FileText size={18} />
                  <span>Tài liệu</span>
                </div>
              ),
            },
            {
              key: "quizzes",
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Trophy size={18} />
                  <span>Kiểm tra ({quizzesCount})</span>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ClassHeader;
