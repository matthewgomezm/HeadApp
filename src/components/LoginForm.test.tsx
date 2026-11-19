import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginForm } from "./LoginForm";

test("send code, then verify", async () => {
  const user = userEvent.setup();
  const onSendCode = vi.fn().mockResolvedValue(null);
  const onVerify = vi.fn().mockResolvedValue(null);
  render(<LoginForm onSendCode={onSendCode} onVerify={onVerify} />);

  await user.type(screen.getByLabelText("Email"), "j@example.com");
  await user.click(screen.getByRole("button", { name: "Send code" }));
  expect(onSendCode).toHaveBeenCalledWith("j@example.com");

  await user.type(await screen.findByLabelText("6-digit code"), "123456");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(onVerify).toHaveBeenCalledWith("j@example.com", "123456");
});

test("shows verify error", async () => {
  const user = userEvent.setup();
  render(
    <LoginForm
      onSendCode={vi.fn().mockResolvedValue(null)}
      onVerify={vi.fn().mockResolvedValue("Invalid code")}
    />,
  );
  await user.type(screen.getByLabelText("Email"), "j@example.com");
  await user.click(screen.getByRole("button", { name: "Send code" }));
  await user.type(await screen.findByLabelText("6-digit code"), "000000");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Invalid code")).toBeInTheDocument();
});

test("send code disabled for empty email", () => {
  render(<LoginForm onSendCode={vi.fn()} onVerify={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Send code" })).toBeDisabled();
});
