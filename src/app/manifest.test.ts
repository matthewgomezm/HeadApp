import { expect, test } from "vitest";
import manifest from "./manifest";

test("manifest is standalone and Dusk-colored", () => {
  const m = manifest();
  expect(m.display).toBe("standalone");
  expect(m.background_color).toBe("#1d1a17");
  expect(m.theme_color).toBe("#1d1a17");
  expect(m.name).toBe("Migraine Tracker");
  expect(m.short_name).toBe("Migraines");
  expect(m.start_url).toBe("/");
  const sizes = (m.icons ?? []).map((i) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
});
