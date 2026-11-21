import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Episode } from "@/lib/episodes";
import { sampleEpisodes } from "@/lib/sample-data";
import { HomeScreen } from "./HomeScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

const now = new Date(2026, 10, 18, 10, 0);

describe("HomeScreen", () => {
  test("shows greeting, days since, log button and hint", () => {
    render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={now} />);
    expect(screen.getByText("Hi Jadyn")).toBeInTheDocument();
    expect(screen.getByText("4 days since your last migraine")).toBeInTheDocument();
    expect(screen.getByText("Details can wait until you feel better")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
    expect(screen.getByText("Sat, Nov 14 · 7/10")).toBeInTheDocument();
    expect(screen.getByText("poor sleep")).toBeInTheDocument();
  });

  test("empty state", () => {
    render(<HomeScreen name="Jadyn" episodes={[]} now={now} />);
    expect(screen.getByText("No migraines logged yet")).toBeInTheDocument();
    expect(screen.queryByText(/\/10/)).toBeNull();
    expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
  });


  test("latest migraine card links to its details", () => {
    render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={now} />);
    expect(screen.getByRole("link", { name: /Sat, Nov 14/ })).toHaveAttribute(
      "href",
      `/episodes/${sampleEpisodes[0].id}`,
    );
  });

  test("date, greeting and days-since sit together in one framed card, above the button", () => {
    render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={now} />);
    const greeting = screen.getByRole("heading", { name: "Hi Jadyn" });
    const card = greeting.closest('[data-slot="card"]') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent("Wed, Nov 18");
    expect(card).toHaveTextContent("4 days since your last migraine");
    expect(card).not.toContainElement(screen.getByRole("button", { name: /I have a migraine/ }));
  });

  test("Sign out is in the header card", () => {
    render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={now} />);
    const card = screen.getByRole("heading", { name: "Hi Jadyn" }).closest('[data-slot="card"]') as HTMLElement;
    expect(card).toContainElement(screen.getByRole("button", { name: "Sign out" }));
  });

  test("shows a migraine totals card (last 30 days by default)", () => {
    render(<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={now} />);
    // sample migraines on Oct 22, Nov 3 and Nov 14: all within the last 30 days
    const card = screen.getByTestId("migraine-totals");
    expect(card).toHaveTextContent("Migraines");
    expect(card.querySelector(".sr-only")?.textContent).toBe("3");
    expect(card).toHaveTextContent("Severe (7–10)");
  });

  test("while a migraine is going, the big button becomes It's over with the elapsed time", () => {
    const open: Episode = { ...sampleEpisodes[0], id: "open1", startedAt: new Date(2026, 10, 18, 9, 5), endedAt: null };
    render(<HomeScreen name="Jadyn" episodes={[open, ...sampleEpisodes]} now={now} />);
    expect(screen.getByRole("button", { name: /It's over/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /I have a migraine/ })).toBeNull();
    expect(screen.getByText("Started 9:05 AM · 55m so far")).toBeInTheDocument();
    expect(screen.getByText("Migraine in progress")).toBeInTheDocument();
  });

  test("days since counts from when the last migraine ended", () => {
    const e: Episode = {
      ...sampleEpisodes[0],
      startedAt: new Date(2026, 10, 17, 23, 0),
      endedAt: new Date(2026, 10, 18, 3, 0),
    };
    render(<HomeScreen name="Jadyn" episodes={[e]} now={now} />);
    expect(screen.getByText("Your last migraine was today")).toBeInTheDocument();
  });

  test("long trigger names wrap", () => {
    const long = "a".repeat(80);
    const e: Episode = { ...sampleEpisodes[0], triggers: [long] };
    render(<HomeScreen name="Jadyn" episodes={[e]} now={now} />);
    const card = screen.getByText(long).closest("[data-testid='episode-card']");
    expect(card).toHaveClass("break-words");
  });
});
