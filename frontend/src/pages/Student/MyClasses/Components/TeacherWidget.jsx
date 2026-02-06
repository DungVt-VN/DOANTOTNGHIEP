import React from "react";
import { Avatar, Button, Progress } from "antd";
import { User, Mail, Phone, Trophy, PlayCircle } from "lucide-react";

const TeacherWidget = ({ teacher, stats, onContinueLearning }) => {
  return (
    <div className="space-y-6">
      {/* Teacher Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            src={teacher?.Avatar}
            size={64}
            icon={<User />}
            className="bg-indigo-50 text-indigo-500 border border-indigo-100 shrink-0"
          />
          <div className="overflow-hidden">
            <h3 className="font-bold text-gray-800 text-lg truncate">
              {teacher?.Name || "Giảng viên"}
            </h3>
            <p className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Giảng viên chính
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail size={16} className="text-gray-400" />
            <span className="truncate">
              {teacher?.Email || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone size={16} className="text-gray-400" />
            <span>{teacher?.Phone || "Chưa cập nhật"}</span>
          </div>
        </div>

        {teacher?.Bio && (
          <div className="bg-gray-50 p-3 rounded-xl mb-6 text-sm text-gray-600 italic border border-gray-100">
            "{teacher.Bio}"
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="primary"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-medium h-9 shadow-sm shadow-indigo-200"
          >
            Nhắn tin
          </Button>
          <Button className="flex-1 h-9">Hồ sơ</Button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-100 text-xs uppercase font-bold mb-1">
              Tiến độ tổng quan
            </p>
            <h3 className="text-3xl font-extrabold">
              {stats.LearningProgress}%
            </h3>
          </div>
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Trophy className="text-yellow-300" size={20} />
          </div>
        </div>
        <Progress
          percent={stats.LearningProgress}
          showInfo={false}
          strokeColor="#ffffff"
          trailColor="rgba(255,255,255,0.2)"
          size="small"
          className="mb-4"
        />
        <Button
          onClick={onContinueLearning}
          className="w-full bg-white text-indigo-700 border-none font-bold hover:bg-indigo-50 flex items-center justify-center gap-2 h-10 rounded-xl"
        >
          <PlayCircle size={18} /> Tiếp tục học
        </Button>
      </div>
    </div>
  );
};

export default TeacherWidget;
