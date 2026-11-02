"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "aaroh-local-checklist";

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A per-device checklist stored in localStorage (no server API exists for
 * topic or requirement progress). Hydration-safe via useSyncExternalStore.
 */
export function useLocalChecklist(key: string) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(EVENT, callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(EVENT, callback);
    };
  }, []);
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const checked = useMemo(() => {
    if (!raw) return new Set<string>();
    try {
      const parsed = JSON.parse(raw);
      return new Set<string>(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);

  const toggle = useCallback(
    (item: string) => {
      const next = new Set(checked);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        // Storage unavailable (private mode); the tick simply won't persist.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [checked, key],
  );

  return { checked, toggle };
}
