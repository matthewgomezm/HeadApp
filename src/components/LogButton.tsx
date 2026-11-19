"use client";

export function LogButton({ onLog }: { onLog?: () => void }) {
  return (
    <button
      type="button"
      onClick={onLog}
      className="mx-auto flex size-[170px] flex-col items-center justify-center rounded-full bg-dusk-fill text-dusk-accent ring-[10px] ring-dusk-surface focus-visible:outline-2 focus-visible:outline-offset-[14px] focus-visible:outline-dusk-accent active:bg-dusk-surface"
    >
      <span className="text-[19px] font-semibold leading-tight">I have a migraine</span>
      <span className="mt-1 text-xs opacity-80">tap to log</span>
    </button>
  );
}
