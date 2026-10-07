import { useEffect } from 'react';
import { enterForcedDemoMode } from '@/firebase/config';

/**
 * The /demo entry point. Firebase has already been initialized by the time
 * React even mounts (see firebase/config.ts, evaluated at module load), so
 * flipping into demo mode requires a full page reload rather than a
 * client-side route change — this sets the flag and immediately hard-
 * navigates to /login, which then boots the app with Firebase skipped.
 *
 * Also wipes any demo data left over from a previous /demo visit on this
 * browser, so every fresh visit (e.g. right before showing someone the
 * product) reseeds the full sample school instead of whatever state a
 * prior click-through left behind.
 */
export default function DemoEntry() {
  useEffect(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sms:'))
      .forEach((key) => localStorage.removeItem(key));
    enterForcedDemoMode();
    window.location.href = '/login';
  }, []);

  return null;
}
