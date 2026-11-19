import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { TabBar } from "./TabBar";

vi.mock("next/navigation", () => ({ usePathname: () => "/insights" }));

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
