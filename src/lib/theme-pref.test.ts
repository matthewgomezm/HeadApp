import { expect, test } from "vitest";
import { MemStorage } from "@/test/mem-storage";
import { readThemePref, THEME_BOOT_SCRIPT, THEME_KEY, writeThemePref } from "./theme-pref";

test("night by default", () => {
  expect(readThemePref(new MemStorage())).toBe("night");
});

test("remembers day", () => {
  const s = new MemStorage();
  writeThemePref("day", s);
  expect(s.getItem(THEME_KEY)).toBe("day");
  expect(readThemePref(s)).toBe("day");
});

test("junk falls back to night", () => {
  const s = new MemStorage();
  s.setItem(THEME_KEY, "purple");
  expect(readThemePref(s)).toBe("night");
});

test("blocked storage: reads night, writing doesn't throw", () => {
  const bad = new MemStorage();
  bad.getItem = () => {
    throw new Error("SecurityError");
  };
  bad.setItem = () => {
    throw new Error("QuotaExceeded");
  };
  expect(readThemePref(bad)).toBe("night");
  expect(() => writeThemePref("day", bad)).not.toThrow();
});

test("boot script applies a saved day theme before first paint, safely", () => {
  expect(THEME_KEY).toBe("mt.theme");
  expect(THEME_BOOT_SCRIPT).toContain('"mt.theme"');
  expect(THEME_BOOT_SCRIPT).toContain('classList.remove("dark")');
  expect(THEME_BOOT_SCRIPT).toMatch(/^try\{/);
  // runs on its own: day → class removed
  document.documentElement.className = "h-full dark";
  localStorage.setItem("mt.theme", "day");
  new Function(THEME_BOOT_SCRIPT)();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  localStorage.removeItem("mt.theme");
});
