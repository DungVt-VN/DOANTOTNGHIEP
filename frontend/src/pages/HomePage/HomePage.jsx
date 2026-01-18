import React from "react";
import { Link } from "react-router-dom";

const SUBJECTS = [
  {
    id: 1,
    title: "Toán Học",
    desc: "Tư duy logic & giải tích",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    title: "Ngữ Văn",
    desc: "Cảm thụ & phân tích văn học",
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: 3,
    title: "Tiếng Anh",
    desc: "Giao tiếp & IELTS/TOEIC",
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 4,
    title: "Lập Trình (IT)",
    desc: "Web, Data & Algorithms",
    color: "bg-green-100 text-green-600",
  },
];

const STATS = [
  { number: "100+", label: "Khóa học" },
  { number: "16", label: "Năm kinh nghiệm" },
  { number: "50+", label: "Giảng viên giỏi" },
  { number: "98%", label: "Học viên hài lòng" },
];

const HomePage = () => {
  return (
    <div className="home mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* --- HERO SECTION --- */}
      <div className="hero-section flex flex-col-reverse lg:flex-row items-center justify-between gap-10 mb-20">
        <div className="hero-content lg:w-1/2">
          <div className="title mb-6">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-gray-800">
              Nâng tầm tri thức <br />
              <span className="text-blue-600">Kiến tạo tương lai</span>
            </h1>
          </div>
          <div className="mb-8 text-gray-600 text-lg">
            <p>
              BK-ELEARNING là nền tảng học tập trực tuyến hàng đầu, cung cấp các
              khóa học chất lượng từ cơ bản đến nâng cao: Toán, Văn, Anh và Công
              nghệ thông tin. Học chủ động, hiệu quả vượt trội.
            </p>
          </div>
          <Link
            to="/login"
            className="join inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
          >
            Đăng ký học ngay
          </Link>
        </div>

        <div className="image lg:w-1/2 flex justify-center">
          <img
            src={""}
            alt="Learning Platform"
            className="w-full max-w-md object-contain drop-shadow-xl"
          />
        </div>
      </div>

      {/* --- SUBJECTS SECTION (MỚI) --- */}
      <div className="subjects-section mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Lĩnh Vực Đào Tạo</h2>
          <p className="text-gray-500 mt-2">
            Chúng tôi tập trung vào các môn học cốt lõi
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBJECTS.map((sub) => (
            <div
              key={sub.id}
              className={`p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition ${
                sub.color.replace("text", "bg").split(" ")[0]
              } bg-opacity-10`}
            >
              <h3
                className={`text-xl font-bold mb-2 ${sub.color.split(" ")[1]}`}
              >
                {sub.title}
              </h3>
              <p className="text-gray-600 text-sm">{sub.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="achievement-section bg-gray-50 rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          Thành Tựu Của Chúng Tôi
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto mb-10">
          Với hơn 16 năm kinh nghiệm, BK-ELEARNING tự hào là người bạn đồng hành
          tin cậy của hàng ngàn học sinh, sinh viên trên khắp cả nước.
        </p>

        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="stat-item">
              <h2 className="text-4xl font-extrabold text-blue-600 mb-2">
                {stat.number}
              </h2>
              <h4 className="text-gray-600 font-medium">{stat.label}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
