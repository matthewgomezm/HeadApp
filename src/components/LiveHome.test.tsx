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

test("an unsynced tap shows as today's migraine after reload", () => {
  enqueue({ id: "q1", patch: { started_at: new Date().toISOString(), peak_pain: 5 } }, storage);
  const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  expect(screen.getByText("Your last migraine was today")).toBeInTheDocument();
  expect(screen.getByText(/5\/10/)).toBeInTheDocument();
});

test("after picking pain, the big button is available again", async () => {
  const user = userEvent.setup();
  const upsert = vi.fn().mockResolvedValue({ error: null });
  render(<LiveHome name="Jadyn" initial={[]} upsert={upsert} storage={storage} />);
  await user.click(screen.getByRole("button", { name: /I have a migraine/ }));
  await user.click(screen.getByRole("button", { name: "Skip" }));
  expect(screen.getByRole("button", { name: /I have a migraine/ })).toBeInTheDocument();
  expect(screen.queryByText(/in progress/i)).toBeNull();
});
