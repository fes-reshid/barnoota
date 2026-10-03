export type Role = 'super_admin' | 'school_admin' | 'teacher';

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** A school's public branding — what makes its login/portal look like "theirs". */
export interface SchoolBranding {
  logoUrl?: string;
  primaryColor: string; // hex, e.g. "#16a34a"
  welcomeText?: string;
}

export type SubscriptionPlan = 'trial' | 'basic' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface School extends BaseRecord {
  name: string;
  slug: string; // URL-safe, unique — used as /s/:slug
  email: string;
  phone?: string;
  address?: string;
  branding: SchoolBranding;
  /** uid -> role, for Firestore security rules (see firestore.rules `isMember`). */
  members: Record<string, Role>;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
}

export interface SchoolClass extends BaseRecord {
  schoolId: string;
  name: string; // e.g. "Tuhfatul Atfaal"
  description?: string;
  teacherIds: string[];
  archived: boolean;
}

/** A user's account profile — not school-scoped; points at their school(s). */
export interface AppUser extends BaseRecord {
  authUid: string;
  name: string;
  email: string;
  phone?: string;
  /** True only for platform owners (you) — can create schools and see all of them. */
  isPlatformAdmin: boolean;
  /** Schools this user belongs to (as school_admin/teacher) — their role lives on each school's `members` map. */
  schoolIds: string[];
}
