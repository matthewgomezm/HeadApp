import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({
  getEpisode: vi.fn().mockResolvedValue(null),
  getUsedNames: vi.fn().mockResolvedValue({ triggers: [], medications: [] }),
}));
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/episodes/actions", () => ({ saveEpisode: vi.fn(), deleteEpisode: vi.fn() }));

test("unknown or someone else's episode → 404", async () => {
  const { default: Page } = await import("./page");
  await expect(Page({ params: Promise.resolve({ id: "6f1c1c1e-0000-4000-8000-000000000009" }) })).rejects.toThrow(
    "NEXT_NOT_FOUND",
  );
  expect(notFound).toHaveBeenCalled();
});
