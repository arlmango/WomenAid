import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";

// Small shared data-fetching hook so every page doesn't repeat the same
// loading/error/refetch boilerplate. Errors are already toasted by apiFetch;
// this just tracks loading state for skeletons.
export function useApiQuery<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    apiGet<T>(path)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
