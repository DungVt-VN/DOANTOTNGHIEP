import React from "react";
import { Card, Statistic } from "antd";
import { TrendingUp, TrendingDown } from "lucide-react";

const AdminStatCard = ({ title, value, icon, colorClass, trend, loading }) => {
  // colorClass ví dụ: "bg-blue-50 text-blue-600"

  return (
    <Card
      bordered={false}
      loading={loading}
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 font-medium text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 m-0">{value}</h3>

          {/* Phần hiển thị xu hướng tăng giảm */}
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs mt-2 font-medium ${
                trend > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{Math.abs(trend)}% so với tháng trước</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${colorClass}`}>{icon}</div>
      </div>
    </Card>
  );
};

export default AdminStatCard;
