"use client";

import { useState, type FormEvent } from "react";

type Props = {
  /** Resolve to an error message, or null on success. */
  onSignIn: (email: string, password: string) => Promise<string | null>;
};

const input =
  "mt-1 block w-full rounded-xl bg-dusk-surface px-4 py-3 text-base text-dusk-text placeholder:text-dusk-muted outline-none focus-visible:ring-2 focus-visible:ring-dusk-accent";

export function LoginForm({ onSignIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSignIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm">
      <label className="block">
        <span className="text-sm text-dusk-muted">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      <label className="mt-4 block">
        <span className="text-sm text-dusk-muted">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </label>
      <button
        type="submit"
        disabled={busy || email.trim() === "" || password === ""}
        className="mt-6 min-h-12 w-full rounded-xl bg-dusk-fill px-4 py-3 font-semibold text-dusk-accent disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-dusk-accent"
      >
        Sign in
      </button>
      {error && (
        <p role="alert" className="mt-4 text-dusk-accent">
          {error}
        </p>
      )}
    </form>
  );
}
