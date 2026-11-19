"use client";

import { useState, type ReactNode } from "react";
import {
  DEFAULT_TRIGGERS,
  fromLocalInputValue,
  LOCATIONS,
  SYMPTOMS,
  toLocalInputValue,
  type EpisodeInput,
  type SaveResult,
} from "@/lib/episode-form";
import type { Episode, Helped } from "@/lib/episodes";
import { ChipPicker } from "./ChipPicker";

type MedDraft = { name: string; takenAt: string; helped: Helped };

type Props = {
  /** An episode to edit, or a draft with id "" for a new one. */
  initial: Episode;
  usedTriggers: string[];
  usedMedications: string[];
  onSave: (input: EpisodeInput) => Promise<SaveResult>;
  onDelete?: () => void;
};

const field =
  "mt-1 block w-full rounded-xl bg-dusk-surface px-4 py-3 text-base text-dusk-text outline-none focus-visible:ring-2 focus-visible:ring-dusk-accent [color-scheme:dark]";
const smallBtn =
  "min-h-11 rounded-xl bg-dusk-fill px-4 text-dusk-accent focus-visible:outline-2 focus-visible:outline-dusk-accent";

const HELPED_LABELS: [Helped, string][] = [
  ["yes", "Yes"],
  ["somewhat", "A little"],
  ["no", "No"],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-dusk-accent">{title}</h2>
      {children}
    </section>
  );
}

const toggle = (xs: string[], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
const union = (...lists: readonly (readonly string[])[]) => [...new Set(lists.flat())];

export function EpisodeForm({ initial, usedTriggers, usedMedications, onSave, onDelete }: Props) {
  const [start, setStart] = useState(toLocalInputValue(initial.startedAt));
  const [pain, setPain] = useState<number | null>(initial.peakPain);
  const [locations, setLocations] = useState(initial.locations);
  const [symptoms, setSymptoms] = useState(initial.symptoms);
  const [triggers, setTriggers] = useState(initial.triggers);
  const [customTrigger, setCustomTrigger] = useState("");
  const [meds, setMeds] = useState<MedDraft[]>(
    initial.medications.map((m) => ({
      name: m.name,
      takenAt: m.takenAt ? toLocalInputValue(m.takenAt) : "",
      helped: m.helped,
    })),
  );
  const [newMed, setNewMed] = useState("");
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const triggerOptions = union(DEFAULT_TRIGGERS, usedTriggers, triggers);
  const medSuggestions = usedMedications.filter((n) => !meds.some((m) => m.name === n));

  function addMed(name: string) {
    const n = name.trim();
    if (!n || meds.some((m) => m.name.toLowerCase() === n.toLowerCase())) return;
    setMeds([...meds, { name: n, takenAt: "", helped: "unknown" }]);
  }

  function addTrigger() {
    const t = customTrigger.trim();
    if (t && !triggers.includes(t)) setTriggers([...triggers, t]);
    setCustomTrigger("");
  }

  function updateMed(i: number, patch: Partial<MedDraft>) {
    setMeds(meds.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const input: EpisodeInput = {
      ...(initial.id ? { id: initial.id } : {}),
      startedAt: fromLocalInputValue(start).toISOString(),
      peakPain: pain,
      locations,
      symptoms,
      triggers,
      notes,
      medications: meds.map((m) => ({
        name: m.name,
        takenAt: m.takenAt ? fromLocalInputValue(m.takenAt).toISOString() : null,
        helped: m.helped,
      })),
    };
    const result = await onSave(input);
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Section title="When">
        <label className="block">
          <span className="text-sm text-dusk-muted">Started</span>
          <input
            type="datetime-local"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={field}
          />
        </label>
      </Section>

      <Section title="How bad">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={pain === n}
              onClick={() => setPain(pain === n ? null : n)}
              className={`min-h-12 rounded-xl text-lg font-semibold focus-visible:outline-2 focus-visible:outline-dusk-accent ${
                pain === n ? "bg-dusk-fill text-dusk-accent ring-2 ring-dusk-accent/70" : "bg-dusk-surface text-dusk-text"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Where">
        <ChipPicker
          options={LOCATIONS}
          selected={locations}
          onToggle={(v) => setLocations(toggle(locations, v))}
        />
      </Section>

      <Section title="Symptoms">
        <ChipPicker
          options={union(SYMPTOMS, symptoms)}
          selected={symptoms}
          onToggle={(v) => setSymptoms(toggle(symptoms, v))}
        />
      </Section>

      <Section title="Medications">
        {medSuggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {medSuggestions.map((n) => (
              <button key={n} type="button" onClick={() => addMed(n)} className={smallBtn}>
                + {n}
              </button>
            ))}
          </div>
        )}
        <ul className="space-y-3">
          {meds.map((m, i) => (
            <li key={m.name} className="rounded-2xl bg-dusk-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="break-words font-semibold">{m.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => setMeds(meds.filter((_, j) => j !== i))}
                  className="min-h-11 min-w-11 text-dusk-muted"
                >
                  ✕
                </button>
              </div>
              <label className="mt-2 block">
                <span className="text-sm text-dusk-muted">Taken at (optional)</span>
                <input
                  type="datetime-local"
                  value={m.takenAt}
                  onChange={(e) => updateMed(i, { takenAt: e.target.value })}
                  className={field}
                />
              </label>
              <p className="mt-3 text-sm text-dusk-muted">Did it help?</p>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {HELPED_LABELS.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={m.helped === v}
                    onClick={() => updateMed(i, { helped: m.helped === v ? "unknown" : v })}
                    className={`min-h-11 rounded-xl ${
                      m.helped === v ? "bg-dusk-fill font-semibold text-dusk-accent ring-2 ring-dusk-accent/70" : "bg-dusk-fill text-dusk-text"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            aria-label="Medication name"
            placeholder="Add a medication"
            value={newMed}
            maxLength={60}
            onChange={(e) => setNewMed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMed(newMed);
                setNewMed("");
              }
            }}
            className={`${field} mt-0`}
          />
          <button
            type="button"
            onClick={() => {
              addMed(newMed);
              setNewMed("");
            }}
            className={smallBtn}
          >
            Add
          </button>
        </div>
      </Section>

      <Section title="Possible triggers">
        <ChipPicker
          options={triggerOptions}
          selected={triggers}
          onToggle={(v) => setTriggers(toggle(triggers, v))}
        />
        <div className="mt-3 flex gap-2">
          <input
            aria-label="Your own trigger"
            placeholder="Add your own"
            value={customTrigger}
            maxLength={60}
            onChange={(e) => setCustomTrigger(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTrigger();
              }
            }}
            className={`${field} mt-0`}
          />
          <button type="button" onClick={addTrigger} className={smallBtn}>
            Add
          </button>
        </div>
      </Section>

      <Section title="Notes">
        <textarea
          aria-label="Notes"
          rows={4}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={field}
        />
      </Section>

      {error && (
        <p role="alert" className="mt-6 text-dusk-accent">
          {error}
        </p>
      )}

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] mt-8 bg-dusk-bg py-3">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 w-full rounded-xl bg-dusk-fill font-semibold text-dusk-accent disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-dusk-accent"
        >
          Save
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="mt-4 min-h-12 w-full text-dusk-muted underline underline-offset-4"
        >
          Delete this migraine
        </button>
      )}
    </form>
  );
}
