import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

test("login page shows the app icon above the title, in Dusk amber", () => {
  render(<LoginPage />);
  const icon = screen.getByTestId("login-icon");
  expect(icon.tagName.toLowerCase()).toBe("svg");
  expect(icon).toHaveAttribute("aria-hidden", "true");
  expect(icon).toHaveClass("text-dusk-accent");
  const title = screen.getByRole("heading", { name: "Migraine Tracker" });
  expect(icon.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
