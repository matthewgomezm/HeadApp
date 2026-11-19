"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  async function sendCode(email: string) {
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (!error) return null;
    if (error.status === 429) return "Too many tries. Wait a minute and try again.";
    return "Couldn't send a code to that email. Check the address.";
  }

  async function verify(email: string, token: string) {
    const { error } = await createClient().auth.verifyOtp({ email, token, type: "email" });
    if (error) return "That code didn't work. Check it, or request a new one.";
    router.replace("/");
    router.refresh();
    return null;
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <h1 className="mt-10 text-[22px] font-semibold">Migraine Tracker</h1>
      <p className="mt-1 mb-8 text-dusk-muted">Sign in with the code we email you.</p>
      <LoginForm onSendCode={sendCode} onVerify={verify} />
    </main>
  );
}
