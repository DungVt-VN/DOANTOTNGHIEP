import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";

const AdminTeacherManageTableRow = ({
  teacher,
  handleCheckboxChange,
  isChecked,
  onView,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <tr
      className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onView(teacher)}
    >
      {/* Checkbox */}
      <td
        className="px-4 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="cursor-pointer inline-flex items-center justify-center">
          <input
            type="checkbox"
            value={teacher.UserId}
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="rounded border-gray-400 cursor-pointer p-2 -m-2 w-4 h-4 checked:bg-blue-600 transition-colors"
          />
        </label>
      </td>

      {/* UserName */}
      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
        {teacher.UserName}
      </td>

      {/* Email */}
      <td
        className="px-4 py-3 text-gray-600 truncate max-w-[150px]"
        title={teacher.Email}
      >
        {teacher.Email}
      </td>

      {/* TeacherCode */}
      <td className="px-4 py-3 font-semibold text-blue-600">
        {teacher.TeacherCode}
      </td>

      {/* FullName */}
      <td className="px-4 py-3 text-gray-700 font-medium">
        {teacher.FullName}
      </td>

      {/* PhoneNo */}
      <td className="px-4 py-3 text-gray-600">{teacher.PhoneNo}</td>

      {/* SalaryRate */}
      <td className="px-4 py-3 text-right font-mono text-gray-700">
        {formatCurrency(teacher.SalaryRate)}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onView(teacher)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>

          <button
            onClick={() => onEdit(teacher)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
            title="Chỉnh sửa"
          >
            <Edit size={18} />
          </button>

          <button
            onClick={() => onDelete(teacher)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdminTeacherManageTableRow;
