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
    <main className="flex min-h-svh flex-col items-center justify-center pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] landscape:flex-row landscape:gap-12">
      <div className="flex flex-col items-center">
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl border border-dusk-fill bg-dusk-surface">
          <PersonIcon data-testid="login-icon" aria-hidden="true" className="size-10 text-dusk-accent" />
        </div>
        <h1 className="mb-6 text-[22px] font-semibold text-dusk-text landscape:mb-0">Migraine Tracker</h1>
      </div>
      <div className="w-full max-w-sm">
        <LoginForm onSignIn={signIn} />
      </div>
    </main>
  );
}
