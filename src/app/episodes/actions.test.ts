import { beforeEach, expect, test, vi } from "vitest";

const inFn = vi.fn();
const del = vi.fn(() => ({ in: inFn }));
const from = vi.fn(() => ({ delete: del }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const A = "6f1c1c1e-0000-4000-8000-000000000001";
const B = "6f1c1c1e-0000-4000-8000-000000000002";

beforeEach(() => {
  inFn.mockReset().mockResolvedValue({ error: null });
  del.mockClear();
  from.mockClear();
});

test("deletes all the given migraines in one request", async () => {
  const { deleteEpisodes } = await import("./actions");
  expect(await deleteEpisodes([A, B])).toEqual({ ok: true, count: 2 });
  expect(from).toHaveBeenCalledWith("episodes");
  expect(inFn).toHaveBeenCalledWith("id", [A, B]);
});

test("rejects anything that isn't a list of ids, without touching the database", async () => {
  const { deleteEpisodes } = await import("./actions");
  expect((await deleteEpisodes([A, "nope"])).ok).toBe(false);
  expect((await deleteEpisodes("x" as unknown as string[])).ok).toBe(false);
  expect(from).not.toHaveBeenCalled();
});

test("an empty selection is a no-op", async () => {
  const { deleteEpisodes } = await import("./actions");
  expect(await deleteEpisodes([])).toEqual({ ok: true, count: 0 });
  expect(from).not.toHaveBeenCalled();
});

test("a database error is reported", async () => {
  inFn.mockResolvedValue({ error: { message: "boom" } });
  const { deleteEpisodes } = await import("./actions");
  expect(await deleteEpisodes([A])).toEqual({ ok: false, error: "Couldn't delete. Try again." });
});
