import React from "react";

const AdminStudentManageTableRow = ({
  student,
  handleCheckboxChange,
  isChecked,
}) => (
  <tr
    className={`bg-white border-t border-slate-300 hover:bg-zinc-100 transition-colors ${
      isChecked ? "bg-blue-50" : ""
    }`}
  >
    <td className="w-[5%] p-3">
      <div className="flex items-center">
        <input
          id={`checkbox-student-${student.UserId}`}
          onChange={(event) => handleCheckboxChange(event)}
          type="checkbox"
          checked={isChecked}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          value={student.UserId}
        />
      </div>
    </td>

    {/* UserName */}
    <td className="px-6 py-3 w-[15%] truncate">
      <span title={student.UserName} className="font-medium text-gray-900">
        {student.UserName}
      </span>
    </td>

    {/* Email */}
    <td className="px-6 py-3 w-[20%] truncate">
      <span title={student.Email}>{student.Email}</span>
    </td>

    {/* Password */}
    <td className="px-6 py-3 w-[15%] max-w-24 overflow-hidden truncate font-mono text-xs text-gray-400">
      <span title={student.Password}>{student.Password}</span>
    </td>

    {/* StudentName */}
    <td className="px-6 py-3 w-[20%] truncate">
      <span title={student.StudentName}>{student.StudentName}</span>
    </td>

    {/* StudentCode */}
    <td className="px-6 py-3 w-[15%] truncate font-medium text-gray-600">
      <span title={student.StudentCode}>{student.StudentCode}</span>
    </td>

    {/* Actions */}
    <td className="px-6 py-3 w-[10%] text-center">
      <button
        className="font-medium text-blue-600 hover:underline hover:text-blue-800"
        onClick={() => console.log("Edit Student:", student.UserId)}
      >
        Sửa
      </button>
    </td>
  </tr>
);

export default AdminStudentManageTableRow;
