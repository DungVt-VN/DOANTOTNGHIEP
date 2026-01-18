import React from "react";
import { Card, Row, Col, Select } from "antd";
import { filterOption } from "@/utils/scheduleUtils";

const FilterBar = ({
  teachers = [],
  rooms = [],
  loading,
  onTeacherChange,
  onRoomChange,
}) => {
  return (
    <Card
      variant="borderless"
      className="mb-0 rounded-none shadow-sm border-b border-gray-100 sticky top-[60px] z-10" // Sticky filter
    >
      <Row gutter={[16, 16]}>
        <Col span={24} md={8}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Giáo viên
            </span>
            <Select
              className="w-full"
              placeholder="Tất cả giáo viên"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              loading={loading}
              onChange={onTeacherChange}
              options={teachers
                .filter((t) => t.TeacherId)
                .map((t) => ({ label: t.FullName, value: t.TeacherId }))}
            />
          </div>
        </Col>
        <Col span={24} md={8}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Phòng học
            </span>
            <Select
              className="w-full"
              placeholder="Tất cả phòng"
              allowClear
              showSearch
              filterOption={filterOption}
              loading={loading}
              onChange={onRoomChange}
              options={rooms
                .filter((r) => r.RoomId)
                .map((r) => ({ label: r.RoomName, value: r.RoomId }))}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default FilterBar;
