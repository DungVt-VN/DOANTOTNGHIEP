import React from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = user.Role;

    if (userRole === "Admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-50 flex items-center justify-center overflow-hidden isolation-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[30%] w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container px-6 mx-auto text-center">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <AlertTriangle className="w-12 h-12 text-indigo-600" />
          </div>
        </div>

        <h1 className="font-black text-9xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 drop-shadow-sm">
          404
        </h1>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Ối! Trang này không tồn tại.
        </p>

        <p className="mt-4 text-base leading-7 text-gray-600 max-w-lg mx-auto">
          Có vẻ như đường dẫn bạn truy cập bị sai, trang đã bị xóa hoặc bạn
          không có quyền truy cập vào khu vực này.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-lg transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Quay về trang chủ
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto justify-center"
          >
            <MoveLeft className="w-4 h-4" />
            Quay lại trang trước
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Hệ thống Quản lý Trung tâm.
      </div>
    </main>
  );
}
