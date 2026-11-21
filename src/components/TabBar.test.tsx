import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, expect, test, vi } from "vitest";
import { TabBar } from "./TabBar";

let pathname = "/insights";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/insights";
});

test("three tabs — Home, History, Insights; no Doctor tab", () => {
  render(<TabBar />);
  const links = screen.getAllByRole("link");
  expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
    ["Home", "/"],
    ["History", "/history"],
    ["Insights", "/insights"],
  ]);
  expect(screen.queryByRole("link", { name: "Doctor" })).toBeNull();
});

test("only the current tab is marked active", () => {
  render(<TabBar />);
  const current = screen.getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page");
  expect(current.map((l) => l.textContent)).toEqual(["Insights"]);
});

test("episode detail pages keep History active", () => {
  pathname = "/episodes/6f1c1c1e-0000-4000-8000-000000000001";
  render(<TabBar />);
  expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("aria-current", "page");
});

test("the day/night switch sits in the tab bar", () => {
  render(<TabBar />);
  expect(screen.getByRole("button", { name: "Day or night colours" })).toBeInTheDocument();
});

test("hidden on the login page", () => {
  pathname = "/login";
  render(<TabBar />);
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("uses the Kokonut split nav, with ≥48px tap targets", () => {
  render(<TabBar />);
  for (const link of screen.getAllByRole("link")) {
    expect(link).toHaveClass("h-12");
  }
});

test("split nav is recolored to Dusk (no zinc/orange/white leftovers)", () => {
  const src = readFileSync(join(process.cwd(), "src/components/kokonutui/morphic-navbar.tsx"), "utf8");
  expect(src).not.toMatch(/zinc-|orange-|text-white|bg-white/);
  expect(src).toMatch(/dusk-accent/);
});
