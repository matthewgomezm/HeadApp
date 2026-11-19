"use client";

import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

type Props = {
  /** Accessible name of the field (matches the section heading). */
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Offer `Add "…"` for something typed that isn't in the list. */
  allowCustom?: boolean;
  placeholder?: string;
};

const ADD_PREFIX = "\u0000add:";

/**
 * Multi-select built on shadcn's Combobox: selected items are removable chips,
 * tapping the field opens a list you can type to filter. Sized for phones:
 * 16px text (no iOS zoom) and 48px rows.
 */
export function MultiPicker({ label, options, value, onChange, allowCustom = false, placeholder }: Props) {
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState("");
  const typed = query.trim();

  const items = useMemo(() => {
    const all = [...new Set([...options, ...value])];
    const exists = all.some((o) => o.toLowerCase() === typed.toLowerCase());
    return allowCustom && typed && !exists ? [...all, `${ADD_PREFIX}${typed}`] : all;
  }, [options, value, allowCustom, typed]);

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      inputValue={query}
      onInputValueChange={setQuery}
      onValueChange={(next: string[]) => {
        onChange(next.map((v) => (v.startsWith(ADD_PREFIX) ? v.slice(ADD_PREFIX.length) : v)));
        setQuery("");
      }}
      itemToStringLabel={(v: string) => (v.startsWith(ADD_PREFIX) ? v.slice(ADD_PREFIX.length) : v)}
      filter={(item: string, q: string) =>
        item.startsWith(ADD_PREFIX) || item.toLowerCase().includes(q.trim().toLowerCase())
      }
    >
      <ComboboxChips
        ref={anchor}
        className="min-h-12 gap-1.5 rounded-xl border-dusk-fill bg-dusk-surface px-2 py-1.5"
      >
        <ComboboxValue>
          {(selected: string[]) =>
            selected.map((v) => (
              <ComboboxChip
                key={v}
                removeLabel={`Remove ${v}`}
                className="h-9 rounded-full bg-dusk-fill px-3 text-sm text-dusk-accent"
              >
                {v}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          aria-label={label}
          placeholder={value.length ? "" : (placeholder ?? "Tap to choose")}
          className="min-h-9 bg-transparent px-2 text-base text-dusk-text placeholder:text-dusk-muted"
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor} className="border border-dusk-fill bg-dusk-surface">
        <ComboboxEmpty className="px-3 py-3 text-dusk-muted">Nothing matches</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item} className="min-h-12 px-3 text-base text-dusk-text">
              {item.startsWith(ADD_PREFIX) ? `Add "${item.slice(ADD_PREFIX.length)}"` : item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
