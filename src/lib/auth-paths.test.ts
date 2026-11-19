import { expect, test } from "vitest";
import { isPublicPath } from "./auth-paths";

test.each(["/login", "/manifest.webmanifest", "/icon/192", "/icon/512", "/apple-icon"])(
  "%s is public",
  (p) => expect(isPublicPath(p)).toBe(true),
);

test.each(["/", "/history", "/episodes/abc", "/loginx", "/icons"])("%s requires sign-in", (p) =>
  expect(isPublicPath(p)).toBe(false),
);
