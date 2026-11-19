"use client";

type Props = { onPick: (n: number) => void; onSkip: () => void };

export function PainSheet({ onPick, onSkip }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pain-title"
      className="fixed inset-0 z-20 flex flex-col justify-center bg-dusk-bg px-4 pt-[env(safe-area-inset-top)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto w-full max-w-md">
        <h2 id="pain-title" className="text-center text-[22px] font-semibold">
          How bad is it?
        </h2>
        <p className="mt-1 text-center text-sm text-dusk-muted">1 is mild, 10 is the worst</p>
        <div className="mt-8 grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              className="min-h-14 rounded-2xl bg-dusk-fill text-xl font-semibold text-dusk-accent focus-visible:outline-2 focus-visible:outline-dusk-accent active:bg-dusk-surface"
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-8 min-h-12 w-full text-dusk-muted focus-visible:outline-2 focus-visible:outline-dusk-accent"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
