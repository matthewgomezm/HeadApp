"use client";

import { useRouter } from "next/navigation";
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
    <main className="mx-auto max-w-md px-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <h1 className="mt-10 text-[22px] font-semibold">Migraine Tracker</h1>
      <p className="mt-1 mb-8 text-dusk-muted">Sign in once and you&apos;ll stay signed in.</p>
      <LoginForm onSignIn={signIn} />
    </main>
  );
}
