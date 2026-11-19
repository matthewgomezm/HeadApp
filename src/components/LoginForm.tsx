"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = {
  /** Resolve to an error message, or null on success. */
  onSignIn: (email: string, password: string) => Promise<string | null>;
};

// Based on shadcn's login-01 card. Left out on purpose: "Login with Google"
// (not set up), "Sign up" (sign-ups are off) and "Forgot password" (needs
// email, which isn't configured) — each would be a dead end for her.
const inputClass = "h-12 rounded-xl border-dusk-fill bg-dusk-bg px-4 text-base text-dusk-text";

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
    <Card className="mx-auto w-full max-w-sm rounded-2xl border border-dusk-fill bg-dusk-surface ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dusk-text">Sign in to your account</CardTitle>
        <CardDescription className="text-dusk-muted">
          Sign in once and you&apos;ll stay signed in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email" className="text-dusk-muted">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="text-dusk-muted">
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <Field>
              <Button
                type="submit"
                disabled={busy || email.trim() === "" || password === ""}
                className="h-12 rounded-xl text-base font-semibold"
              >
                Sign in
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
