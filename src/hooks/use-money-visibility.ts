/**
 * Global money-visibility toggle (the Yape-style "eye" that hides amounts).
 * Backed by an external store + useSyncExternalStore so every tab stays in
 * sync without prop drilling or effects. Persisted best-effort via storage.
 */

import { useSyncExternalStore } from 'react';

import { storage } from '@/lib/storage';

const STORAGE_KEY = 'kuchicoin.money-hidden';

let hidden = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// Hydrate once at module load (best-effort; storage is async).
void storage.getItem(STORAGE_KEY).then((value) => {
  if (value === '1' && !hidden) {
    hidden = true;
    emit();
  }
});

export const moneyVisibility = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return hidden;
  },
  toggle() {
    hidden = !hidden;
    void storage.setItem(STORAGE_KEY, hidden ? '1' : '0');
    emit();
  },
};

export function useMoneyVisibility(): { hidden: boolean; toggle: () => void } {
  const hiddenValue = useSyncExternalStore(
    moneyVisibility.subscribe,
    moneyVisibility.getSnapshot,
    moneyVisibility.getSnapshot,
  );
  return { hidden: hiddenValue, toggle: moneyVisibility.toggle };
}
