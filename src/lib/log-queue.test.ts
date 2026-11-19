import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemStorage } from "@/test/mem-storage";
import { enqueue, flush, localOpenEpisode, pending } from "./log-queue";

let s: MemStorage;
beforeEach(() => {
  s = new MemStorage();
});

const T0 = "2026-11-18T14:40:00.000Z";

describe("enqueue", () => {
  test("merges patches for the same id", () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    enqueue({ id: "a", patch: { peak_pain: 7 } }, s);
    expect(pending(s)).toEqual([{ id: "a", patch: { started_at: T0, peak_pain: 7 } }]);
  });

  test("keeps insertion order across ids", () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    enqueue({ id: "b", patch: { started_at: T0 } }, s);
    enqueue({ id: "a", patch: { peak_pain: 3 } }, s);
    expect(pending(s).map((o) => o.id)).toEqual(["a", "b"]);
  });

  test("storage that throws does not throw", () => {
    const bad = new MemStorage();
    bad.setItem = () => {
      throw new Error("QuotaExceeded");
    };
    expect(() => enqueue({ id: "a", patch: { started_at: T0 } }, bad)).not.toThrow();
  });
});

describe("flush", () => {
  test("sends all ops in order and empties the queue", async () => {
    enqueue({ id: "a", patch: { started_at: T0, peak_pain: 7 } }, s);
    enqueue({ id: "b", patch: { started_at: T0 } }, s);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    expect(await flush(upsert, s)).toEqual({ sent: 2, failed: 0 });
    expect(upsert.mock.calls.map((c) => c[0])).toEqual([
      { id: "a", started_at: T0, peak_pain: 7 },
      { id: "b", started_at: T0 },
    ]);
    expect(pending(s)).toEqual([]);
  });

  test("stops at first failure and keeps everything", async () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    enqueue({ id: "b", patch: { started_at: T0 } }, s);
    const upsert = vi.fn().mockResolvedValue({ error: new Error("offline") });
    expect(await flush(upsert, s)).toEqual({ sent: 0, failed: 1 });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(pending(s).map((o) => o.id)).toEqual(["a", "b"]);
  });

  test("a thrown network error counts as a failure", async () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    const upsert = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await flush(upsert, s)).toEqual({ sent: 0, failed: 1 });
    expect(pending(s)).toHaveLength(1);
  });

  test("concurrent flushes send each op at most once", async () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const upsert = vi.fn().mockImplementation(async () => {
      await gate;
      return { error: null };
    });
    const p1 = flush(upsert, s);
    const p2 = flush(upsert, s);
    release();
    await Promise.all([p1, p2]);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  test("an op queued during an in-flight flush is sent before that flush settles", async () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const upsert = vi
      .fn()
      .mockImplementationOnce(async () => {
        await gate;
        return { error: null };
      })
      .mockResolvedValue({ error: null });
    const first = flush(upsert, s);
    enqueue({ id: "a", patch: { peak_pain: 6 } }, s); // e.g. pain picked while start is sending
    const second = flush(upsert, s);
    release();
    await Promise.all([first, second]);
    expect(upsert).toHaveBeenLastCalledWith({ id: "a", peak_pain: 6 });
    expect(pending(s)).toEqual([]);
  });

  test("patch added while sending is not lost", async () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    const upsert = vi.fn().mockImplementation(async () => {
      enqueue({ id: "a", patch: { peak_pain: 5 } }, s);
      return { error: null };
    });
    await flush(upsert, s);
    expect(upsert.mock.calls[1][0]).toEqual({ id: "a", peak_pain: 5 });
    expect(pending(s)).toEqual([]);
  });
});

describe("localOpenEpisode", () => {
  test("returns the queued open episode", () => {
    enqueue({ id: "a", patch: { started_at: T0, peak_pain: 6 } }, s);
    expect(localOpenEpisode(s)).toEqual({ id: "a", startedAt: new Date(T0), peakPain: 6 });
  });

  test("null once ended", () => {
    enqueue({ id: "a", patch: { started_at: T0 } }, s);
    enqueue({ id: "a", patch: { ended_at: "2026-11-18T16:00:00.000Z" } }, s);
    expect(localOpenEpisode(s)).toBeNull();
  });

  test("null when queue empty", () => expect(localOpenEpisode(s)).toBeNull());
});
