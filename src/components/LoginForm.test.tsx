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

test("form sits in shadcn's login card with a title", () => {
  render(<LoginForm onSignIn={vi.fn()} />);
  const card = screen.getByLabelText("Email").closest('[data-slot="card"]');
  expect(card).not.toBeNull();
  expect(card).toHaveTextContent("Sign in to your account");
});

test("no dead links: no Google, sign-up or forgot-password", () => {
  render(<LoginForm onSignIn={vi.fn()} />);
  expect(screen.queryByText(/Google/i)).toBeNull();
  expect(screen.queryByText(/Sign up/i)).toBeNull();
  expect(screen.queryByText(/Forgot/i)).toBeNull();
});

test("inputs are ≥16px (stops iOS zooming in) and 48px tall", () => {
  render(<LoginForm onSignIn={vi.fn()} />);
  for (const input of [screen.getByLabelText("Email"), screen.getByLabelText("Password")]) {
    expect(input).toHaveClass("text-base", "h-12");
  }
});

test("password field uses the password manager hints", () => {
  render(<LoginForm onSignIn={vi.fn()} />);
  const pw = screen.getByLabelText("Password");
  expect(pw).toHaveAttribute("type", "password");
  expect(pw).toHaveAttribute("autocomplete", "current-password");
});
