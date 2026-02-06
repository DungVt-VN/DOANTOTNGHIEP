import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import Cookies from "js-cookie";

const Register = () => {
  const [inputs, setInputs] = useState({
    fullname: "",
    age: "",
    gender: "Male",
    phone: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setAlert(null);
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (!currentUser) {
        Cookies.remove("access_token");
        navigate("/login");
      }
      try {
        const res = await api.get("/auth/check");
        const currentUser = res.data.user;
        if (currentUser) {
          if (currentUser.Role === "Admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/courses");
          }
        }
      } catch (err) {
        console.log("Chưa đăng nhập hoặc Cookie hết hạn.");
        localStorage.removeItem("user");
      }
    };

    checkLoginStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    let response;
    e.preventDefault();
    setAlert(null);
    if (
      !inputs.fullname ||
      !inputs.username ||
      !inputs.email ||
      !inputs.password
    ) {
      setAlert({
        type: "error",
        message: "Vui lòng điền đầy đủ các trường bắt buộc!",
      });
      return;
    }

    setLoading(true);
    try {
      response = await api.post(
        "http://localhost:8800/api/auth/register",
        inputs
      );
      if (response.data?.token != null && response.data?.user != null) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      setAlert({
        type: "success",
        message: "Đăng ký thành công! Đang chuyển hướng...",
      });
      setTimeout(() => {
        navigate("/courses");
      }, 500);
    } catch (err) {
      console.error("Register Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Đăng ký thất bại!";
      setAlert({ type: "error", message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200";
  const labelClassName = "block text-sm font-medium leading-6 text-gray-900";

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Đăng ký tài khoản mới
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tham gia ngay để bắt đầu khóa học của bạn
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* --- HỌ VÀ TÊN --- */}
          <div>
            <label htmlFor="fullname" className={labelClassName}>
              Họ và tên
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="fullname"
                id="fullname"
                required
                value={inputs.fullname}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          {/* --- TUỔI & GIỚI TÍNH (Cùng 1 hàng) --- */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="age" className={labelClassName}>
                Tuổi
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="age"
                  id="age"
                  required
                  min="5"
                  max="100"
                  value={inputs.age}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Tuổi"
                />
              </div>
            </div>
            <div className="w-1/2">
              <label htmlFor="gender" className={labelClassName}>
                Giới tính
              </label>
              <div className="mt-2">
                <select
                  name="gender"
                  id="gender"
                  value={inputs.gender}
                  onChange={handleChange}
                  className={inputClassName}
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- SỐ ĐIỆN THOẠI --- */}
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Số điện thoại
            </label>
            <div className="mt-2">
              <input
                type="tel"
                name="phone"
                id="phone"
                required
                pattern="[0-9]{10,11}" // Validate số
                value={inputs.phone}
                onChange={handleChange}
                className={inputClassName}
                placeholder="0912 xxx xxx"
              />
            </div>
          </div>

          {/* --- TÊN TÀI KHOẢN --- */}
          <div>
            <label htmlFor="username" className={labelClassName}>
              Tên tài khoản
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="username"
                id="username"
                required
                value={inputs.username}
                onChange={handleChange}
                autoComplete="username"
                className={inputClassName}
                placeholder="username"
              />
            </div>
          </div>

          {/* --- EMAIL --- */}
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <div className="mt-2">
              <input
                type="email"
                name="email"
                id="email"
                required
                value={inputs.email}
                onChange={handleChange}
                autoComplete="email"
                className={inputClassName}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* --- MẬT KHẨU  */}
          <div>
            <label htmlFor="password" className={labelClassName}>
              Mật khẩu
            </label>
            <div className="mt-2 relative rounded-md shadow-sm">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                value={inputs.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputClassName} pr-10`} // Thêm padding phải để tránh icon
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer bg-transparent border-none focus:outline-none text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* --- THÔNG BÁO LỖI/THÀNH CÔNG --- */}
          {alert && (
            <div
              className={`rounded-md p-3 text-sm font-medium text-center ${
                alert.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {alert.message}
            </div>
          )}

          {/* --- NÚT ĐĂNG KÝ --- */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 
                ${
                  loading
                    ? "bg-indigo-400 cursor-not-allowed opacity-70"
                    : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]"
                }`}
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Bạn đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
