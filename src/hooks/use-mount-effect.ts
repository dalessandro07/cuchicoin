import { useEffect, useRef } from 'react';

/**
 * Runs an effect exactly once on mount. This is the ONLY sanctioned way to run
 * mount-time external-system setup in this codebase.
 */
export function useMountEffect(effect: () => void | (() => void)): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}

/**
 * Runs `run` whenever `key` changes (and on mount). The latest `run` closure is
 * captured via a ref so callers don't need to memoize it — this ref workaround
 * is intentionally isolated inside a reusable hook (never in components).
 */
export function useKeyedEffect(key: string, run: () => void | (() => void)): void {
  const runRef = useRef(run);
  // eslint-disable-next-line react-hooks/refs
  runRef.current = run;
  useEffect(() => runRef.current(), [key]);
}
