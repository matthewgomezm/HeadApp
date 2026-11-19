"use client";

import { useSyncExternalStore } from "react";

// The current time on *her device* (local timezone), or null during server
// rendering. Refreshes whenever the app returns to the foreground and once a
// minute, so "days since" and an ongoing migraine's elapsed time stay right.
let cached: Date | null = null;

function subscribe(onChange: () => void) {
  const refresh = () => {
    if (document.visibilityState === "visible") {
      cached = new Date();
      onChange();
    }
  };
  document.addEventListener("visibilitychange", refresh);
  // Once a minute, so "1h 12m so far" stays current. No animation, just a new number.
  const tick = setInterval(refresh, 60_000);
  return () => {
    document.removeEventListener("visibilitychange", refresh);
    clearInterval(tick);
  };
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
