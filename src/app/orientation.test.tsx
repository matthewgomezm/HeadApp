import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { PainSheet } from "@/components/PainSheet";
import { TabBar } from "@/components/TabBar";
import { HomeScreen } from "@/components/HomeScreen";
import { HistoryList } from "@/components/HistoryList";
import { serializeEpisode } from "@/lib/episode-rows";
import { sampleEpisodes } from "@/lib/sample-data";

// jsdom can't apply media queries, so these check that each screen opts into
// the right orientation rules; the browser check covers how they look.

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/episodes/actions", () => ({ deleteEpisodes: vi.fn() }));

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test("the page utility pads all four sides for the notch, in either orientation", () => {
  const block = css.slice(css.indexOf("@utility page"));
  for (const side of ["top", "right", "bottom", "left"]) {
    expect(block).toContain(`env(safe-area-inset-${side})`);
  }
  expect(css).toMatch(/@custom-variant short \(@media \(max-height: 500px\)\)/);
});

test.each([
  "src/components/HomeScreen.tsx",
  "src/app/history/page.tsx",
  "src/app/episodes/[id]/page.tsx",
  "src/app/episodes/new/page.tsx",
  "src/components/InsightsView.tsx",
  "src/app/loading.tsx",
  "src/app/history/loading.tsx",
  "src/app/episodes/[id]/loading.tsx",
])("%s uses the shared page margins (no fixed px-4)", (file) => {
  const src = read(file);
  expect(src).toMatch(/className="page[ "]/);
  expect(src).not.toMatch(/<main[^>]*\bpx-4\b/);
});

test("Home splits into two columns in landscape", () => {
  render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={new Date(2026, 10, 18, 10)} />);
  const main = screen.getByRole("main");
  expect(main).toHaveClass("landscape:grid", "landscape:grid-cols-2");
  expect(main.children).toHaveLength(2);
  expect(main.children[0]).toContainElement(screen.getByRole("button", { name: /I have a migraine/ }));
  expect(main.children[1]).toContainElement(screen.getByTestId("migraine-totals"));
});

test("the big button shrinks on short (landscape phone) screens", () => {
  render(<HomeScreen name="Jadyn" episodes={[]} now={new Date(2026, 10, 18, 10)} />);
  expect(screen.getByRole("button", { name: /I have a migraine/ })).toHaveClass("short:size-[130px]");
});

test("History shows cards two across in landscape", () => {
  render(<HistoryList initial={sampleEpisodes.map(serializeEpisode)} />);
  const monthLists = screen.getAllByRole("list").filter((l) => l.parentElement?.tagName === "SECTION");
  expect(monthLists.length).toBeGreaterThan(0);
  for (const list of monthLists) expect(list).toHaveClass("landscape:grid-cols-2");
});

test("tab bar keeps clear of the notch on both sides", () => {
  const { container } = render(<TabBar />);
  const bar = container.firstElementChild as HTMLElement;
  expect(bar).toHaveClass("pl-[env(safe-area-inset-left)]", "pr-[env(safe-area-inset-right)]");
});

test("pain screen: side safe areas, one row of ten on short screens", () => {
  render(<PainSheet onPick={vi.fn()} onSkip={vi.fn()} />);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveClass("pl-[max(1rem,env(safe-area-inset-left))]", "pr-[max(1rem,env(safe-area-inset-right))]");
  expect(screen.getByRole("button", { name: "1" }).parentElement).toHaveClass("short:grid-cols-10");
});

test("login page sits side by side in landscape", () => {
  const src = read("src/app/login/page.tsx");
  expect(src).toMatch(/landscape:flex-row/);
  expect(src).toMatch(/safe-area-inset-left/);
});
