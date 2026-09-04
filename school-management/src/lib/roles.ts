import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

export const DEMO_ACCOUNTS: { role: Role; email: string; label: string }[] = [
  { role: 'super_admin', email: 'owner@barnoota.school', label: 'Super Admin' },
  { role: 'school_admin', email: 'admin@barnoota.school', label: 'School Admin' },
  { role: 'teacher', email: 'fatima.ahmed@barnoota.school', label: 'Teacher' },
  { role: 'parent', email: 'parent@example.com', label: 'Parent' },
  { role: 'student', email: 'student@example.com', label: 'Student' },
];

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin';
    case 'school_admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
  }
}
