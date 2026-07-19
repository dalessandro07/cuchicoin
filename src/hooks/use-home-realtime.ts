/**
 * Polls Redis-backed home events while a home is active and the app is
 * foregrounded. Lives in a reusable hook so AppState + interval stay out of
 * components (no direct useEffect in UI code).
 */

import { useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useKeyedEffect } from "@/hooks/use-mount-effect";
import { financeApi } from "@/lib/api-client";

const POLL_MS = 1500;

export function useHomeRealtime(
  homeId: string | null,
  enabled: boolean,
  onRemoteChange: () => void | Promise<void>,
): void {
  const onRemoteChangeRef = useRef(onRemoteChange);
  onRemoteChangeRef.current = onRemoteChange;

  const key = enabled && homeId ? `rt:${homeId}` : "rt:off";

  useKeyedEffect(key, () => {
    if (!enabled || !homeId) return;

    let after = "";
    let cancelled = false;
    let inFlight = false;
    let appState: AppStateStatus = AppState.currentState;

    const tick = async () => {
      if (cancelled || inFlight || appState !== "active") return;
      inFlight = true;
      try {
        const result = await financeApi.pollRealtime(homeId, after);
        if (cancelled) return;
        after = result.lastId;
        if (result.events.length > 0) {
          await onRemoteChangeRef.current();
        }
      } catch (err) {
        console.warn("[useHomeRealtime] poll failed:", err);
      } finally {
        inFlight = false;
      }
    };

    void tick();
    const interval = setInterval(() => {
      void tick();
    }, POLL_MS);

    const sub = AppState.addEventListener("change", (next) => {
      appState = next;
      if (next === "active") void tick();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  });
}
