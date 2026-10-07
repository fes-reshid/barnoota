import { useEffect } from 'react';
import { enterForcedDemoMode } from '@/firebase/config';

/**
 * The /demo entry point. Firebase has already been initialized by the time
 * React even mounts (see firebase/config.ts, evaluated at module load), so
 * flipping into demo mode requires a full page reload rather than a
 * client-side route change — this sets the flag and immediately hard-
 * navigates to /login, which then boots the app with Firebase skipped.
 */
export default function DemoEntry() {
  useEffect(() => {
    enterForcedDemoMode();
    window.location.href = '/login';
  }, []);

  return null;
}
