import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginForm } from "./LoginForm";

test("signs in with email and password", async () => {
  const user = userEvent.setup();
  const onSignIn = vi.fn().mockResolvedValue(null);
  render(<LoginForm onSignIn={onSignIn} />);
  await user.type(screen.getByLabelText("Email"), "j@example.com");
  await user.type(screen.getByLabelText("Password"), "s3cret-pass");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(onSignIn).toHaveBeenCalledWith("j@example.com", "s3cret-pass");
});

test("shows the sign-in error", async () => {
  const user = userEvent.setup();
  render(<LoginForm onSignIn={vi.fn().mockResolvedValue("Wrong email or password")} />);
  await user.type(screen.getByLabelText("Email"), "j@example.com");
  await user.type(screen.getByLabelText("Password"), "nope");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Wrong email or password")).toBeInTheDocument();
});

test("sign in disabled until both fields are filled", async () => {
  const user = userEvent.setup();
  render(<LoginForm onSignIn={vi.fn()} />);
  const btn = screen.getByRole("button", { name: "Sign in" });
  expect(btn).toBeDisabled();
  await user.type(screen.getByLabelText("Email"), "j@example.com");
  expect(btn).toBeDisabled();
  await user.type(screen.getByLabelText("Password"), "x");
  expect(btn).toBeEnabled();
});

test("password field uses the password manager hints", () => {
  render(<LoginForm onSignIn={vi.fn()} />);
  const pw = screen.getByLabelText("Password");
  expect(pw).toHaveAttribute("type", "password");
  expect(pw).toHaveAttribute("autocomplete", "current-password");
});
