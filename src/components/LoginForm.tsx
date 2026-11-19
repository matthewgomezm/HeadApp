"use client";

import { useState, type FormEvent } from "react";

type Props = {
  /** Resolve to an error message, or null on success. */
  onSendCode: (email: string) => Promise<string | null>;
  onVerify: (email: string, code: string) => Promise<string | null>;
};

const input =
  "mt-1 block w-full rounded-xl bg-dusk-surface px-4 py-3 text-base text-dusk-text placeholder:text-dusk-muted outline-none focus-visible:ring-2 focus-visible:ring-dusk-accent";
const primary =
  "mt-4 min-h-12 w-full rounded-xl bg-dusk-fill px-4 py-3 font-semibold text-dusk-accent disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-dusk-accent";

export function LoginForm({ onSendCode, onVerify }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<string | null>, next?: () => void) {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    else next?.();
  }

  function sendCode(e: FormEvent) {
    e.preventDefault();
    run(() => onSendCode(email.trim()), () => setStep("code"));
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    run(() => onVerify(email.trim(), code.trim()));
  }

  return (
    <div className="mx-auto max-w-sm">
      {step === "email" ? (
        <form onSubmit={sendCode}>
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
          <button type="submit" disabled={busy || email.trim() === ""} className={primary}>
            Send code
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="text-dusk-muted">We emailed a code to {email.trim()}.</p>
          <label className="mt-4 block">
            <span className="text-sm text-dusk-muted">6-digit code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${input} tracking-[0.4em]`}
            />
          </label>
          <button type="submit" disabled={busy || code.length !== 6} className={primary}>
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="mt-2 min-h-12 w-full text-sm text-dusk-muted"
          >
            Use a different email
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-dusk-accent">
          {error}
        </p>
      )}
    </div>
  );
}
