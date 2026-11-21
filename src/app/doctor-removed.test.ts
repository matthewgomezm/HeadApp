import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import nextConfig from "../../next.config";

test("the Doctor page is gone for good", () => {
  expect(existsSync(join(process.cwd(), "src/app/doctor"))).toBe(false);
});

test("old /doctor links (e.g. a home-screen bookmark) land on Insights", async () => {
  const redirects = await nextConfig.redirects!();
  expect(redirects).toContainEqual({ source: "/doctor", destination: "/insights", permanent: true });
});
