import React from "react";
import {
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  User,
  GraduationCap,
  Activity,
  Layers,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import getStatusColor from "@/js/getStatusInfo";

// --- HELPER: Format Tiền tệ ---
const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

// --- HELPER: Xử lý chuỗi Ngày học ---
const parseDays = (daysStr) => {
  if (!daysStr) return "Chưa cập nhật";

  // Nếu lưu dạng số "2,4,6" -> "Thứ 2, Thứ 4, Thứ 6"
  // Hoặc nếu lưu dạng "Mon,Tue" -> Map sang tiếng Việt
  // Ở đây giả định lưu dạng số hoặc text đơn giản

  // Tách chuỗi, loại bỏ khoảng trắng thừa
  const days = daysStr.split(",").map((d) => d.trim());

  // Map thêm chữ "Thứ" hoặc "CN" cho đẹp
  const formattedDays = days.map((d) => {
    if (d === "8" || d.toLowerCase() === "cn") return "Chủ Nhật";
    // Nếu đã có chữ "Thứ" rồi thì giữ nguyên, chưa có thì thêm vào (trừ CN)
    if (d.toLowerCase().startsWith("thứ")) return d;
    // Xử lý các số 2-7
    if (!isNaN(d) && d >= 2 && d <= 7) return `Thứ ${d}`;
    return d; // Fallback
  });

  return formattedDays.join(", ");
};

// --- HELPER: Tính tiến độ dựa trên thời gian ---
const calculateTimeProgress = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;

  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  const now = new Date().getTime();

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end - start;
  const timeElapsed = now - start;

  if (totalDuration <= 0) return 100;

  const percent = Math.round((timeElapsed / totalDuration) * 100);
  return Math.min(100, Math.max(0, percent));
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
    <div className="text-slate-400">
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">
        {value || "---"}
      </p>
    </div>
  </div>
);

const OverviewTab = ({ data }) => {
  const { color, label } = getStatusColor(data.Status);
  const statusColors = {
    cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-rose-100 text-rose-700 border-rose-200",
    default: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const badgeClass = statusColors[color] || statusColors.default;

  // Tính % học sinh
  const maxStudents = data.MaxStudents || 30;
  const studentPercent = Math.min(
    Math.round((data.StudentCount / maxStudents) * 100),
    100
  );

  // Tính % tiến độ thời gian
  const timeProgress = calculateTimeProgress(data.StartDate, data.EndDate);

  // Xử lý hiển thị ngày học
  const displayDays = parseDays(data.Days);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- SECTION 1: HEADER SUMMARY --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Info Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap size={120} />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${badgeClass} inline-block mb-2`}
                >
                  {label}
                </span>
                <h2 className="text-3xl font-bold text-slate-800 leading-tight mb-1">
                  {data.ClassName}
                </h2>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Layers size={16} /> {data.CourseName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Giảng viên
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {data.TeacherName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Học phí
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCurrency(data.TuitionFee)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">
                  Sĩ số lớp
                </p>
                <span className="text-3xl font-bold text-slate-800">
                  {data.StudentCount}
                </span>
                <span className="text-slate-400 text-sm">/{maxStudents}</span>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mb-1">
                <Users size={20} />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${studentPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">
                  Tiến độ thời gian
                </p>
                <span className="text-3xl font-bold text-slate-800">
                  {timeProgress}%
                </span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 mb-1">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${timeProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: DETAILED INFO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Calendar className="text-blue-600" size={24} />
              <h3 className="text-lg font-bold text-slate-800">
                Thời gian & Địa điểm
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <InfoRow
                icon={Clock}
                label="Giờ học"
                value={`${data.StartTime?.slice(0, 5)} - ${data.EndTime?.slice(
                  0,
                  5
                )}`}
              />
              <InfoRow
                icon={Calendar}
                label="Ngày học trong tuần"
                value={displayDays}
              />
              <InfoRow
                icon={Activity}
                label="Thời gian đào tạo"
                value={`${new Date(data.StartDate).toLocaleDateString(
                  "vi-VN"
                )} - ${new Date(data.EndDate).toLocaleDateString("vi-VN")}`}
              />
              <InfoRow
                icon={MapPin}
                label="Phòng học"
                value={`${data.RoomName} (${data.Location})`}
              />
            </div>
          </div>

          {/* ... Phần mô tả giữ nguyên ... */}
        </div>

        {/* ... Phần cột phải giữ nguyên ... */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <BookOpen className="text-orange-600" size={24} />
            <h3 className="text-lg font-bold text-slate-800">
              Thông tin đào tạo
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">
                Số bài học
              </span>
              <span className="font-bold text-slate-800">
                {data.LessonCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">
                Số chương
              </span>
              <span className="font-bold text-slate-800">
                {data.Chapters?.length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">
                Môn học
              </span>
              <span
                className="font-bold text-slate-800 text-right max-w-[60%] truncate"
                title={data.Subject}
              >
                {data.Subject}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
