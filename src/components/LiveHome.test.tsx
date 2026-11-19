import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { enqueue, pending } from "@/lib/log-queue";
import { MemStorage } from "@/test/mem-storage";
import { LiveHome } from "./LiveHome";

const refresh = vi.fn();
const router = { refresh }; // stable, like the real Next router
vi.mock("next/navigation", () => ({ useRouter: () => router }));

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

test("returning to the app retries sending queued taps", async () => {
  enqueue({ id: "q1", patch: { started_at: new Date().toISOString() } }, storage);
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  await act(async () => {});
  const before = upsert.mock.calls.length;
  upsert.mockResolvedValue({ error: null });
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(upsert.mock.calls.length).toBeGreaterThan(before);
  expect(pending(storage)).toEqual([]);
});

test("an unsynced tap shows as in progress after reload", () => {
  enqueue({ id: "q1", patch: { started_at: new Date().toISOString(), peak_pain: 5 } }, storage);
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  expect(screen.getByRole("button", { name: /It's over/ })).toBeInTheDocument();
});

test("press to start, pick pain, press again to end: duration tracked automatically", async () => {
  const user = userEvent.setup();
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  await user.click(screen.getByRole("button", { name: /I have a migraine/ }));
  await user.click(screen.getByRole("button", { name: "6" }));
  await user.click(screen.getByRole("button", { name: /It's over/ }));
  expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
  const [op] = pending(storage);
  expect(op.patch.started_at).toEqual(expect.any(String));
  expect(op.patch.peak_pain).toBe(6);
  expect(op.patch.ended_at).toEqual(expect.any(String));
  expect(new Date(op.patch.ended_at!) >= new Date(op.patch.started_at!)).toBe(true);
});

test("double-tapping It's over ends it without starting a new migraine", async () => {
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  enqueue({ id: "q1", patch: { started_at: new Date(Date.now() - 600_000).toISOString() } }, storage);
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /It's over/ }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /I have a migraine/ }));
  });
  expect(pending(storage)).toHaveLength(1);
  expect(screen.queryByRole("heading", { name: "How bad is it?" })).toBeNull();
});

test("ending a migraine that is already saved sends just the end time", async () => {
  const user = userEvent.setup();
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  const open = {
    id: "srv1",
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
    endedAt: null,
    peakPain: 5,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
  };
  render(<LiveHome name="Jadyn" initial={[open]} upsert={upsert} storage={storage} />);
  await user.click(screen.getByRole("button", { name: /It's over/ }));
  expect(pending(storage)).toEqual([{ id: "srv1", patch: { ended_at: expect.any(String) } }]);
  expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
});
