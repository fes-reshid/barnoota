import { useEffect, useRef, useState } from "react";

export function useSubscription<T>(
  subscribe: ((cb: (value: T) => void) => () => void) | null,
  deps: React.DependencyList,
): { data: T | undefined; loading: boolean } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  useEffect(() => {
    if (!subscribeRef.current) {
      setData(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeRef.current((value) => {
      setData(value);
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
