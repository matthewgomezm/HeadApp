"use client";

type Props = {
  onLog?: () => void;
  /** true while a migraine is going: the same button then ends it. */
  ongoing?: boolean;
};

export function LogButton({ onLog, ongoing = false }: Props) {
  return (
    <button
      type="button"
      onClick={onLog}
      className="mx-auto flex size-[170px] short:size-[130px] flex-col items-center justify-center rounded-full bg-dusk-fill text-dusk-accent ring-[10px] ring-dusk-surface focus-visible:outline-2 focus-visible:outline-offset-[14px] focus-visible:outline-dusk-accent active:bg-dusk-surface"
    >
      <span className="text-[19px] font-semibold leading-tight">
        {ongoing ? "It's over" : "I have a migraine"}
      </span>
      <span className="mt-1 text-xs opacity-80">{ongoing ? "tap when it ends" : "tap to log"}</span>
    </button>
  );
}
