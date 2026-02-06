import React, { useState, useEffect } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Tooltip, Pagination } from "antd";

function AdminStudentManageTable({
  students,
  selectedIds,
  handleCheckboxChange,
  onView,
  onEdit,
  onDelete,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = students.slice(startIndex, endIndex);

  return (
    <div className="p-3">
      <div className="shadow-sm sm:rounded-lg p-4 bg-white border border-gray-200">
        <div className="min-h-[360px] max-h-[500px] overflow-y-auto custom-scrollbar">
          {students && students.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="p-4 w-[5%] text-center">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 w-[15%]">
                    Tài khoản
                  </th>
                  <th scope="col" className="px-4 py-3 w-[20%]">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 w-[15%]">
                    Họ và tên
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%]">
                    Mã SV
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%]">
                    SĐT
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%]">
                    Ngày sinh
                  </th>
                  <th scope="col" className="px-4 py-3 w-[15%] text-center">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {currentData.map((student) => (
                  <tr
                    key={student.StudentId || student.UserId}
                    onClick={() => onView(student)}
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="cursor-pointer inline-flex items-center justify-center">
                        <input
                          type="checkbox"
                          value={student.UserId}
                          checked={selectedIds.includes(
                            student.UserId?.toString()
                          )}
                          onChange={handleCheckboxChange}
                          className="rounded border-gray-400 cursor-pointer p-2 -m-2 w-4 h-4 checked:bg-blue-600 transition-colors"
                        />
                      </label>
                    </td>

                    {/* Account */}
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {student.UserName}
                    </td>

                    {/* Email */}
                    <td
                      className="px-4 py-3 text-gray-600 truncate max-w-[150px]"
                      title={student.Email}
                    >
                      {student.Email}
                    </td>

                    {/* Full Name */}
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {student.FullName}
                    </td>

                    {/* Student Code */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">
                        {student.StudentCode || "N/A"}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-600">
                      {student.PhoneNo || "-"}
                    </td>

                    {/* DOB */}
                    <td className="px-4 py-3 text-gray-600">
                      {student.BirthDate
                        ? new Date(student.BirthDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip title="Xem chi tiết">
                          <button
                            onClick={() => onView(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                        </Tooltip>

                        <Tooltip title="Sửa thông tin">
                          <button
                            onClick={() => onEdit(student)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                        </Tooltip>

                        <Tooltip title="Xóa">
                          <button
                            onClick={() => onDelete(student)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-400">
              <p>Chưa có dữ liệu sinh viên.</p>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {students.length > pageSize && (
          <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
            <Pagination
              current={currentPage}
              total={students.length}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showQuickJumper={false}
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStudentManageTable;
