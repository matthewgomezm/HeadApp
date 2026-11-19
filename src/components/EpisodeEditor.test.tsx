import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { EpisodeEditor } from "./EpisodeEditor";

const saveEpisode = vi.fn();
const deleteEpisode = vi.fn();
vi.mock("@/app/episodes/actions", () => ({
  saveEpisode: (...a: unknown[]) => saveEpisode(...a),
  deleteEpisode: (...a: unknown[]) => deleteEpisode(...a),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => {
  saveEpisode.mockReset();
  deleteEpisode.mockReset();
  push.mockReset();
});

test("a new migraine gets its id up front, so a retried save can't duplicate it", async () => {
  const user = userEvent.setup();
  saveEpisode.mockResolvedValueOnce({ ok: false, error: "Couldn't save medications. Try again." });
  saveEpisode.mockResolvedValueOnce({ ok: true, id: "x" });
  render(<EpisodeEditor initial={null} usedTriggers={[]} usedMedications={[]} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  const [first, second] = saveEpisode.mock.calls.map((c) => c[0].id);
  expect(first).toMatch(UUID);
  expect(second).toBe(first);
});

test("a new migraine has no delete button", () => {
  render(<EpisodeEditor initial={null} usedTriggers={[]} usedMedications={[]} />);
  expect(screen.queryByRole("button", { name: "Delete this migraine" })).toBeNull();
});

test("a failed delete is reported", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  deleteEpisode.mockResolvedValue({ ok: false, error: "Couldn't delete. Try again." });
  const initial = {
    id: "6f1c1c1e-0000-4000-8000-000000000001",
    startedAt: new Date(2026, 10, 14, 9).toISOString(),
    peakPain: 5,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
  };
  render(<EpisodeEditor initial={initial} usedTriggers={[]} usedMedications={[]} />);
  await user.click(screen.getByRole("button", { name: "Delete this migraine" }));
  expect(await screen.findByText("Couldn't delete. Try again.")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
