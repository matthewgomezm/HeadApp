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

test("start and end times; 'Still going' clears the end", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  expect(screen.getByLabelText("Started")).toBeInTheDocument();
  expect(screen.getByLabelText("Ended")).toBeInTheDocument();
  await user.click(screen.getByLabelText("Still going"));
  expect(screen.queryByLabelText("Ended")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave.mock.calls[0][0].endedAt).toBeNull();
});

test("an ended migraine saves its end time", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave.mock.calls[0][0].endedAt).toBe(new Date(2026, 10, 14, 15, 20).toISOString());
});

test("renders all sections", () => {
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={vi.fn()} />);
  for (const h of ["When", "How bad", "Where", "Symptoms", "Medications", "Possible triggers", "Notes"]) {
    expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
  }
});

test("triggers: pick from the combobox list, and it's saved", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  const input = screen.getByRole("combobox", { name: "Possible triggers" });
  await user.click(input);
  await user.type(input, "stre");
  await user.click(await screen.findByRole("option", { name: "stress" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave.mock.calls[0][0].triggers).toEqual(["stress"]);
  expect(onSave.mock.calls[0][0].id).toBe(initial.id);
});

test("triggers: type something new and add it", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  const input = screen.getByRole("combobox", { name: "Possible triggers" });
  await user.click(input);
  await user.type(input, "red wine");
  await user.click(await screen.findByRole("option", { name: 'Add "red wine"' }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave.mock.calls[0][0].triggers).toEqual(["red wine"]);
});

test("where: selected places show as chips and can be removed", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: true, id: initial.id });
  render(
    <EpisodeForm
      initial={{ ...initial, locations: ["left side", "forehead"] }}
      usedTriggers={[]}
      usedMedications={[]}
      onSave={onSave}
    />,
  );
  const where = screen.getByRole("combobox", { name: "Where" }).closest('[data-slot="combobox-chips"]') as HTMLElement;
  expect(where).toHaveTextContent("left side");
  expect(where).toHaveTextContent("forehead");
  await user.click(screen.getByRole("button", { name: "Remove left side" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSave.mock.calls[0][0].locations).toEqual(["forehead"]);
});

test("symptoms use the combobox too, and aura is not offered", async () => {
  const user = userEvent.setup();
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={vi.fn()} />);
  const input = screen.getByRole("combobox", { name: "Symptoms" });
  await user.click(input);
  expect(await screen.findByRole("option", { name: "nausea" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "aura" })).toBeNull();
});

test("combobox inputs are 16px (no iOS zoom)", () => {
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={vi.fn()} />);
  for (const name of ["Where", "Symptoms", "Possible triggers"]) {
    expect(screen.getByRole("combobox", { name })).toHaveClass("text-base");
  }
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

test("a save that throws (offline / signed out) shows an error and re-enables Save", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(
    await screen.findByText("Couldn't save. Check your connection, or sign in again."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
});

test("shows the save error", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue({ ok: false, error: "Start time can't be in the future" });
  render(<EpisodeForm initial={initial} usedTriggers={[]} usedMedications={[]} onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Start time can't be in the future")).toBeInTheDocument();
});
