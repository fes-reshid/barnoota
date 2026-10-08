import type { School } from '@/types';

export type ThemeKey = NonNullable<School['theme']>;

type Shade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

interface ThemeDef {
  label: string;
  scale: Record<Shade, string>; // hex
}

/**
 * The 4 themes an admin can pick in Settings → Branding & theme. 'forest'
 * is the original hardcoded palette (kept as the default for schools that
 * haven't picked one yet); navy/crimson/slate reuse Tailwind's own public
 * blue/red/slate scales so they read as deliberately-designed palettes
 * rather than one color stretched across 11 shades.
 */
export const APP_THEMES: Record<ThemeKey, ThemeDef> = {
  forest: {
    label: 'Forest',
    scale: {
      '50': '#f1faf4', '100': '#dcf2e3', '200': '#bbe4ca', '300': '#8ccfa8', '400': '#57b280',
      '500': '#349563', '600': '#24774f', '700': '#1c5f41', '800': '#194c36', '900': '#153f2e', '950': '#0a2419',
    },
  },
  navy: {
    label: 'Navy',
    scale: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
      '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554',
    },
  },
  crimson: {
    label: 'Crimson',
    scale: {
      '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171',
      '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a',
    },
  },
  slate: {
    label: 'Slate',
    scale: {
      '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8',
      '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617',
    },
  },
};

function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * Repaints every `bg-brand-*` / `text-brand-*` / `.btn-primary` / etc.
 * class across the whole app — not just ID cards — by overwriting the CSS
 * custom properties Tailwind's brand color scale resolves against (see
 * tailwind.config.js and the :root defaults in index.css). Call this once
 * the signed-in user's school record is known (see useMySchool +
 * DashboardLayout); falls back to 'forest' for a school that hasn't
 * picked a theme yet.
 */
export function applyAppTheme(theme: ThemeKey | undefined): void {
  const def = APP_THEMES[theme ?? 'forest'];
  const root = document.documentElement.style;
  for (const shade of Object.keys(def.scale) as Shade[]) {
    root.setProperty(`--brand-${shade}`, hexToRgbTriplet(def.scale[shade]));
  }
}

export function themeLabel(theme: ThemeKey | undefined): string {
  return APP_THEMES[theme ?? 'forest'].label;
}

/** The color used as an ID card's header background / accent text. */
export function themePrimaryHex(theme: ThemeKey | undefined): string {
  return APP_THEMES[theme ?? 'forest'].scale['700'];
}

/** The color used behind a student's photo-initials fallback on an ID card. */
export function themePhotoBgHex(theme: ThemeKey | undefined): string {
  return APP_THEMES[theme ?? 'forest'].scale['100'];
}
