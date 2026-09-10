import { useCallback, useEffect, useState, type DependencyList } from "react";
import { getApiErrorMessage } from "../api/base";

/**
 * Mini hook de carga de datos: ejecuta `fetcher` al montar y cuando cambian `deps`.
 * Devuelve `data`, `loading`, `error` y `reload()` para refrescar tras una mutación.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload, setData };
}
