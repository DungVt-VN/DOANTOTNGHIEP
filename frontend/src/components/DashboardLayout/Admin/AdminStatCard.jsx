import React from "react";

const AdminStatCard = ({ title, value, icon, color }) => {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm flex items-center justify-between ${color}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
    </div>
  );
};

export default AdminStatCard;
