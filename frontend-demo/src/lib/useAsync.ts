import { useCallback, useEffect, useState } from "react";

// Tiny fetch-state hook so every screen gets the same loading/skeleton +
// refetch behavior. `fn` is a mockApi call (later: a real fetch).
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((res) => alive && setData(res))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { data, loading, refetch: run };
}
