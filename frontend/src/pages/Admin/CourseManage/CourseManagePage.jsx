import React, { useEffect, useState, useMemo } from "react";
import { Input, Pagination, message, Modal } from "antd";
import { Button } from "@mui/material";
import { Plus, Search, RefreshCw } from "lucide-react";
import api from "@/utils/axiosInstance";

import AdminCourseTable from "@/components/Course/Admin/AdminCourseTable";
import AdminCourseModal from "@/components/Course/Admin/AdminCourseModal";
import AdminClassManagementModal from "@/components/Classes/Admin/AdminClassManagementModal";

const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.toString();
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const AdminCourseManage = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [courseModal, setCourseModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });

  const [classModal, setClassModal] = useState({
    open: false,
    course: null,
  });

  // --- 1. FETCH DATA ---
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses/all");
      setAllCourses(res.data || []);
    } catch (error) {
      console.error("Lỗi fetch courses:", error);
      message.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- 2. XỬ LÝ LỌC & PHÂN TRANG ---
  const filteredCourses = useMemo(() => {
    if (!searchText) return allCourses;
    const lowerSearch = removeVietnameseTones(searchText);
    return allCourses.filter((course) => {
      const name = removeVietnameseTones(course.CourseName);
      const subject = removeVietnameseTones(course.Subject);
      const code = removeVietnameseTones(course.CourseCode);
      return (
        name.includes(lowerSearch) ||
        subject.includes(lowerSearch) ||
        (code && code.includes(lowerSearch))
      );
    });
  }, [allCourses, searchText]);

  const currentTableData = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredCourses.slice(startIndex, endIndex);
  }, [filteredCourses, pagination]);

  // --- 3. HANDLERS ---
  const handleReload = () => {
    setSearchText("");
    setPagination({ ...pagination, current: 1 });
    fetchCourses();
  };

  const executeDelete = async (courseId) => {
    try {
      await api.delete(`/courses/${courseId}`);
      message.success("Xóa khóa học thành công!");
      if (currentTableData.length === 1 && pagination.current > 1) {
        setPagination((prev) => ({ ...prev, current: prev.current - 1 }));
      }
      fetchCourses();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Lỗi khi xóa khóa học.");
    }
  };

  const handleDeleteCourse = (courseId) => {
    const courseToDelete = allCourses.find((c) => c.CourseId === courseId);
    const courseName = courseToDelete
      ? courseToDelete.CourseName
      : "khóa học này";

    Modal.confirm({
      title: "Xác nhận xóa",
      content: (
        <div>
          Bạn có chắc chắn muốn xóa khóa học: <b>{courseName}</b>?
          <br />
          <span className="text-red-500 text-xs">
            Hành động này không thể hoàn tác. Các lớp học liên quan có thể bị
            ảnh hưởng.
          </span>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => executeDelete(courseId),
    });
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current: page }));
  };

  return (
    <div className="rounded-b-lg min-h-[620px] -mx-6 -my-6 bg-[#F5F5F5]">
      <div className="p-4 flex flex-col gap-4">
        {/* Header & Search Block */}
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-700 text-lg">Quản lý Khóa học</h3>
          <Input
            placeholder="Tìm tên khóa học, môn học..."
            prefix={<Search size={18} className="text-gray-400 mr-1" />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            allowClear
            className="w-80"
            size="middle"
          />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center">
            <div
              onClick={handleReload}
              className="hover:bg-slate-200 hover:rounded-md p-1 cursor-pointer transition-colors text-slate-600"
              title="Tải lại"
            >
              <RefreshCw size={20} />
            </div>
            <span className="mx-2 text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">
              Tổng số: {filteredCourses.length} khóa học
            </span>
          </div>

          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={18} />}
            onClick={() =>
              setCourseModal({ open: true, mode: "create", data: null })
            }
            sx={{ textTransform: "none", bgcolor: "#2563eb" }}
          >
            Thêm Khóa học
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="mx-3">
        <div className="shadow-sm sm:rounded-lg p-4 bg-white border border-gray-200">
          <AdminCourseTable
            courses={currentTableData}
            loading={loading}
            onView={(data) =>
              setCourseModal({ open: true, mode: "view", data })
            }
            onEdit={(data) =>
              setCourseModal({ open: true, mode: "edit", data })
            }
            onDelete={handleDeleteCourse}
            onManageClasses={(course) => setClassModal({ open: true, course })}
          />

          {/* Pagination */}
          {filteredCourses.length > 0 && (
            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={filteredCourses.length}
                onChange={handlePageChange}
                showSizeChanger={false}
                size="small"
              />
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <AdminCourseModal
        open={courseModal.open}
        mode={courseModal.mode}
        data={courseModal.data}
        onCancel={() => setCourseModal({ ...courseModal, open: false })}
        onSuccess={() => {
          setCourseModal({ ...courseModal, open: false });
          fetchCourses();
        }}
      />

      <AdminClassManagementModal
        open={classModal.open}
        course={classModal.course}
        onCancel={() => setClassModal({ ...classModal, open: false })}
      />
    </div>
  );
};

export default AdminCourseManage;
