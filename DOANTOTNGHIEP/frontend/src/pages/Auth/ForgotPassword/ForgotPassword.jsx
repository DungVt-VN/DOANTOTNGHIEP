import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  // --- STATE ---
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập Code & Pass mới
  const [inputs, setInputs] = useState({
    email: "",
    otpCode: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // --- HANDLERS ---
  const handleChange = (e) => {
    setAlert(null);
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Xử lý Gửi Email (Bước 1)
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!inputs.email) {
      setAlert({ type: "error", message: "Vui lòng nhập Email!" });
      return;
    }

    setLoading(true);
    try {
      // Gọi API gửi mã OTP về email
      // await axios.post("http://localhost:8800/api/auth/forgot-password", { email: inputs.email });

      // Giả lập thành công để test giao diện (Xóa dòng này khi có API thật)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAlert({
        type: "success",
        message: "Mã xác nhận đã được gửi đến email của bạn!",
      });

      // Chuyển sang bước 2 sau 1s
      setTimeout(() => {
        setStep(2);
        setAlert(null);
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy email này!";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đổi Mật Khẩu (Bước 2)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!inputs.otpCode || !inputs.newPassword) {
      setAlert({ type: "error", message: "Vui lòng nhập đầy đủ thông tin!" });
      return;
    }

    setLoading(true);
    try {
      // Gọi API reset password
      // await axios.post("http://localhost:8800/api/auth/reset-password", inputs);

      // Giả lập thành công
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAlert({
        type: "success",
        message: "Đổi mật khẩu thành công! Đang chuyển hướng...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Mã xác nhận không đúng hoặc đã hết hạn!";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200";
  const labelClassName = "block text-sm font-medium leading-6 text-gray-900";

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Quên mật khẩu?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1
            ? "Nhập email để nhận mã xác nhận đặt lại mật khẩu."
            : "Nhập mã xác nhận chúng tôi vừa gửi và mật khẩu mới."}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          className="space-y-6"
          onSubmit={step === 1 ? handleSendEmail : handleResetPassword}
        >
          {/* --- STEP 1: NHẬP EMAIL --- */}
          {step === 1 && (
            <div>
              <label htmlFor="email" className={labelClassName}>
                Email đăng ký
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={inputs.email}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}

          {/* --- STEP 2: NHẬP CODE & PASS MỚI --- */}
          {step === 2 && (
            <>
              {/* Hiển thị lại email (readonly) để user biết đang đổi cho email nào */}
              <div>
                <label className={labelClassName}>Email</label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={inputs.email}
                    disabled
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-500 bg-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Nhập Reset Code */}
              <div>
                <label htmlFor="otpCode" className={labelClassName}>
                  Mã xác nhận (OTP)
                </label>
                <div className="mt-2">
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    required
                    value={inputs.otpCode}
                    onChange={handleChange}
                    className={`${inputClassName} tracking-widest text-center font-bold`}
                    placeholder="123456"
                  />
                </div>
              </div>

              {/* Nhập Mật khẩu mới */}
              <div>
                <label htmlFor="newPassword" className={labelClassName}>
                  Mật khẩu mới
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={inputs.newPassword}
                    onChange={handleChange}
                    className={`${inputClassName} pr-10`}
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
            </>
          )}

          {/* --- THÔNG BÁO --- */}
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

          {/* --- NÚT SUBMIT --- */}
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
              {loading
                ? "Đang xử lý..."
                : step === 1
                ? "Gửi mã xác nhận"
                : "Đặt lại mật khẩu"}
            </button>
          </div>
        </form>

        {/* --- FOOTER LINKS --- */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Nhớ mật khẩu?{" "}
          <Link
            to="/login"
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
