const CourseSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="h-40 bg-gray-200 animate-pulse"></div>
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="pt-4 border-t border-gray-50 flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);
export default CourseSkeleton;
