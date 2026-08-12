import { useEffect, useRef, useState } from "react";

export function useArabicSpeech() {
  const [supported, setSupported] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const ar =
        voices.find((v) => /^ar(-|_|$)/i.test(v.lang)) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("ar")) ||
        null;
      setVoice(ar);
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return { supported, voice };
}

export function ArabicAudioButton({ text }: { text: string }) {
  const { supported, voice } = useArabicSpeech();
  const [playing, setPlaying] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = voice?.lang || "ar-SA";
    if (voice) utt.voice = voice;
    utt.rate = 0.85;
    utt.pitch = 1;
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    uttRef.current = utt;
    synth.speak(utt);
    setPlaying(true);
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Pause" : "Play"}
      className="text-muted-foreground transition hover:text-gold"
    >
      {playing ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      )}
    </button>
  );
}
