import React from "react";
import { Eye, Edit, Trash2, Layers } from "lucide-react";
import { Tooltip } from "antd";

const AdminCourseTable = ({
  courses,
  loading,
  onView,
  onEdit,
  onDelete,
  onManageClasses,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="min-h-[480px] max-h-[500px] overflow-y-auto custom-scrollbar">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-4 py-3 w-[5%] text-center">#</th>
            <th className="px-4 py-3 w-[30%]">Tên khóa học</th>
            <th className="px-4 py-3 w-[20%]">Môn học</th>
            <th className="px-4 py-3 w-[20%] text-right">Học phí cơ bản</th>
            <th className="px-4 py-3 w-[25%] text-center">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan="5" className="text-center py-8">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : courses.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-400">
                Chưa có khóa học nào.
              </td>
            </tr>
          ) : (
            courses.map((course, index) => (
              <tr
                key={course.CourseId}
                className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onManageClasses(course)}
              >
                <td className="px-4 py-3 text-center">{index + 1}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">
                  <div className="flex items-center gap-2">
                    {course.CourseImage && (
                      <img
                        src={course.CourseImage}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    {course.CourseName}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">
                  {course.Subject}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-800">
                  {formatCurrency(course.BaseTuitionFee)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center items-center gap-2">
                    <Tooltip title="Quản lý lớp">
                      <button
                        onClick={() => onManageClasses(course)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md"
                      >
                        <Layers size={18} />
                      </button>
                    </Tooltip>

                    <Tooltip title="Chi tiết">
                      <button
                        onClick={() => onView(course)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Eye size={18} />
                      </button>
                    </Tooltip>

                    <Tooltip title="Sửa">
                      <button
                        onClick={() => onEdit(course)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                      >
                        <Edit size={18} />
                      </button>
                    </Tooltip>

                    <Tooltip title="Xóa">
                      <button
                        onClick={() => onDelete(course.CourseId)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCourseTable;
