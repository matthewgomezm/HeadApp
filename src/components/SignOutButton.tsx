"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { lazyBrowserUpsert } from "@/lib/episode-sync";
import { flush } from "@/lib/log-queue";

type Props = {
  /** Injected in tests. Resolves to an error message, or null. */
  signOut?: () => Promise<string | null>;
  /** Injected in tests. Resolves true once nothing is left waiting to sync. */
  syncPending?: () => Promise<boolean>;
};

async function defaultSignOut(): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/client");
  const { error } = await createClient().auth.signOut();
  return error ? "Couldn't sign out. Try again." : null;
}

async function defaultSyncPending(): Promise<boolean> {
  const { failed } = await flush(lazyBrowserUpsert);
  return failed === 0;
}

const btn =
  "min-h-12 rounded-xl px-3 text-sm focus-visible:outline-2 focus-visible:outline-dusk-accent";

/**
 * Small "Sign out" with an inline "are you sure?" step: signing back in means
 * typing a password, which is the last thing she wants to do mid-migraine.
 * Taps still waiting to sync are sent first, so signing out never loses one.
 */
export function SignOutButton({ signOut = defaultSignOut, syncPending = defaultSyncPending }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      if (!(await syncPending())) {
        setError("Some migraines haven't saved yet. Connect to the internet, then try again.");
        return;
      }
      const err = await signOut();
      if (err) {
        setError(err);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Couldn't sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={`${btn} -mr-2 text-dusk-muted`} onClick={() => setConfirming(true)}>
        Sign out
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <p className="text-sm text-dusk-text">Sign out of this device?</p>
      <div className="flex gap-1">
        <button
          type="button"
          className={`${btn} text-dusk-muted`}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancel
        </button>
        <button type="button" disabled={busy} className={`${btn} bg-dusk-fill text-dusk-accent disabled:opacity-50`} onClick={confirm}>
          Yes, sign out
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-56 text-right text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
