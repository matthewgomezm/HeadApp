import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { Episode } from "@/lib/episodes";
import { EpisodeForm } from "./EpisodeForm";

const initial: Episode = {
  id: "6f1c1c1e-0000-4000-8000-000000000001",
  startedAt: new Date(2026, 10, 14, 9, 0),
  endedAt: new Date(2026, 10, 14, 15, 20),
  peakPain: 7,
  locations: [],
  symptoms: [],
  triggers: [],
  notes: "",
  medications: [],
};

test("renders all sections", () => {
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={vi.fn()} />);
  for (const h of ["When", "How bad", "Where", "Symptoms", "Medications", "Possible triggers", "Notes"]) {
    expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
  }
});

test("tapping a trigger chip includes it on save", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "stress" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave.mock.calls[0][0].triggers).toContain("stress");
  expect(onSave.mock.calls[0][0].id).toBe(initial.id);
});

test("used medications appear as chips and can be added", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(
    <EpisodeForm initial={initial} usedTriggers={[]} usedMedications={["Sumatriptan"]} onSave={onSave} />,
  );
  await user.click(screen.getByRole("button", { name: "+ Sumatriptan" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave.mock.calls[0][0].medications).toEqual([
    expect.objectContaining({ name: "Sumatriptan", helped: "unknown" }),
  ]);
});

test("shows the save error", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: false, error: "End time must be after the start" });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("End time must be after the start")).toBeInTheDocument();
});
