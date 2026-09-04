import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { homePathForRole } from '@/lib/roles';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import NotFound from '@/pages/NotFound';

import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import SchoolsPage from '@/pages/superadmin/SchoolsPage';
import AdminsPage from '@/pages/superadmin/AdminsPage';
import SubscriptionsPage from '@/pages/superadmin/SubscriptionsPage';
import SystemSettingsPage from '@/pages/superadmin/SystemSettingsPage';

import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import TeacherDashboard from '@/pages/dashboard/TeacherDashboard';
import ParentDashboard from '@/pages/dashboard/ParentDashboard';
import StudentDashboard from '@/pages/dashboard/StudentDashboard';

import StudentList from '@/pages/students/StudentList';
import StudentProfile from '@/pages/students/StudentProfile';
import MyProfilePage from '@/pages/students/MyProfilePage';

import TeacherList from '@/pages/teachers/TeacherList';
import TeacherClassesPage from '@/pages/teachers/TeacherClassesPage';
import ParentsPage from '@/pages/parents/ParentsPage';
import ParentChildrenPage from '@/pages/parents/ParentChildrenPage';

import ClassesPage from '@/pages/classes/ClassesPage';
import SubjectsPage from '@/pages/classes/SubjectsPage';

import MarkAttendancePage from '@/pages/attendance/MarkAttendancePage';
import AttendanceViewPage from '@/pages/attendance/AttendanceViewPage';

import TimetableAdminPage from '@/pages/timetable/TimetableAdminPage';
import TimetableViewPage from '@/pages/timetable/TimetableViewPage';

import HomeworkListPage from '@/pages/homework/HomeworkListPage';
import StudentHomeworkPage from '@/pages/homework/StudentHomeworkPage';
import ParentHomeworkPage from '@/pages/homework/ParentHomeworkPage';

import ExamsListPage from '@/pages/exams/ExamsListPage';
import StudentExamsPage from '@/pages/exams/StudentExamsPage';
import ParentExamsPage from '@/pages/exams/ParentExamsPage';

import FeesAdminPage from '@/pages/fees/FeesAdminPage';
import FeeStructuresPage from '@/pages/fees/FeeStructuresPage';
import FeesViewPage from '@/pages/fees/FeesViewPage';

import AnnouncementsPage from '@/pages/communication/AnnouncementsPage';
import MessagesPage from '@/pages/communication/MessagesPage';

import LibraryPage from '@/pages/library/LibraryPage';
import TransportPage from '@/pages/transport/TransportPage';
import ReportsPage from '@/pages/reports/ReportsPage';

import QuranProgressPage from '@/pages/islamic/QuranProgressPage';
import IqraProgressPage from '@/pages/islamic/IqraProgressPage';
import IslamicStudiesPage from '@/pages/islamic/IslamicStudiesPage';
import OromoProgressPage from '@/pages/islamic/OromoProgressPage';

import SettingsPage from '@/pages/settings/SettingsPage';

function RoleHomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? homePathForRole(currentUser.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<RoleHomeRedirect />} />

      <Route element={<ProtectedRoute allow={['super_admin']} />}>
        <Route path="/super-admin" element={<DashboardLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={['school_admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="teachers" element={<TeacherList />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="attendance" element={<MarkAttendancePage />} />
          <Route path="timetable" element={<TimetableAdminPage />} />
          <Route path="homework" element={<HomeworkListPage />} />
          <Route path="exams" element={<ExamsListPage />} />
          <Route path="fees" element={<FeesAdminPage />} />
          <Route path="fees/structures" element={<FeeStructuresPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="transport" element={<TransportPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="quran" element={<QuranProgressPage />} />
          <Route path="iqra" element={<IqraProgressPage />} />
          <Route path="islamic-studies" element={<IslamicStudiesPage />} />
          <Route path="oromo" element={<OromoProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={['teacher']} />}>
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClassesPage />} />
          <Route path="students" element={<StudentList readOnly />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="attendance" element={<MarkAttendancePage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="homework" element={<HomeworkListPage />} />
          <Route path="exams" element={<ExamsListPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={['parent']} />}>
        <Route path="/parent" element={<DashboardLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<ParentChildrenPage />} />
          <Route path="attendance" element={<AttendanceViewPage />} />
          <Route path="homework" element={<ParentHomeworkPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exams" element={<ParentExamsPage />} />
          <Route path="fees" element={<FeesViewPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={['student']} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="homework" element={<StudentHomeworkPage />} />
          <Route path="attendance" element={<AttendanceViewPage />} />
          <Route path="exams" element={<StudentExamsPage />} />
          <Route path="fees" element={<FeesViewPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="profile" element={<MyProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
