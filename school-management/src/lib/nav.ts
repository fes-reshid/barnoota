import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, GraduationCap, UserCircle, School, BookOpen, CalendarCheck,
  CalendarClock, ClipboardList, FileSpreadsheet, Wallet, Megaphone, Library, BarChart3,
  Settings, Building2, ShieldCheck, MessageSquare, Moon, BookMarked, Languages,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super_admin: [
    { label: 'Overview', to: '/super-admin', icon: LayoutDashboard },
    { label: 'Schools', to: '/super-admin/schools', icon: Building2 },
    { label: 'Administrators', to: '/super-admin/admins', icon: ShieldCheck },
    { label: 'Subscriptions', to: '/super-admin/subscriptions', icon: Wallet },
    { label: 'System Settings', to: '/super-admin/settings', icon: Settings },
  ],
  school_admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Students', to: '/admin/students', icon: GraduationCap },
    { label: 'Teachers', to: '/admin/teachers', icon: Users },
    { label: 'Parents', to: '/admin/parents', icon: UserCircle },
    { label: 'Classes', to: '/admin/classes', icon: School },
    { label: 'Subjects', to: '/admin/subjects', icon: BookOpen },
    { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
    { label: 'Timetable', to: '/admin/timetable', icon: CalendarClock },
    { label: 'Homework', to: '/admin/homework', icon: ClipboardList },
    { label: 'Exams', to: '/admin/exams', icon: FileSpreadsheet },
    { label: 'Fees', to: '/admin/fees', icon: Wallet },
    { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { label: 'Library', to: '/admin/library', icon: Library },
    { label: 'Transport', to: '/admin/transport', icon: Building2 },
    { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
    { label: 'Quran Progress', to: '/admin/quran', icon: Moon },
    { label: 'Iqra', to: '/admin/iqra', icon: BookMarked },
    { label: 'Islamic Studies', to: '/admin/islamic-studies', icon: BookOpen },
    { label: 'Oromo Language', to: '/admin/oromo', icon: Languages },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
    { label: 'My Classes', to: '/teacher/classes', icon: School },
    { label: 'Students', to: '/teacher/students', icon: GraduationCap },
    { label: 'Attendance', to: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Timetable', to: '/teacher/timetable', icon: CalendarClock },
    { label: 'Homework', to: '/teacher/homework', icon: ClipboardList },
    { label: 'Exams & Marks', to: '/teacher/exams', icon: FileSpreadsheet },
    { label: 'Announcements', to: '/teacher/announcements', icon: Megaphone },
  ],
  parent: [
    { label: 'Dashboard', to: '/parent', icon: LayoutDashboard },
    { label: "Children", to: '/parent/children', icon: GraduationCap },
    { label: 'Attendance', to: '/parent/attendance', icon: CalendarCheck },
    { label: 'Homework', to: '/parent/homework', icon: ClipboardList },
    { label: 'Timetable', to: '/parent/timetable', icon: CalendarClock },
    { label: 'Exam Results', to: '/parent/exams', icon: FileSpreadsheet },
    { label: 'Fees', to: '/parent/fees', icon: Wallet },
    { label: 'Announcements', to: '/parent/announcements', icon: Megaphone },
    { label: 'Messages', to: '/parent/messages', icon: MessageSquare },
  ],
  student: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Timetable', to: '/student/timetable', icon: CalendarClock },
    { label: 'Homework', to: '/student/homework', icon: ClipboardList },
    { label: 'Attendance', to: '/student/attendance', icon: CalendarCheck },
    { label: 'Exams & Results', to: '/student/exams', icon: FileSpreadsheet },
    { label: 'Fees', to: '/student/fees', icon: Wallet },
    { label: 'Announcements', to: '/student/announcements', icon: Megaphone },
    { label: 'Profile', to: '/student/profile', icon: UserCircle },
  ],
};
