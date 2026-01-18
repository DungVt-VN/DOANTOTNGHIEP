import React, { useEffect, useState } from "react";
import { Modal, Form, message, Divider, Button } from "antd";
import { ChevronLeft } from "lucide-react"; // Đã bỏ icon Users
import api from "@/utils/axiosInstance";
import dayjs from "dayjs";

import ClassList from "./ClassList";
import ClassEditInfo from "./ClassEditInfo";
import ClassInfo from "./ClassInfo";
import AdminClassDetailView from "./AdminClassDetailView";

const AdminClassManagementModal = ({ open, course, onCancel }) => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [classForm] = Form.useForm();
  const [viewMode, setViewMode] = useState("list");
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);

  useEffect(() => {
    if (open && course) {
      fetchClasses();
      fetchTeachers();
      fetchRooms();
      resetToDefaultView();
    }
  }, [open, course]);

  const resetToDefaultView = () => {
    setViewMode("list");
    setSelectedClass(null);
    setEditingClassId(null);
  };

  // --- API ---
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/classes/${course.CourseId}`);
      setClasses(res.data || []);
    } catch (error) {
      message.error("Lỗi tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/accounts/manage-accounts/teachers");
      setTeachers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get("/classes/rooms");
      setRooms(res.data || []);
    } catch (error) {
      setRooms([
        { RoomId: "P101", RoomName: "Phòng 101" },
        { RoomId: "LAB01", RoomName: "Phòng Lab" },
      ]);
    }
  };

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setEditingClassId(null);
    classForm.resetFields();
    classForm.setFieldsValue({
      Status: "Recruiting",
      FeePerSession: 0,
      TotalSessions: 0,
      TuitionFee: 0,
    });
    setViewMode("form");
  };

  const handleOpenEdit = (record) => {
    setEditingClassId(record.ClassId);
    setViewMode("form");

    const formData = {
      ...record,
      StartDate: record.StartDate ? dayjs(record.StartDate) : null,
      EndDate: record.EndDate ? dayjs(record.EndDate) : null,
      TimeRange:
        record.StartTime && record.EndTime
          ? [
              dayjs(record.StartTime, "HH:mm:ss"),
              dayjs(record.EndTime, "HH:mm:ss"),
            ]
          : [],
      Days: record.Days ? record.Days.split(",") : [],
    };
    classForm.setFieldsValue(formData);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Xóa lớp ${record.ClassName}?`,
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(`/classes/${record.ClassId}`);
          message.success("Đã xóa");
          fetchClasses();
        } catch (e) {
          message.error("Lỗi xóa lớp");
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      let startT = null,
        endT = null;
      if (values.TimeRange?.length === 2) {
        startT = values.TimeRange[0].format("HH:mm");
        endT = values.TimeRange[1].format("HH:mm");
      }

      const payload = {
        ...values,
        CourseId: course.CourseId,
        StartDate: values.StartDate?.format("YYYY-MM-DD"),
        EndDate: values.EndDate?.format("YYYY-MM-DD"),
        StartTime: startT,
        EndTime: endT,
      };

      if (editingClassId) {
        await api.put(`/classes/${editingClassId}`, payload);
        message.success("Cập nhật thành công!");
      } else {
        await api.post(`/classes/${course.CourseId}`, payload);
        message.success("Thêm mới thành công!");
      }
      resetToDefaultView();
      fetchClasses();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  // --- NAVIGATION HELPER ---
  const handleView = (mode, record) => {
    setSelectedClass(record);
    setViewMode(mode);
  };

  // --- RENDER ---
  const modalTitle = (
    <div className="flex flex-col pr-8">
      <span className="text-xs text-gray-500 uppercase font-normal">
        Quản lý lớp học
      </span>
      <span className="text-lg font-bold text-blue-700">
        {course?.CourseName}
      </span>
    </div>
  );

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      centered
      destroyOnHidden={true}
      maskClosable={false}
    >
      <Divider className="my-3" />

      {viewMode === "list" && (
        <ClassList
          classes={classes}
          loading={loading}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onViewInfo={(r) => handleView("info", r)}
          onEnterDetail={(r) => handleView("detail", r)}
        />
      )}

      {viewMode === "form" && (
        <ClassEditInfo
          editingClassId={editingClassId}
          form={classForm}
          initialValues={{}}
          teachers={teachers}
          rooms={rooms}
          isEditMode={!!editingClassId}
          onFinish={handleSubmit}
          onCancel={resetToDefaultView}
        />
      )}

      {viewMode === "info" && selectedClass && (
        <ClassInfo
          data={selectedClass}
          onBack={resetToDefaultView}
          onEnterDetail={(r) => handleView("detail", r)}
        />
      )}

      {viewMode === "detail" && selectedClass && (
        <AdminClassDetailView
          classData={selectedClass}
          onBack={resetToDefaultView}
        />
      )}
    </Modal>
  );
};

export default AdminClassManagementModal;
