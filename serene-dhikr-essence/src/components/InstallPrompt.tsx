import { useEffect, useState } from "react";
import { X, Download, Share, Plus } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "hisn:install:dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS
    window.navigator.standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}

    const p = detectPlatform();
    setPlatform(p);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari has no beforeinstallprompt — show after a short delay
    if (p === "ios") {
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
      if (isSafari) {
        const t = window.setTimeout(() => setOpen(true), 1200);
        return () => {
          window.removeEventListener("beforeinstallprompt", onBIP);
          clearTimeout(t);
        };
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") dismiss();
    else setOpen(false);
    setDeferred(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-50 px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="glass mx-auto max-w-xl rounded-3xl p-4 shadow-[var(--shadow-elegant)] animate-fade-in">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-foreground">
              Appii kana <span className="gold-text">bilbila keessanitti</span> dabalaa
            </p>
            {platform === "ios" ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Safari keessatti <Share className="inline h-3 w-3 align-text-bottom" /> tuqaa, ergasii
                <strong> "Add to Home Screen" </strong>
                <Plus className="inline h-3 w-3 align-text-bottom" /> filadhaa.
              </p>
            ) : platform === "android" && deferred ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Yaadachiisni sirritti akka hojjetu, akka appii dhugaatti dabaladhaa.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Browser kee keessatti "Install app" ykn "Add to Home Screen" filadhaa.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Cufi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {platform === "android" && deferred && (
          <button
            onClick={install}
            className="mt-3 w-full rounded-2xl py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Dabaladhu
          </button>
        )}
      </div>
    </div>
  );
}
