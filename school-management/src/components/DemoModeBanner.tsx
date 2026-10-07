import { Sparkles } from 'lucide-react';
import { isForcedDemoMode, exitForcedDemoMode } from '@/firebase/config';

/**
 * Shown on every page (see App.tsx) whenever /demo forced this browser into
 * demo mode — a constant visual reminder that nothing here is real school
 * data, plus a way back out. Renders nothing in normal use.
 */
export function DemoModeBanner() {
  if (!isForcedDemoMode()) return null;

  function handleExit() {
    exitForcedDemoMode();
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-xs font-medium text-amber-950">
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span>You're viewing a demo — sample data only, nothing here is saved to a real school.</span>
      <button onClick={handleExit} className="shrink-0 rounded-full bg-amber-950/10 px-2.5 py-1 font-semibold hover:bg-amber-950/20">
        Exit demo
      </button>
    </div>
  );
}
