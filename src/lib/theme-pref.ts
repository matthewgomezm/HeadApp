export type ThemePref = "day" | "night";

export const THEME_KEY = "mt.theme";

function store(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** Her saved choice on this device; anything unknown or unreadable is night. */
export function readThemePref(storage: Storage | undefined = store()): ThemePref {
  try {
    return storage?.getItem(THEME_KEY) === "day" ? "day" : "night";
  } catch {
    return "night";
  }
}

export function writeThemePref(theme: ThemePref, storage: Storage | undefined = store()): void {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    // private mode etc.: the switch still works for this visit
  }
}

/**
 * Runs inline in <head> before the page paints: <html> starts with `dark`
 * (night), so only a saved "day" needs changing. Never throws.
 */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="day"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}catch(e){}`;
