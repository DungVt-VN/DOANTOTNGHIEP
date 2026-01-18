const MaterialSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
    </div>
  </div>
);

export default MaterialSkeleton;
