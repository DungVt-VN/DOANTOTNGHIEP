import TeacherSidebar from "@/components/Sidebar/TeacherSidebar";
function TeacherLayout({ children }) {
  return (
    <div className="flex ">
      <TeacherSidebar />
      <div className="w-full ">{children}</div>
    </div>
  );
}

export default TeacherLayout;
