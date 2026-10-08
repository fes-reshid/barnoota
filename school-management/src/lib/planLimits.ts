import type { School } from '@/types';

export interface PlanLimits {
  label: string;
  studentCap: number; // Infinity = unlimited
  trialDays?: number; // only set for 'trial'
  email: boolean;
  whatsappTelegram: boolean;
  islamicModules: boolean;
  customBranding: boolean;
  parentInvites: boolean;
}

/**
 * What each subscription tier actually unlocks. Nothing here talks to a
 * payment processor — subscriptionPlan/subscriptionStatus are still just
 * fields Super Admin sets by hand (see SubscriptionsPage) — this module is
 * the enforcement layer so changing that field actually changes what a
 * school can do, instead of being a cosmetic label.
 */
export const PLAN_LIMITS: Record<School['subscriptionPlan'], PlanLimits> = {
  trial: {
    label: 'Trial', studentCap: 30, trialDays: 14,
    email: false, whatsappTelegram: false, islamicModules: false, customBranding: false, parentInvites: false,
  },
  basic: {
    label: 'Basic', studentCap: 100,
    email: true, whatsappTelegram: false, islamicModules: false, customBranding: false, parentInvites: true,
  },
  standard: {
    label: 'Standard', studentCap: 500,
    email: true, whatsappTelegram: true, islamicModules: true, customBranding: true, parentInvites: true,
  },
  premium: {
    label: 'Premium', studentCap: Infinity,
    email: true, whatsappTelegram: true, islamicModules: true, customBranding: true, parentInvites: true,
  },
};

export function planLimitsFor(school: School | null | undefined): PlanLimits {
  return PLAN_LIMITS[school?.subscriptionPlan ?? 'trial'];
}

function trialExpiresAt(school: School): number {
  const days = PLAN_LIMITS.trial.trialDays ?? 0;
  return new Date(school.createdAt).getTime() + days * 24 * 60 * 60 * 1000;
}

export function isTrialExpired(school: School | null | undefined): boolean {
  if (!school || school.subscriptionPlan !== 'trial') return false;
  return Date.now() > trialExpiresAt(school);
}

/** Days left on a trial, clamped to 0 — meaningless (0) for any other plan. */
export function trialDaysRemaining(school: School | null | undefined): number {
  if (!school || school.subscriptionPlan !== 'trial') return 0;
  const msLeft = trialExpiresAt(school) - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}
