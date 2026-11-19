import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PainSheet } from "./PainSheet";

test("ten pain buttons, pick and skip", async () => {
  const user = userEvent.setup();
  const onPick = vi.fn();
  const onSkip = vi.fn();
  render(<PainSheet onPick={onPick} onSkip={onSkip} />);
  expect(screen.getByRole("heading", { name: "How bad is it?" })).toBeInTheDocument();
  for (let n = 1; n <= 10; n++) {
    expect(screen.getByRole("button", { name: String(n) })).toBeInTheDocument();
  }
  await user.click(screen.getByRole("button", { name: "7" }));
  expect(onPick).toHaveBeenCalledWith(7);
  await user.click(screen.getByRole("button", { name: "Skip" }));
  expect(onSkip).toHaveBeenCalled();
});
