import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { serializeEpisode } from "@/lib/episode-rows";
import { sampleEpisodes } from "@/lib/sample-data";
import { HistoryList } from "./HistoryList";

const deleteEpisodes = vi.fn();
vi.mock("@/app/episodes/actions", () => ({
  deleteEpisodes: (...a: unknown[]) => deleteEpisodes(...a),
}));
const refresh = vi.fn();
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const initial = sampleEpisodes.map(serializeEpisode);
const ids = sampleEpisodes.map((e) => e.id);

beforeEach(() => {
  deleteEpisodes.mockReset();
  refresh.mockReset();
});

test("normally each migraine opens its details", () => {
  render(<HistoryList initial={initial} />);
  expect(screen.getByRole("link", { name: /Sat, Nov 14/ })).toHaveAttribute("href", `/episodes/${ids[0]}`);
  expect(screen.queryByRole("button", { name: "Select all" })).toBeNull();
});

test("Select mode: tap to tick, Select all, Clear all", async () => {
  const user = userEvent.setup();
  render(<HistoryList initial={initial} />);
  await user.click(screen.getByRole("button", { name: "Select" }));
  expect(screen.queryByRole("link", { name: /Sat, Nov 14/ })).toBeNull();

  await user.click(screen.getByRole("checkbox", { name: /Sat, Nov 14/ }));
  expect(screen.getByRole("checkbox", { name: /Sat, Nov 14/ })).toBeChecked();
  expect(screen.getByRole("button", { name: /Hold to delete 1/ })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Select all" }));
  for (const box of screen.getAllByRole("checkbox")) expect(box).toBeChecked();
  expect(screen.getByRole("button", { name: /Hold to delete 3/ })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Clear all" }));
  for (const box of screen.getAllByRole("checkbox")) expect(box).not.toBeChecked();
  expect(screen.getByRole("button", { name: /Hold to delete/ })).toBeDisabled();
});

test("holding deletes every selected migraine in one go", async () => {
  const user = userEvent.setup();
  deleteEpisodes.mockResolvedValue({ ok: true, count: 3 });
  render(<HistoryList initial={initial} />);
  await user.click(screen.getByRole("button", { name: "Select" }));
  await user.click(screen.getByRole("button", { name: "Select all" }));
  await act(async () => {
    fireEvent.pointerDown(screen.getByRole("button", { name: /Hold to delete 3/ }), { button: 0, pointerId: 1 });
  });
  await waitFor(() => expect(deleteEpisodes).toHaveBeenCalledTimes(1), { timeout: 3000 });
  expect([...deleteEpisodes.mock.calls[0][0]].sort()).toEqual([...ids].sort());
  await waitFor(() => expect(refresh).toHaveBeenCalled());
});

test("a quick tap on the delete bar deletes nothing", async () => {
  const user = userEvent.setup();
  render(<HistoryList initial={initial} />);
  await user.click(screen.getByRole("button", { name: "Select" }));
  await user.click(screen.getByRole("button", { name: "Select all" }));
  await user.click(screen.getByRole("button", { name: /Hold to delete 3/ }));
  await new Promise((r) => setTimeout(r, 1500));
  expect(deleteEpisodes).not.toHaveBeenCalled();
});

test("a failed bulk delete is reported and the selection kept", async () => {
  const user = userEvent.setup();
  deleteEpisodes.mockResolvedValue({ ok: false, error: "Couldn't delete. Try again." });
  render(<HistoryList initial={initial} />);
  await user.click(screen.getByRole("button", { name: "Select" }));
  await user.click(screen.getByRole("button", { name: "Select all" }));
  await act(async () => {
    fireEvent.pointerDown(screen.getByRole("button", { name: /Hold to delete 3/ }), { button: 0, pointerId: 1 });
  });
  expect(await screen.findByText("Couldn't delete. Try again.", {}, { timeout: 3000 })).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
});

test("Cancel leaves select mode", async () => {
  const user = userEvent.setup();
  render(<HistoryList initial={initial} />);
  await user.click(screen.getByRole("button", { name: "Select" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("link", { name: /Sat, Nov 14/ })).toBeInTheDocument();
  expect(within(document.body).queryByRole("checkbox")).toBeNull();
});
