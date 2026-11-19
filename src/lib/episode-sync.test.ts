import { expect, test, vi } from "vitest";
import { makeUpsert } from "./episode-sync";

function fakeClient() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ upsert, update }));
  return { client: { from } as never, from, upsert, update, eq };
}

test("a patch with started_at is upserted by id", async () => {
  const f = fakeClient();
  await makeUpsert(f.client)({ id: "a", started_at: "2026-11-18T14:40:00Z", peak_pain: 7 });
  expect(f.from).toHaveBeenCalledWith("episodes");
  expect(f.upsert).toHaveBeenCalledWith(
    { id: "a", started_at: "2026-11-18T14:40:00Z", peak_pain: 7 },
    { onConflict: "id" },
  );
  expect(f.update).not.toHaveBeenCalled();
});

test("a patch without started_at is an update (partial upsert would violate NOT NULL)", async () => {
  const f = fakeClient();
  await makeUpsert(f.client)({ id: "a", peak_pain: 4 });
  expect(f.update).toHaveBeenCalledWith({ peak_pain: 4 });
  expect(f.eq).toHaveBeenCalledWith("id", "a");
  expect(f.upsert).not.toHaveBeenCalled();
});

test("errors are passed through", async () => {
  const f = fakeClient();
  f.upsert.mockResolvedValue({ error: { message: "nope" } });
  expect(await makeUpsert(f.client)({ id: "a", started_at: "x" })).toEqual({ error: { message: "nope" } });
});
