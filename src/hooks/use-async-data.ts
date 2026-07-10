import { useCallback, useRef, useState } from 'react';

import { useKeyedEffect } from '@/hooks/use-mount-effect';

export type AsyncData<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Minimal data-fetching hook for on-demand server reads (no fetching library in
 * this project). Re-runs `loader` whenever `key` changes; `reload` lets event
 * handlers refetch manually. The loader is captured via ref so callers don't
 * need to memoize it.
 */
export function useAsyncData<T>(loader: () => Promise<T>, key: string): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  // eslint-disable-next-line react-hooks/refs
  loaderRef.current = loader;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useKeyedEffect(key, () => {
    void run();
  });

  return { data, loading, error, reload: run };
}
