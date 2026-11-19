import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { TabBar } from "./TabBar";

let pathname = "/insights";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/insights";
});

test("four tabs with correct hrefs", () => {
  render(<TabBar />);
  const expected = [
    ["Home", "/"],
    ["History", "/history"],
    ["Insights", "/insights"],
    ["Doctor", "/doctor"],
  ];
  for (const [name, href] of expected) {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  }
});

test("only the current tab is marked active", () => {
  render(<TabBar />);
  const current = screen.getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page");
  expect(current.map((l) => l.textContent)).toEqual(["Insights"]);
});

test("hidden on the login page", () => {
  pathname = "/login";
  render(<TabBar />);
  expect(screen.queryByRole("navigation")).toBeNull();
});
