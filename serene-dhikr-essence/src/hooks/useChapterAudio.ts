import { useCallback, useEffect, useRef, useState } from "react";

export function useChapterAudio(urls: string[]) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [idx, setIdx] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<{ urls: string[]; idx: number }>({ urls, idx: 0 });
  const repeatRef = useRef(false);
  const advancingRef = useRef(false);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    queueRef.current = { urls, idx: queueRef.current.idx };
  }, [urls]);

  const preloadNext = useCallback(() => {
    const q = queueRef.current;
    const p = preloadRef.current;
    if (!q || !p) return;
    const nextIdx = q.idx + 1;
    const nextUrl =
      nextIdx < q.urls.length
        ? q.urls[nextIdx]
        : repeatRef.current
          ? q.urls[0]
          : null;
    if (!nextUrl) {
      p.removeAttribute("src");
      return;
    }
    if (p.src !== nextUrl) {
      p.src = nextUrl;
      try { p.load(); } catch {}
    }
  }, []);

  const advance = useCallback(() => {
    const a = audioRef.current;
    const q = queueRef.current;
    if (!a || !q) return;
    if (advancingRef.current) return;
    const atEnd = q.idx >= q.urls.length - 1;
    if (atEnd && !repeatRef.current) {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
      setDuration(0);
      return;
    }
    advancingRef.current = true;
    q.idx = atEnd ? 0 : q.idx + 1;
    setIdx(q.idx);
    a.src = q.urls[q.idx];
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    try { a.load(); } catch {}
    a.play()
      .catch(() => {
        setPlaying(false);
        setLoading(false);
      })
      .finally(() => {
        advancingRef.current = false;
        preloadNext();
      });
  }, [preloadNext]);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    const p = new Audio();
    p.preload = "auto";
    p.crossOrigin = "anonymous";
    p.muted = true;

    const onEnded = () => advance();
    const onError = () => {
      if (queueRef.current.urls.length) advance();
      else { setPlaying(false); setLoading(false); }
    };
    const onPlaying = () => { setLoading(false); setPlaying(true); };
    const onPause = () => setPlaying(false);
    const onLoadedMeta = () => setDuration(a.duration || 0);
    const onTimeUpdate = () => {
      setCurrent(a.currentTime);
      if (a.duration > 0) setProgress((a.currentTime / a.duration) * 100);
      if (
        a.duration > 0 &&
        a.currentTime >= a.duration - 0.35 &&
        !a.seeking &&
        !advancingRef.current
      ) {
        advance();
      }
    };

    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("pause", onPause);
    a.addEventListener("loadedmetadata", onLoadedMeta);
    a.addEventListener("timeupdate", onTimeUpdate);

    audioRef.current = a;
    preloadRef.current = p;
    return () => {
      a.pause();
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("loadedmetadata", onLoadedMeta);
      a.removeEventListener("timeupdate", onTimeUpdate);
      audioRef.current = null;
      preloadRef.current = null;
    };
  }, [advance]);

  const play = useCallback(async (fromIdx: number = 0) => {
    const a = audioRef.current;
    if (!a || !urls.length) return;
    queueRef.current = { urls, idx: fromIdx };
    setIdx(fromIdx);
    a.src = urls[fromIdx];
    setLoading(true);
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    try { a.load(); } catch {}
    try {
      await a.play();
      preloadNext();
    } catch {
      setLoading(false);
    }
  }, [urls, preloadNext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    try { await audioRef.current?.play(); } catch {}
  }, []);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (a && isFinite(t)) {
      a.currentTime = t;
      setCurrent(t);
    }
  }, []);

  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);

  return {
    playing, loading, progress, duration, current, repeat, idx,
    play, pause, resume, seek, toggleRepeat,
  };
}
