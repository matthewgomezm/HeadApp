import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  expect(screen.queryByRole("button", { name: /Hold to delete/ })).toBeNull();
});

const saved = {
  id: "6f1c1c1e-0000-4000-8000-000000000001",
  startedAt: new Date(2026, 10, 14, 9).toISOString(),
  endedAt: new Date(2026, 10, 14, 11).toISOString(),
  peakPain: 5,
  locations: [],
  symptoms: [],
  triggers: [],
  notes: "",
  medications: [],
};

/** Press and keep holding the delete button (released only by the test ending). */
function holdDelete() {
  const btn = screen.getByRole("button", { name: /Hold to delete/ });
  fireEvent.pointerDown(btn, { button: 0, pointerId: 1 });
  return btn;
}

test("delete is hold-to-confirm: no pop-up, and a quick tap deletes nothing", async () => {
  const confirm = vi.spyOn(window, "confirm");
  render(<EpisodeEditor initial={saved} usedTriggers={[]} usedMedications={[]} />);
  const btn = holdDelete();
  fireEvent.pointerUp(btn, { button: 0, pointerId: 1 });
  await new Promise((r) => setTimeout(r, 1500));
  expect(deleteEpisode).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});

test("holding the button deletes and returns to History", async () => {
  deleteEpisode.mockResolvedValue({ ok: true, id: saved.id });
  render(<EpisodeEditor initial={saved} usedTriggers={[]} usedMedications={[]} />);
  holdDelete();
  await waitFor(() => expect(deleteEpisode).toHaveBeenCalledWith(saved.id), { timeout: 3000 });
  await waitFor(() => expect(push).toHaveBeenCalledWith("/history"));
});

test("a failed delete is reported", async () => {
  deleteEpisode.mockResolvedValue({ ok: false, error: "Couldn't delete. Try again." });
  render(<EpisodeEditor initial={saved} usedTriggers={[]} usedMedications={[]} />);
  holdDelete();
  expect(await screen.findByText("Couldn't delete. Try again.", {}, { timeout: 3000 })).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
