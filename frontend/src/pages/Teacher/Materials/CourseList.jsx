import React from "react";
import { Empty } from "antd";
import CourseSkeleton from "@/components/Skeletons/CourseSkeleton";
import MaterialCourseCardItem from "@/components/Course/Teacher/MaterialCourseCardItem";
import EmptyState from "./EmptyState";

const CourseList = ({
  loading,
  courses,
  searchTerm,
  renderStatusBadge,
  onSelectCourse,
  onClearSearch,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <CourseSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {courses.map((course) => (
          <div key={course.CourseId} onClick={() => onSelectCourse(course)}>
            <MaterialCourseCardItem
              course={course}
              renderStatusBadge={renderStatusBadge}
              navigate={() => {}}
            />
          </div>
        ))}
      </div>
    );
  }

  // Xử lý Empty State
  if (searchTerm) {
    return <EmptyState searchTerm={searchTerm} onClearSearch={onClearSearch} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Empty
        description={
          <span className="text-slate-500 text-base">
            Bạn chưa được phân công khóa học nào
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};

export default CourseList;
