import React from "react";
import { Card, List, Avatar, Tag, Skeleton, Progress, Empty } from "antd";
import {
  MessageSquare,
  User,
  Clock,
  Calendar as CalendarIcon,
  Info,
  MapPin,
} from "lucide-react";
import dayjs from "dayjs";

const ClassOverview = ({ classInfo, notifications, loading }) => {
  if (loading || !classInfo)
    return (
      <div className="p-4">
        <Skeleton active />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 1. Thông tin lớp */}
      <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Lớp học */}
          <div className="w-full md:w-1/3 aspect-video bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <span className="text-5xl font-bold z-10">
              {classInfo.ClassName?.charAt(0)}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <Tag
                  color="blue"
                  className="mb-2 uppercase font-bold border-none bg-blue-50 text-blue-700"
                >
                  {classInfo.CourseName}
                </Tag>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Mã lớp: {classInfo.ClassCode || "N/A"}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 m-0 mb-4">
                {classInfo.ClassName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={16} />
                  </div>
                  <span>
                    GV: <strong>{classInfo.TeacherName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Clock size={16} />
                  </div>
                  <span>
                    {classInfo.Days} ({classInfo.StartTime?.slice(0, 5)} -{" "}
                    {classInfo.EndTime?.slice(0, 5)})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <MapPin size={16} />
                  </div>
                  <span>Phòng: {classInfo.RoomName}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500 font-medium">
                  Tiến độ khóa học
                </span>
                <span className="font-bold text-blue-600">45%</span>
              </div>
              <Progress
                percent={45}
                showInfo={false}
                strokeColor="#3b82f6"
                trailColor="#f1f5f9"
                size="small"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Thông báo lớp học */}
      <Card
        title={
          <span className="flex items-center gap-2 text-slate-700 font-bold">
            <MessageSquare size={20} className="text-blue-500" /> Thông báo lớp
            học
          </span>
        }
        className="shadow-sm border-gray-200 rounded-xl"
        headStyle={{ borderBottom: "1px solid #f1f5f9" }}
      >
        {notifications && notifications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item className="hover:bg-slate-50 transition-colors p-4 rounded-lg -mx-4">
                <List.Item.Meta
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Info size={20} />
                    </div>
                  }
                  title={
                    <span className="font-bold text-slate-700 text-base">
                      {item.Title}
                    </span>
                  }
                  description={
                    <div>
                      <p className="text-slate-600 mt-1 mb-2 leading-relaxed">
                        {item.Content}
                      </p>
                      <div className="text-xs text-slate-400 font-medium">
                        {dayjs(item.CreatedAt).format(
                          "DD tháng MM, YYYY • HH:mm"
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8">
            <Empty
              description="Chưa có thông báo nào từ giảng viên"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClassOverview;
