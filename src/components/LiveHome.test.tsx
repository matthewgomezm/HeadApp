import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { enqueue, pending } from "@/lib/log-queue";
import { MemStorage } from "@/test/mem-storage";
import { LiveHome } from "./LiveHome";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

let storage: MemStorage;
beforeEach(() => {
  storage = new MemStorage();
  refresh.mockClear();
});

test("double tap creates exactly one episode", async () => {
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  const btn = screen.getByRole("button", { name: /I have a migraine/ });
  await act(async () => {
    fireEvent.click(btn);
    fireEvent.click(btn);
  });
  expect(pending(storage)).toHaveLength(1);
});

test("tap → pain sheet → pick 7 → upserted with pain", async () => {
  const user = userEvent.setup();
  const upsert = vi.fn().mockResolvedValue({ error: null });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  await user.click(screen.getByRole("button", { name: /I have a migraine/ }));
  expect(screen.getByRole("heading", { name: "How bad is it?" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "7" }));
  const last = upsert.mock.calls.at(-1)![0];
  expect(last.peak_pain).toBe(7);
  expect(typeof last.id).toBe("string");
  expect(pending(storage)).toEqual([]);
  expect(refresh).toHaveBeenCalled();
});

test("an unsynced open episode shows as in progress after reload", () => {
  enqueue({ id: "q1", patch: { started_at: new Date().toISOString() } }, storage);
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  expect(screen.getByText(/Migraine in progress since/)).toBeInTheDocument();
});

test("It's over on a server-open episode switches back to the big button", async () => {
  const user = userEvent.setup();
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  const open = {
    id: "srv1",
    startedAt: new Date().toISOString(),
    endedAt: null,
    peakPain: 5,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
  };
  render(<LiveHome name="Jadyn" initial={[open]} upsert={upsert} storage={storage} />);
  await user.click(screen.getByRole("button", { name: "It's over" }));
  expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
  expect(pending(storage)[0]).toMatchObject({ id: "srv1", patch: { ended_at: expect.any(String) } });
});
