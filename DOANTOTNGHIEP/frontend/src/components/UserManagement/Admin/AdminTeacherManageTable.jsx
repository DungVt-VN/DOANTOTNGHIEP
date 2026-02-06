import React, { useState, useEffect } from "react";
import { Pagination } from "antd"; // 1. Import Pagination
import AdminTeacherManageTableRow from "./AdminTeacherManageTableRow";

const AdminTeacherManageTable = ({
  teachers,
  handleCheckboxChange,
  selectedIds,
  onView,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [teachers]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = teachers ? teachers.slice(startIndex, endIndex) : [];

  return (
    <div className="p-3">
      <div className="shadow-sm sm:rounded-lg p-4 bg-white border border-gray-200">
        <div className="min-h-[360px] max-h-[500px] overflow-y-auto custom-scrollbar">
          {teachers && teachers.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="p-4 w-[5%] text-center">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 w-[15%]">
                    Tên tài khoản
                  </th>
                  <th scope="col" className="px-4 py-3 w-[20%]">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%]">
                    Mã GV
                  </th>
                  <th scope="col" className="px-4 py-3 w-[20%]">
                    Họ tên
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%]">
                    SĐT
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%] text-right">
                    Lương
                  </th>
                  <th scope="col" className="px-4 py-3 w-[10%] text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.map((teacher) => (
                  <AdminTeacherManageTableRow
                    key={teacher.UserId}
                    teacher={teacher}
                    handleCheckboxChange={handleCheckboxChange}
                    isChecked={selectedIds.includes(teacher.UserId?.toString())}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-400">
              <p>Chưa có dữ liệu giáo viên.</p>
            </div>
          )}
        </div>

        {teachers && teachers.length > pageSize && (
          <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
            <Pagination
              current={currentPage}
              total={teachers.length}
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
};

export default AdminTeacherManageTable;
