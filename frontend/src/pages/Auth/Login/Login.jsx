import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Nhớ import Link
import { AuthContext } from "../../../context/authContext";
import api from "@/utils/axiosInstance";
import Cookies from "js-cookie";

const Login = () => {
  const { currentUser, login } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!currentUser) {
      Cookies.remove("access_token");
      navigate("/login");
    }
    const checkLoginStatus = async () => {
      try {
        await api.get("/auth/check");
        if (currentUser) {
          if (currentUser.Role === "Admin") {
            navigate("/admin/dashboard");
          } else if (currentUser.Role === "Teacher") {
            navigate("/teacher/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }
      } catch (err) {
        console.log("Chưa đăng nhập hoặc Cookie hết hạn.");
        localStorage.removeItem("user");
      }
    };

    checkLoginStatus();
  }, [navigate]);

  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setAlert(null);
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!inputs.email.trim()) {
      setAlert({ type: "error", message: "Vui lòng nhập Email/Tài khoản!" });
      return;
    }
    if (!inputs.password) {
      setAlert({ type: "error", message: "Vui lòng nhập mật khẩu!" });
      return;
    }

    setLoading(true);
    try {
      const user = await login(inputs);

      setAlert({
        type: "success",
        message: "Đăng nhập thành công! Đang chuyển hướng...",
      });

      setTimeout(() => {
        if (user.Role === "Admin") {
          navigate("/admin/dashboard");
        } else if (user.Role === "Teacher") {
          console.log("lskadjf");
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }, 500);
    } catch (err) {
      console.error("Login Error:", err);
      let msg = "Đăng nhập thất bại!";

      if (err.response) {
        const status = err.response.status;
        const msgBackend = err.response.data?.message || "";

        if (status === 404) {
          msg = "Tài khoản không tồn tại!";
        } else if (status === 401 || status === 400) {
          if (msgBackend.toLowerCase().includes("password")) {
            msg = "Mật khẩu không chính xác!";
          } else {
            msg = "Tài khoản hoặc mật khẩu không đúng!";
          }
        } else if (status === 500) {
          msg = "Lỗi máy chủ! Vui lòng thử lại sau.";
        } else {
          msg = msgBackend || "Đăng nhập thất bại!";
        }
      } else if (err.request) {
        msg = "Không thể kết nối đến Server. Kiểm tra mạng!";
      }

      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Đăng nhập hệ thống
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Chào mừng bạn quay trở lại!
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* --- EMAIL INPUT --- */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Tài khoản / Email
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="email"
                id="email"
                value={inputs.email}
                onChange={handleChange}
                autoComplete="username"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200"
                placeholder="Nhập email hoặc tên tài khoản"
              />
            </div>
          </div>

          {/* --- PASSWORD INPUT --- */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mật khẩu
              </label>
              <div className="text-sm">
                <Link
                  to="/forgotpassword"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
            <div className="mt-2 relative rounded-md shadow-sm">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={inputs.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer bg-transparent border-none focus:outline-none text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                tabIndex={-1}
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

          {/* --- ALERT MESSAGE --- */}
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

          {/* --- SUBMIT BUTTON --- */}
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
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
            >
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
