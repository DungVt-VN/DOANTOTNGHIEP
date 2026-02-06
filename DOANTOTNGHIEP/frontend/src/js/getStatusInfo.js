// --- HELPER: Status ---
const getStatusColor = (status) => {
  switch (status) {
    case "Recruiting":
      return { color: "cyan", label: "Đang tuyển sinh" };
    case "Active":
      return { color: "blue", label: "Đang hoạt động" };
    case "Finished":
      return { color: "green", label: "Đã kết thúc" };
    case "Upcoming":
      return { color: "orange", label: "Sắp khai giảng" };
    case "Cancelled":
      return { color: "red", label: "Đã hủy" };
    default:
      return { color: "default", label: "Chưa xác định" };
  }
};

export default getStatusColor;
