import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { Episode } from "@/lib/episodes";
import { sampleEpisodes } from "@/lib/sample-data";
import { HomeScreen } from "./HomeScreen";

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

  test("long trigger names wrap", () => {
    const long = "a".repeat(80);
    const e: Episode = { ...sampleEpisodes[0], triggers: [long] };
    render(<HomeScreen name="Jadyn" episodes={[e]} now={now} />);
    const card = screen.getByText(long).closest("[data-testid='episode-card']");
    expect(card).toHaveClass("break-words");
  });
});
