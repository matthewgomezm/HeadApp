import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { SignOutButton } from "./SignOutButton";

const replace = vi.fn();
const refresh = vi.fn();
const router = { replace, refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  replace.mockReset();
  refresh.mockReset();
});

test("asks before signing out; Cancel keeps her signed in", async () => {
  const user = userEvent.setup();
  const signOut = vi.fn();
  render(<SignOutButton signOut={signOut} syncPending={vi.fn().mockResolvedValue(true)} />);
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(screen.getByText("Sign out of this device?")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(signOut).not.toHaveBeenCalled();
  expect(screen.queryByText("Sign out of this device?")).toBeNull();
});

test("confirming syncs first, signs out and goes to the login page", async () => {
  const user = userEvent.setup();
  const order: string[] = [];
  const syncPending = vi.fn(async () => (order.push("sync"), true));
  const signOut = vi.fn(async () => (order.push("signOut"), null));
  render(<SignOutButton signOut={signOut} syncPending={syncPending} />);
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  await user.click(screen.getByRole("button", { name: "Yes, sign out" }));
  expect(order).toEqual(["sync", "signOut"]);
  expect(replace).toHaveBeenCalledWith("/login");
});

test("won't sign out while taps are still waiting to sync (they'd be lost)", async () => {
  const user = userEvent.setup();
  const signOut = vi.fn();
  render(<SignOutButton signOut={signOut} syncPending={vi.fn().mockResolvedValue(false)} />);
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  await user.click(screen.getByRole("button", { name: "Yes, sign out" }));
  expect(signOut).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(/haven't saved yet/);
  expect(replace).not.toHaveBeenCalled();
});

test("a failed sign out is reported", async () => {
  const user = userEvent.setup();
  render(
    <SignOutButton
      signOut={vi.fn().mockResolvedValue("Couldn't sign out. Try again.")}
      syncPending={vi.fn().mockResolvedValue(true)}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  await user.click(screen.getByRole("button", { name: "Yes, sign out" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Couldn't sign out. Try again.");
  expect(replace).not.toHaveBeenCalled();
});

test("buttons are 48px tap targets", async () => {
  const user = userEvent.setup();
  render(<SignOutButton signOut={vi.fn()} syncPending={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Sign out" })).toHaveClass("min-h-12");
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(screen.getByRole("button", { name: "Yes, sign out" })).toHaveClass("min-h-12");
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("min-h-12");
});
