"use client";

import { useSyncExternalStore } from "react";

// The current time on *her device* (local timezone), or null during server
// rendering. Refreshes whenever the app returns to the foreground, so a
// home-screen app left open overnight shows the right "days since".
let cached: Date | null = null;

function subscribe(onChange: () => void) {
  const refresh = () => {
    if (document.visibilityState === "visible") {
      cached = new Date();
      onChange();
    }
  };
  document.addEventListener("visibilitychange", refresh);
  return () => document.removeEventListener("visibilitychange", refresh);
}

function getSnapshot(): Date {
  return (cached ??= new Date());
}

function getServerSnapshot(): Date | null {
  return null;
}

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
