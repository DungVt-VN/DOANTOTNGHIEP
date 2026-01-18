import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
// Auth
import Login from "./pages/Auth/Login/Login.jsx";
import Register from "./pages/Auth/Register/Register.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword/ForgotPassword.jsx";
import HomePage from "./pages/HomePage/HomePage.jsx";

// Teacher
import TeacherDashboard from "./pages/Teacher/Dashboard/TeacherDashboard.jsx";
import TeacherSchedulePage from "./pages/Teacher/Schedule/TeacherSchedulePage.jsx";
import TeacherNotification from "./pages/Teacher/Notification/TeacherNotification.jsx";
import TeacherSubjects from "./pages/Teacher/Subjects/TeacherSubjects.jsx";
import TeacherMaterials from "./pages/Teacher/Materials/TeacherMaterials.jsx";

// Admin
import TeacherManage from "./pages/Admin/TeacherManage/TeacherManage.jsx";
import StudentManage from "./pages/Admin/StudentManage/StudentManage.jsx";
import AdminDashboard from "./pages/Admin/Dashboards/AdminDashboard.jsx";
import CourseManage from "./pages/Admin/CourseManage/CourseManagePage.jsx";
import TuitionManage from "./pages/Admin/TuitionManage/TuitionManage.jsx";
import ScheduleManage from "./pages/Admin/ScheduleManage/ScheduleManage.jsx";

// Other
import PageNotFound from "./pages/NotFounds/PageNotFound.jsx";

// Router
import TeacherPrivateRouter from "./routers/TeacherPrivateRouter.jsx";
import AdminPrivateRouter from "./routers/AdminPrivateRouter.jsx";

// Layout
import MainLayout from "@/layout/MainLayout.jsx";
import TeacherLayout from "./layout/TeacherLayout.jsx";
import AdminLayout from "./layout/AdminLayout.jsx";
import TeacherClassDetailPage from "./pages/Teacher/ClassDetail/TeacherClassDetailPage.jsx";
import QuestionBank from "./pages/Teacher/BankQuestion/QuestionBank.jsx";
import PrivateRouter from "./routers/PrivateRouter.jsx";
import StudentLayout from "./layout/StudentLayout.jsx";
import StudentDashboard from "./pages/Student/Dashboard/StudentDashboard.jsx";
import StudentClasses from "./pages/Student/MyClasses/StudentClasses.jsx";
import StudentClassDetail from "./pages/Student/MyClasses/StudentClassDetail.jsx";
import StudentSchedule from "./pages/Student/Schedule/StudentSchedule.jsx";
import StudentTuition from "./pages/Student/Finance/StudentTuition.jsx";
import StudentProfile from "./pages/Student/Profile/StudentProfile.jsx";
import StudentCourseRegister from "./pages/Student/CourseRegister/StudentCourseRegister.jsx";

const AdminRouter = [
  {
    path: "/admin/manage-teachers",
    element: <TeacherManage />,
  },
  {
    path: "/admin/manage-students",
    element: <StudentManage />,
  },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/manage-courses",
    element: <CourseManage />,
  },
  {
    path: "/admin/tuition",
    element: <TuitionManage />,
  },
  {
    path: "/admin/schedule",
    element: <ScheduleManage />,
  },
];

const TeacherRouter = [
  { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
  {
    path: "/teacher/dashboard",
    element: <TeacherDashboard />,
  },
  {
    path: "/teacher/notifications",
    element: <TeacherNotification />,
  },
  {
    path: "/teacher/schedule",
    element: <TeacherSchedulePage />,
  },
  {
    path: "/teacher/course",
    element: <TeacherSubjects />,
  },
  {
    path: "/teacher/course/class/:classId",
    element: <TeacherClassDetailPage />,
  },
  {
    path: "/teacher/materials",
    element: <TeacherMaterials />,
  },
  {
    path: "/teacher/question-bank",
    element: <QuestionBank />,
  },
];

const StudentRouter = [
  {
    index: true,
    element: <Navigate to="/student/dashboard" replace />,
  },
  {
    path: "/student/dashboard",
    element: <StudentDashboard />,
  },
  {
    path: "/student/classes",
    element: <StudentClasses />,
  },
  {
    path: "/student/class/:classId",
    element: <StudentClassDetail />,
  },
  {
    path: "/student/schedule",
    element: <StudentSchedule />,
  },
  {
    path: "/student/tuition",
    element: <StudentTuition />,
  },
  {
    path: "/student/profile",
    element: <StudentProfile />,
  },
  {
    path: "/student/register-class",
    element: <StudentCourseRegister />,
  },
];

function App() {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route element={<TeacherPrivateRouter />}>
            {TeacherRouter.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<TeacherLayout>{route.element}</TeacherLayout>}
              />
            ))}
          </Route>

          <Route element={<AdminPrivateRouter />}>
            {AdminRouter.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<AdminLayout>{route.element}</AdminLayout>}
              />
            ))}
          </Route>

          <Route element={<PrivateRouter />}>
            {StudentRouter.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<StudentLayout>{route.element}</StudentLayout>}
              />
            ))}
          </Route>

          <Route path="/*" element={<PageNotFound />} />
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/register"
            element={
              <MainLayout>
                <Register />
              </MainLayout>
            }
          />
          <Route
            path="/forgotpassword"
            element={
              <MainLayout>
                <ForgotPassword />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <MainLayout>
                <Login />
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
