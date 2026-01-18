import React, { useState } from "react";
import { Table, Tag, Space, Tooltip, Button, Input } from "antd"; // Thêm Input
import { Plus, Trash2, Eye, Edit, LayoutDashboard, Search } from "lucide-react"; // Thêm Search icon
import { removeVietnameseTones } from "@/js/Helper";

const ClassList = ({
  classes,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onViewInfo,
  onEnterDetail,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredClasses = classes?.filter((item) => {
    if (!searchText) return true;

    const keyword = removeVietnameseTones(searchText);
    const className = removeVietnameseTones(item.ClassName || "");
    const teacherName = removeVietnameseTones(item.FullName || "");
    const roomName = removeVietnameseTones(item.RoomName || "");

    return (
      className.includes(keyword) ||
      teacherName.includes(keyword) ||
      roomName.includes(keyword)
    );
  });

  const renderStatusTag = (status) => {
    const map = {
      Recruiting: { color: "cyan", text: "Đang tuyển sinh" },
      Upcoming: { color: "orange", text: "Sắp mở" },
      Active: { color: "blue", text: "Đang hoạt động" },
      Finished: { color: "green", text: "Đã kết thúc" },
      Cancelled: { color: "red", text: "Đã hủy" },
    };
    const s = map[status] || { color: "default", text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const renderSchedule = (_, record) => {
    const days = record.Days ? record.Days.replace(/,/g, ", T") : "";
    const time = record.StartTime
      ? `${record.StartTime?.slice(0, 5)} - ${record.EndTime?.slice(0, 5)}`
      : "";
    if (!days && !time)
      return <span className="text-gray-400">Chưa xếp lịch</span>;
    return (
      <div className="flex flex-col text-xs">
        {days && (
          <span className="font-semibold text-blue-700">Thứ {days}</span>
        )}
        {time && <span className="text-gray-600">{time}</span>}
      </div>
    );
  };

  const formatCurrency = (val) =>
    val ? `${new Intl.NumberFormat("vi-VN").format(val)} đ` : "0 đ";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header + Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h3 className="font-semibold text-gray-700 text-lg">
            Danh sách các lớp hiện có
          </h3>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* 4. Input Tìm kiếm */}
          <Input
            placeholder="Tìm tên lớp, giáo viên..."
            prefix={<Search size={16} className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-full md:w-64"
          />

          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={onAdd}
            className="bg-blue-600"
          >
            Mở lớp mới
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredClasses} // Sử dụng danh sách đã lọc
        rowKey="ClassId"
        loading={loading}
        pagination={{ pageSize: 5 }}
        size="middle"
        bordered
        scroll={{ x: 800 }}
      >
        <Table.Column
          title="Tên Lớp"
          dataIndex="ClassName"
          render={(text, r) => (
            <a
              onClick={() => onViewInfo(r)}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              {text}
            </a>
          )}
        />
        <Table.Column title="Lịch học" render={renderSchedule} />
        <Table.Column
          title="Giáo viên"
          dataIndex="FullName"
          render={(t) => t || <i className="text-gray-400">Chưa phân công</i>}
        />
        <Table.Column
          title="Phòng"
          dataIndex="RoomName"
          width={100}
          align="center"
          render={(t) => t || "--"}
        />
        <Table.Column
          title="Học phí"
          dataIndex="TuitionFee"
          align="right"
          render={formatCurrency}
        />
        <Table.Column
          title="Trạng thái"
          dataIndex="Status"
          align="center"
          render={renderStatusTag}
        />
        <Table.Column
          title="Thao tác"
          align="center"
          width={180}
          render={(_, record) => (
            <Space size={4}>
              <Tooltip title="Quản lý học viên trong lớp">
                <Button
                  size="small"
                  type="text"
                  className="text-emerald-600"
                  onClick={() => onEnterDetail(record)}
                  icon={<LayoutDashboard size={18} />}
                />
              </Tooltip>

              <Tooltip title="Xem thông tin lớp">
                <Button
                  size="small"
                  type="text"
                  className="text-blue-600"
                  onClick={() => onViewInfo(record)}
                  icon={<Eye size={18} />}
                />
              </Tooltip>
              <Tooltip title="Sửa">
                <Button
                  size="small"
                  type="text"
                  className="text-orange-600"
                  onClick={() => onEdit(record)}
                  icon={<Edit size={18} />}
                />
              </Tooltip>
              <Tooltip title="Xóa">
                <Button
                  size="small"
                  type="text"
                  className="text-red-600"
                  onClick={() => onDelete(record)}
                  icon={<Trash2 size={18} />}
                />
              </Tooltip>
            </Space>
          )}
        />
      </Table>
    </div>
  );
};

export default ClassList;
