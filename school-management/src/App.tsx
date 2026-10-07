import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { homePathForRole } from '@/lib/roles';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { Spinner } from '@/components/ui/Spinner';

// Every page is loaded lazily so the initial bundle is just the app shell
// (router, auth, layout) — the ~30 page modules only download once a user
// actually navigates to them, instead of all landing in one multi-MB chunk
// nobody's first visit needs in full.
const Login = lazy(() => import('@/pages/auth/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const ParentInvite = lazy(() => import('@/pages/auth/ParentInvite'));
const DemoEntry = lazy(() => import('@/pages/DemoEntry'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));
const SchoolsPage = lazy(() => import('@/pages/superadmin/SchoolsPage'));
const AdminsPage = lazy(() => import('@/pages/superadmin/AdminsPage'));
const SubscriptionsPage = lazy(() => import('@/pages/superadmin/SubscriptionsPage'));
const SystemSettingsPage = lazy(() => import('@/pages/superadmin/SystemSettingsPage'));

const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/dashboard/TeacherDashboard'));
const ParentDashboard = lazy(() => import('@/pages/dashboard/ParentDashboard'));
const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard'));

const StudentList = lazy(() => import('@/pages/students/StudentList'));
const StudentProfile = lazy(() => import('@/pages/students/StudentProfile'));
const MyProfilePage = lazy(() => import('@/pages/students/MyProfilePage'));

const TeacherList = lazy(() => import('@/pages/teachers/TeacherList'));
const TeacherClassesPage = lazy(() => import('@/pages/teachers/TeacherClassesPage'));
const ParentsPage = lazy(() => import('@/pages/parents/ParentsPage'));
const ParentChildrenPage = lazy(() => import('@/pages/parents/ParentChildrenPage'));

const ClassesPage = lazy(() => import('@/pages/classes/ClassesPage'));
const SubjectsPage = lazy(() => import('@/pages/classes/SubjectsPage'));

const MarkAttendancePage = lazy(() => import('@/pages/attendance/MarkAttendancePage'));
const AttendanceViewPage = lazy(() => import('@/pages/attendance/AttendanceViewPage'));

const TimetableAdminPage = lazy(() => import('@/pages/timetable/TimetableAdminPage'));
const TimetableViewPage = lazy(() => import('@/pages/timetable/TimetableViewPage'));

const HomeworkListPage = lazy(() => import('@/pages/homework/HomeworkListPage'));
const StudentHomeworkPage = lazy(() => import('@/pages/homework/StudentHomeworkPage'));
const ParentHomeworkPage = lazy(() => import('@/pages/homework/ParentHomeworkPage'));

const ExamsListPage = lazy(() => import('@/pages/exams/ExamsListPage'));
const StudentExamsPage = lazy(() => import('@/pages/exams/StudentExamsPage'));
const ParentExamsPage = lazy(() => import('@/pages/exams/ParentExamsPage'));

const FeesAdminPage = lazy(() => import('@/pages/fees/FeesAdminPage'));
const FeeStructuresPage = lazy(() => import('@/pages/fees/FeeStructuresPage'));
const FeesViewPage = lazy(() => import('@/pages/fees/FeesViewPage'));

const AnnouncementsPage = lazy(() => import('@/pages/communication/AnnouncementsPage'));
const MessagesPage = lazy(() => import('@/pages/communication/MessagesPage'));

const LibraryPage = lazy(() => import('@/pages/library/LibraryPage'));
const TransportPage = lazy(() => import('@/pages/transport/TransportPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));

const QuranProgressPage = lazy(() => import('@/pages/islamic/QuranProgressPage'));
const IqraProgressPage = lazy(() => import('@/pages/islamic/IqraProgressPage'));
const IslamicStudiesPage = lazy(() => import('@/pages/islamic/IslamicStudiesPage'));
const OromoProgressPage = lazy(() => import('@/pages/islamic/OromoProgressPage'));

const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

function RoleHomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? homePathForRole(currentUser.role) : '/login'} replace />;
}

function RouteFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function App() {
  return (
    <>
      <DemoModeBanner />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<ParentInvite />} />
      <Route path="/demo" element={<DemoEntry />} />

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
          <Route path="messages" element={<MessagesPage />} />
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
      </Suspense>
    </>
  );
}
