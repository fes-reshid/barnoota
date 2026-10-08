export type Currency = 'AUD' | 'USD';

interface PlanPrice {
  monthly: number;
  yearly: number;
}

/**
 * Two independent regional price lists, not a live FX conversion of one
 * number — standard SaaS practice (see Gradelink, Fedena, etc., which all
 * price per-region rather than recompute off a daily exchange rate). AUD
 * figures are the ones actually discussed/approved; USD is the default
 * shown to everyone outside Australia.
 */
const PRICING: Record<Currency, Record<'basic' | 'standard' | 'premium', PlanPrice>> = {
  AUD: {
    basic: { monthly: 25, yearly: 250 },
    standard: { monthly: 150, yearly: 1500 },
    premium: { monthly: 300, yearly: 3000 },
  },
  USD: {
    basic: { monthly: 39, yearly: 390 },
    standard: { monthly: 149, yearly: 1490 },
    premium: { monthly: 299, yearly: 2990 },
  },
};

const CURRENCY_SYMBOL: Record<Currency, string> = { AUD: 'A$', USD: '$' };

/**
 * Best-effort, zero-dependency region guess: the browser's IANA timezone
 * (every "Australia/*" zone) with the locale ("...-AU") as a fallback
 * signal. No geo-IP service, no network call, no API key — just what the
 * browser already exposes. It's approximate (a VPN or travelling visitor
 * can fool it) but good enough for picking a currency to *display*; it
 * never gates access or changes what a plan actually includes.
 */
export function detectCurrency(): Currency {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (timeZone.startsWith('Australia/')) return 'AUD';
    const locale = (navigator.language ?? '').toUpperCase();
    if (locale.endsWith('-AU')) return 'AUD';
  } catch {
    // Intl/navigator unavailable for some reason — fall through to the default.
  }
  return 'USD';
}

export function pricingFor(currency: Currency) {
  return PRICING[currency];
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOL[currency];
}
