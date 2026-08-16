import { useEffect, useState } from "react";

const FAV_KEY = "hisn:favorites:v1";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("hisn:favorites"));
}

export function useFavorites() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    setIds(read());
    const handler = () => setIds(read());
    window.addEventListener("hisn:favorites", handler);
    return () => window.removeEventListener("hisn:favorites", handler);
  }, []);

  const toggle = (n: number) => {
    const cur = read();
    const next = cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n];
    write(next);
  };
  const isFavorite = (n: number) => ids.includes(n);
  return { ids, toggle, isFavorite };
}
