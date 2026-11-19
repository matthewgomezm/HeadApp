"use client";

import { useRouter } from "next/navigation";
import { PersonIcon } from "@/components/icons/PersonIcon";
import { LoginForm } from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  async function signIn(email: string, password: string) {
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return "Too many tries. Wait a minute and try again.";
      if (error.status === 400) return "Wrong email or password.";
      return "Couldn't sign in. Check your connection and try again.";
    }
    router.replace("/");
    router.refresh();
    return null;
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mb-3 flex size-16 items-center justify-center rounded-2xl border border-dusk-fill bg-dusk-surface">
        <PersonIcon data-testid="login-icon" aria-hidden="true" className="size-10 text-dusk-accent" />
      </div>
      <h1 className="mb-6 text-[22px] font-semibold text-dusk-text">Migraine Tracker</h1>
      <LoginForm onSignIn={signIn} />
    </main>
  );
}
