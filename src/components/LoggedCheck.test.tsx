import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { LoggedCheck } from "./LoggedCheck";

test("announces the message politely and draws a check", () => {
  const { container } = render(<LoggedCheck message="Logged 10:38 PM" />);
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveTextContent("Logged 10:38 PM");
  expect(container.querySelector("svg path")).not.toBeNull();
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});
