"use client";

type Props = {
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
};

export function ChipPicker({ options, selected, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={`min-h-11 max-w-full break-words rounded-full px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-dusk-accent ${
              on ? "bg-dusk-fill font-semibold text-dusk-accent ring-2 ring-dusk-accent/70" : "bg-dusk-surface text-dusk-text"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
