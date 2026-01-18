import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  TimePicker,
  Button,
  message,
  Card,
  Divider,
  Tag,
} from "antd";
import {
  Save,
  ChevronLeft,
  CalendarDays,
  LayoutGrid,
  Coins,
} from "lucide-react";
import dayjs from "dayjs";
import api from "@/utils/axiosInstance";

const ClassEditInfo = ({
  editingClassId,
  form,
  onFinish,
  onCancel,
  initialValues,
  isEditMode,
  isViewMode = false,
}) => {
  const getTeacherLabel = (t) =>
    t.TeacherName || t.FullName || "Giáo viên hiện tại";
  const getRoomLabel = (r) => r.RoomName || "Phòng hiện tại";

  const [availableRooms, setAvailableRooms] = useState(() => {
    if ((isEditMode || isViewMode) && initialValues?.RoomId) {
      return [
        {
          RoomId: initialValues.RoomId,
          RoomName: getRoomLabel(initialValues),
          Capacity: initialValues.Capacity || 0,
          isCurrent: true,
          isBusy: false,
        },
      ];
    }
    return [];
  });

  const [availableTeachers, setAvailableTeachers] = useState(() => {
    if ((isEditMode || isViewMode) && initialValues?.TeacherId) {
      return [
        {
          TeacherId: initialValues.TeacherId,
          FullName: getTeacherLabel(initialValues),
          TeacherCode: initialValues.TeacherCode || "",
          isCurrent: true,
          isBusy: false,
        },
      ];
    }
    return [];
  });

  const [checkingSchedule, setCheckingSchedule] = useState(false);
  const isFirstLoad = useRef(true);
  const isPriceInitialized = useRef(false);
  const startDate = Form.useWatch("StartDate", form);
  const endDate = Form.useWatch("EndDate", form);
  const selectedDays = Form.useWatch("Days", form);
  const timeRange = Form.useWatch("TimeRange", form);
  const tuitionFee = Form.useWatch("TuitionFee", form);
  const totalSessions = Form.useWatch("TotalSessions", form);

  const calculateSessionsCount = (startStr, endStr, daysInput) => {
    if (!startStr || !endStr || !daysInput || daysInput.length === 0) return 0;
    const start = dayjs(startStr);
    const end = dayjs(endStr);
    if (end.isBefore(start)) return 0;

    let daysArr = Array.isArray(daysInput) ? daysInput : daysInput.split(",");
    const targetDayIndexes = daysArr.map((d) =>
      parseInt(d) === 8 ? 0 : parseInt(d) - 1
    );

    let count = 0;
    let current = start.clone();
    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (targetDayIndexes.includes(current.day())) count++;
      current = current.add(1, "day");
    }
    return count;
  };

  useEffect(() => {
    if (
      (isEditMode || isViewMode) &&
      initialValues &&
      !isPriceInitialized.current
    ) {
      const { StartDate, EndDate, Days, TuitionFee } = initialValues;
      const sessions = calculateSessionsCount(StartDate, EndDate, Days);
      if (sessions > 0) {
        form.setFieldsValue({
          TotalSessions: sessions,
          FeePerSession: Math.round(Number(TuitionFee) / sessions),
        });
        isPriceInitialized.current = true;
      }
    }
  }, [initialValues, isEditMode, isViewMode, form]);

  // --- AUTO CALC ---
  useEffect(() => {
    if (!startDate || !endDate || !selectedDays) return;
    const count = calculateSessionsCount(startDate, endDate, selectedDays);
    if (count !== totalSessions) form.setFieldValue("TotalSessions", count);
  }, [startDate, endDate, selectedDays, form, totalSessions]);

  useEffect(() => {
    if (isViewMode) return;
    const sessions = totalSessions || 0;
    const total = tuitionFee || 0;
    if (sessions > 0) {
      form.setFieldValue("FeePerSession", Math.round(total / sessions));
    } else {
      form.setFieldValue("FeePerSession", 0);
    }
  }, [totalSessions, tuitionFee, isViewMode, form]);

  useEffect(() => {
    if (isViewMode) return;
    if (
      startDate &&
      endDate &&
      selectedDays?.length > 0 &&
      timeRange?.length === 2
    ) {
      const checkSchedule = async () => {
        setCheckingSchedule(true);
        try {
          const excludeId = editingClassId;
          const payload = {
            startDate: dayjs(startDate).format("YYYY-MM-DD"),
            endDate: dayjs(endDate).format("YYYY-MM-DD"),
            days: selectedDays,
            startTime: dayjs(timeRange[0]).format("HH:mm:ss"),
            endTime: dayjs(timeRange[1]).format("HH:mm:ss"),
            excludeClassId: excludeId,
          };

          const res = await api.post("/classes/check-schedule", payload);
          let fetchedTeachers = res.data.teachers || [];
          let fetchedRooms = res.data.rooms || [];

          // === MERGE GIÁO VIÊN ===
          // Tìm giáo viên hiện tại trong list trả về
          if (isEditMode && initialValues?.TeacherId) {
            const existIndex = fetchedTeachers.findIndex(
              (t) => t.TeacherId === initialValues.TeacherId
            );

            if (existIndex !== -1) {
              fetchedTeachers[existIndex].isCurrent = true;
            } else {
              fetchedTeachers.unshift({
                TeacherId: initialValues.TeacherId,
                FullName: getTeacherLabel(initialValues),
                TeacherCode: initialValues.TeacherCode,
                isCurrent: true,
                isBusy: false,
              });
            }
          }
          setAvailableTeachers(fetchedTeachers);

          // === MERGE PHÒNG ===
          if (isEditMode && initialValues?.RoomId) {
            const existIndex = fetchedRooms.findIndex(
              (r) => r.RoomId === initialValues.RoomId
            );
            if (existIndex !== -1) {
              fetchedRooms[existIndex].isCurrent = true;
            } else {
              fetchedRooms.unshift({
                RoomId: initialValues.RoomId,
                RoomName: getRoomLabel(initialValues),
                Capacity: initialValues.Capacity,
                isCurrent: true,
                isBusy: false,
              });
            }
          }
          setAvailableRooms(fetchedRooms);

          if (!isFirstLoad.current) {
            const curTeacher = fetchedTeachers.find(
              (t) => t.TeacherId === form.getFieldValue("TeacherId")
            );
            if (curTeacher?.isBusy) {
              message.warning(
                `Giáo viên ${curTeacher.FullName} đang bận dạy lớp KHÁC!`
              );
            }

            const curRoom = fetchedRooms.find(
              (r) => r.RoomId === form.getFieldValue("RoomId")
            );
            if (curRoom?.isBusy) {
              message.warning(
                `Phòng ${curRoom.RoomName} đang có lớp KHÁC học!`
              );
            }
          }
          isFirstLoad.current = false;
        } catch (error) {
          console.error(error);
        } finally {
          setCheckingSchedule(false);
        }
      };

      const timeoutId = setTimeout(checkSchedule, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    startDate,
    endDate,
    selectedDays,
    timeRange,
    initialValues,
    isEditMode,
    isViewMode,
    form,
  ]);

  // --- SUBMIT HANDLER ---
  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        // Validate lại lần cuối
        const selTeacher = availableTeachers.find(
          (t) => t.TeacherId === values.TeacherId
        );
        if (selTeacher?.isBusy) {
          message.error(
            `Giáo viên ${selTeacher.FullName} bị trùng lịch với lớp khác!`
          );
          return;
        }

        const selRoom = availableRooms.find((r) => r.RoomId === values.RoomId);
        if (selRoom?.isBusy) {
          message.error(
            `Phòng ${selRoom.RoomName} bị trùng lịch với lớp khác!`
          );
          return;
        }

        onFinish(values);
      })
      .catch((err) => console.log("Validate Failed:", err));
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  const maxStudents = Form.useWatch("MaxStudents", form);
  return (
    <div className="animate-in fade-in zoom-in-95 duration-200">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3 bg-white px-4 pt-3 rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            onClick={onCancel}
            type="text"
            icon={<ChevronLeft size={22} />}
          />
          <h4 className="font-bold text-xl text-gray-800 m-0">
            {isViewMode
              ? "Chi tiết lớp học"
              : isEditMode
              ? "Cập nhật lớp học"
              : "Tạo lớp học mới"}
          </h4>
        </div>
        {!isViewMode && (
          <div className="flex gap-2">
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSave}
              icon={<Save size={18} />}
              loading={checkingSchedule}
              className="bg-blue-600"
            >
              {isEditMode ? "Lưu thay đổi" : "Lưu lớp học"}
            </Button>
          </div>
        )}
      </div>

      <Form
        layout="vertical"
        form={form}
        initialValues={initialValues}
        disabled={isViewMode}
        className="px-2 pb-4"
      >
        <Row gutter={24}>
          <Col span={24} lg={16}>
            <Card
              bordered={false}
              className="shadow-sm mb-4"
              title={
                <div className="flex gap-2 text-blue-700">
                  <LayoutGrid size={18} />
                  <span>Thông tin chung</span>
                </div>
              }
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ClassName"
                    label="Tên lớp học"
                    rules={[{ required: true, message: "Nhập tên lớp" }]}
                  >
                    <Input size="large" placeholder="VD: Toán Lớp 10" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="RoomId"
                    label="Phòng học"
                    help={
                      !timeRange && !isViewMode ? (
                        <span className="text-xs text-orange-500">
                          * Chọn giờ để xem phòng trống
                        </span>
                      ) : null
                    }
                  >
                    <Select
                      size="large"
                      placeholder="Chọn phòng học"
                      loading={checkingSchedule}
                      disabled={(!timeRange || !selectedDays) && !isViewMode}
                      optionFilterProp="label"
                      optionLabelProp="label"
                    >
                      {availableRooms.map((room) => {
                        // Kiểm tra logic quá tải: Sĩ số nhập > Sức chứa phòng
                        const isOverCapacity = maxStudents > room.Capacity;

                        // Điều kiện disable: Phòng bận HOẶC Quá tải (nếu không phải chế độ xem)
                        const isDisabled =
                          !isViewMode && (room.isBusy || isOverCapacity);

                        return (
                          <Select.Option
                            key={room.RoomId}
                            value={room.RoomId}
                            label={room.RoomName}
                            disabled={isDisabled}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span>
                                {room.RoomName} - {room.Capacity} chỗ
                              </span>

                              {/* Hiển thị Tag trạng thái */}
                              <div className="flex gap-1">
                                {room.isBusy && <Tag color="red">Bận</Tag>}

                                {!room.isBusy && isOverCapacity && (
                                  <Tag color="orange">Không đủ chỗ</Tag>
                                )}

                                {!room.isBusy &&
                                  !isOverCapacity &&
                                  room.isCurrent && (
                                    <Tag color="blue">Hiện tại</Tag>
                                  )}
                              </div>
                            </div>
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="MaxStudents"
                    label="Sĩ số tối đa"
                    initialValue={30}
                    rules={[
                      { required: true },
                      { type: "number", min: 1, max: 200 },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={200}
                      style={{ width: "100%" }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Card 2: Lịch & Giáo viên */}
            <Card
              bordered={false}
              className="shadow-sm"
              title={
                <div className="flex gap-2 text-blue-700">
                  <CalendarDays size={18} />
                  <span>Lịch học & Phân công</span>
                </div>
              }
            >
              <div className="bg-blue-50/50 p-4 rounded-lg mb-4 border border-blue-100">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="StartDate"
                      label="Ngày bắt đầu"
                      rules={[{ required: true }]}
                      className="mb-0"
                    >
                      <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="EndDate"
                      label="Ngày kết thúc"
                      rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (
                              !value ||
                              !getFieldValue("StartDate") ||
                              value.isAfter(getFieldValue("StartDate"))
                            )
                              return Promise.resolve();
                            return Promise.reject(
                              new Error("Ngày kết thúc phải sau ngày bắt đầu!")
                            );
                          },
                        }),
                      ]}
                      className="mb-0"
                    >
                      <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="Days"
                    label="Thứ trong tuần"
                    rules={[{ required: true, message: "Chọn thứ" }]}
                  >
                    <Select mode="multiple" maxTagCount="responsive">
                      {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                        <Select.Option key={d} value={String(d)}>
                          {d === 8 ? "Chủ Nhật" : `Thứ ${d}`}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="TimeRange"
                    label="Khung giờ"
                    rules={[{ required: true, message: "Chọn giờ" }]}
                  >
                    <TimePicker.RangePicker
                      className="w-full"
                      format="HH:mm"
                      minuteStep={15}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider dashed className="my-2" />

              <Form.Item
                name="TeacherId"
                label="Giáo viên phụ trách"
                rules={[{ required: true, message: "Chọn giáo viên" }]}
              >
                <Select
                  size="large"
                  placeholder="Chọn giáo viên"
                  showSearch
                  allowClear
                  loading={checkingSchedule}
                  disabled={(!timeRange || !selectedDays) && !isViewMode}
                  filterOption={filterOption}
                  optionLabelProp="label"
                >
                  {availableTeachers.map((t) => (
                    <Select.Option
                      key={t.TeacherId}
                      value={t.TeacherId}
                      label={`${t.FullName} (${t.TeacherCode})`}
                      disabled={!isViewMode && t.isBusy}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span>
                          {t.FullName} <small>({t.TeacherCode})</small>
                        </span>
                        {t.isBusy && <Tag color="red">Bận</Tag>}
                        {!t.isBusy && t.isCurrent && (
                          <Tag color="blue">Hiện tại</Tag>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* CỘT PHẢI (SIDEBAR) */}
          <Col span={24} lg={8}>
            <Card
              bordered={false}
              className="shadow-sm mb-4"
              title="Trạng thái"
              size="small"
            >
              <Form.Item name="Status" className="mb-0">
                <Select size="large">
                  <Select.Option value="Recruiting">
                    <Tag color="cyan">Đang tuyển sinh</Tag>
                  </Select.Option>
                  <Select.Option value="Upcoming">
                    <Tag color="blue">Sắp mở</Tag>
                  </Select.Option>
                  <Select.Option value="Active">
                    <Tag color="green">Đang hoạt động</Tag>
                  </Select.Option>
                  <Select.Option value="Finished">
                    <Tag color="default">Đã kết thúc</Tag>
                  </Select.Option>
                  <Select.Option value="Cancelled">
                    <Tag color="red">Đã hủy</Tag>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Card>

            <Card
              bordered={false}
              className="shadow-sm border-t-4 border-t-orange-400"
              title={
                <div className="flex gap-2 text-orange-600">
                  <Coins size={18} />
                  <span>Cấu hình Học phí</span>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-bold mb-1">
                    Tổng học phí toàn khóa
                  </div>
                  <Form.Item
                    name="TuitionFee"
                    rules={[{ required: true, message: "Nhập học phí" }]}
                  >
                    <InputNumber
                      className="w-full text-xl font-bold text-red-600"
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                      style={{ width: "100%" }}
                      placeholder="Nhập tổng tiền"
                      addonAfter="VNĐ"
                      min={0}
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                  <span className="text-gray-500 text-sm">
                    Số buổi dự kiến:
                  </span>
                  <Form.Item name="TotalSessions" noStyle>
                    <InputNumber
                      bordered={false}
                      readOnly
                      className="w-16 text-right font-bold bg-transparent"
                    />
                  </Form.Item>
                </div>

                <Divider className="my-2" />

                <Form.Item
                  name="FeePerSession"
                  label="Đơn giá / 1 buổi (Tự động)"
                  className="mb-0"
                >
                  <InputNumber
                    className="w-full bg-gray-100"
                    readOnly
                    addonAfter="VNĐ"
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                </Form.Item>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ClassEditInfo;
