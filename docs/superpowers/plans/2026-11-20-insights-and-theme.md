# Insights + Day/Night Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Doctor tab with an Insights page (her patterns, what she's logged, sourced advice) and add a day/night theme switch.

**Architecture:** Pure stats functions in `src/lib/insights.ts`; typed advice content in `src/content/reduce-migraines.ts`; a server `insights/page.tsx` loads episodes and renders a client `InsightsView` (device-timezone gate via `useNow`). Theme = `dark` class on `<html>`; every Dusk token becomes a CSS variable redefined under `:root` (day) and `.dark` (night).

**Tech Stack:** Next 16.4 (cacheComponents), Tailwind v4, shadcn (radix-nova) Accordion/Progress/Badge, Kokonut switch-button, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-20-insights-design.md` (and the Doctor-removal note in `2026-11-18-migraine-tracker-design.md`).

## Global Constraints

- Night palette = existing Dusk hexes; Day: bg `#f4ede3`, surface `#fbf6ef`, fill `#e9dccb`, accent `#7c4f24`, text `#3b322a`, muted `#6c6054`, tabbar `#ece2d4`, destructive `#a4553a`. No pure white/black in `globals.css`.
- Default theme is night; storage key `mt.theme` with values `"day" | "night"`.
- ≥48px tap targets, 16px text in inputs, no looping motion; Reduce Motion disables reveal/accordion animation.
- Advice: only from NHS `https://www.nhs.uk/conditions/migraine/`, AMF `https://americanmigrainefoundation.org/resource-library/top-10-migraine-triggers/`, AMF `https://americanmigrainefoundation.org/resource-library/lifestyle-changes-for-migraine/`; paraphrased; disclaimer "General information, not medical advice."
- Triggers worded as frequency ("in 3 of 4 migraines"), never cause.
- Stage files explicitly; never `git add -A`.

## Review Focus

1. **Migraine still going (no end)** → excluded from average duration, counted everywhere else. (Task 1 test.)
2. **Unrated pain / "unknown" helped** → excluded from those averages, not counted as 0. (Task 1 tests.)
3. **Migraine just after midnight** → "night" bucket and the weekday it started on, in her timezone. (Task 1 test.)
4. **Theme stored as junk / storage blocked** → falls back to night, no crash, no flash. (Task 3 test.)
5. **Old `/doctor` bookmark on her home screen** → lands on Insights. (Task 4 check.)

---

### Task 1: Insights stats

**Files:** Create `src/lib/insights.ts`, `src/lib/insights.test.ts`

**Interfaces — Produces:**
- `INSIGHTS_WINDOW_DAYS = 90`, `MIN_EPISODES = 3`
- `type TimeOfDay = "morning" | "afternoon" | "evening" | "night"` — morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59 (local).
- `inWindow(episodes: Episode[], now: Date): Episode[]` — started within the last 90 local days.
- `patternSummary(episodes: Episode[], now: Date): { count: number; enough: boolean; avgDurationMin: number | null; avgPain: number | null; timeOfDay: TimeOfDay | null; weekday: string | null }` (weekday as `"Monday"`; mode; ties → earliest in the week starting Monday).
- `triggerCounts(episodes: Episode[], now: Date, limit = 6): { name: string; count: number; total: number }[]` sorted by count desc, then name.
- `medicationResults(episodes: Episode[], now: Date, limit = 6): { name: string; helped: number; somewhat: number; no: number; rated: number; score: number }[]` — `score = (helped + somewhat*0.5) / rated` (0 when rated = 0); sorted by rated desc.

- [ ] **Step 1: Tests** — count/enough (2 → `enough: false`, 3 → true); avg duration ignores `endedAt: null` (Review 1); avgPain ignores null (Review 2); 00:30 → `"night"` and its start weekday (Review 3); 120-day-old episode excluded; triggers "stress" 3 of 4 → `{name:"stress",count:3,total:4}`; meds `yes,somewhat,no,unknown` → `{helped:1,somewhat:1,no:1,rated:3,score:0.5}` (Review 2).
- [ ] **Step 2:** `npx vitest run src/lib/insights.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** same command → PASS.
- [ ] **Step 5:** Commit `feat(insights): pattern, trigger and medication stats`.

### Task 2: Advice content + Insights page, Doctor removed

**Files:** Create `src/content/reduce-migraines.ts`, `src/content/reduce-migraines.test.ts`, `src/components/InsightsView.tsx`, `src/components/InsightsView.test.tsx`; add shadcn `accordion`, `progress`, `badge` (recolor to Dusk tokens, 48px triggers); Modify `src/app/insights/page.tsx`, `src/components/TabBar.tsx` (3 tabs), `src/components/TabBar.test.tsx`, `next.config.ts` (redirect `/doctor` → `/insights`, permanent); Delete `src/app/doctor/`; Modify `src/app/orientation.test.tsx` (drop doctor row); `src/app/globals.css` (`@media print`).

**Interfaces — Produces:**
- `type AdviceTopic = { id: string; title: string; triggers: string[]; tips: string[]; sources: { name: "NHS" | "American Migraine Foundation"; url: string }[] }`
- `ADVICE_TOPICS: AdviceTopic[]` — ids: sleep, stress, meals, hydration, caffeine, alcohol, weather, cycle, light, smells, food, exercise, diary, see-a-doctor; `triggers` use the app's trigger names (`"poor sleep"`, `"stress"`, `"skipped meal"`, `"dehydration"`, `"caffeine"`, `"alcohol"`, `"weather change"`, `"period/cycle"`, `"screen time"`, `"bright light"`, `"strong smell"`, `"specific food"`, `"exercise"`).
- `orderTopics(topics: AdviceTopic[], myTriggers: string[]): { topic: AdviceTopic; mine: boolean }[]` — topics matching her triggers first (in her trigger frequency order), "see-a-doctor" always last.
- `InsightsView({ initial }: { initial: SerializedEpisode[] })`.

- [ ] **Step 1: Tests** — content: every topic has 2–4 tips, ≥1 source whose url is one of the three allowed URLs; "see-a-doctor" lists red flags; `orderTopics` puts "stress" first when she logged stress most, keeps "see-a-doctor" last. View: "Not enough data yet" with 2 migraines; figures with 3 ("3 migraines", "Average pain 6/10"); trigger row "stress" "in 3 of 4 migraines" with a progressbar; medication row "Sumatriptan" "helped 2 · a little 1 · didn't 1"; advice trigger shows "Your trigger" badge; disclaimer text present; landscape classes `landscape:grid-cols-2`. TabBar: exactly Home/History/Insights.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement. Print: `@media print` → light colours, `[data-slot=accordion-content]` forced open, tab bar / theme switch hidden.
- [ ] **Step 4:** `npm test`, `npm run lint`, `npm run build` (route list has no `/doctor`) → PASS.
- [ ] **Step 5:** Commit `feat(insights): patterns, logged triggers/meds and sourced advice; remove Doctor tab`.

### Task 3: Day / night theme

**Files:** add Kokonut `switch-button` (recolor to Dusk tokens, `size-12`); Create `src/lib/theme-pref.ts`, `src/lib/theme-pref.test.ts`, `src/components/ThemeSwitch.tsx`; Modify `src/app/globals.css`, `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/app/layout.tsx`, `src/components/TabBar.tsx`.

**Interfaces — Produces:**
- `THEME_KEY = "mt.theme"`; `readThemePref(storage?: Storage): "day" | "night"` (anything else / throws → `"night"`); `writeThemePref(t: "day" | "night", storage?: Storage): void` (never throws); `THEME_BOOT_SCRIPT: string` (inline; removes `dark` from `<html>` when pref is day).
- `dayPalette` in `theme.ts` (values above); `dusk` stays the night palette.
- `ThemeSwitch()` — wraps Kokonut SwitchButton with `showLabel={false}`, `aria-label` "Day or night colours", calls `writeThemePref` on change.

- [ ] **Step 1: Tests** — theme-pref: default night; "day" read back; junk → night; throwing storage → night and write doesn't throw (Review 4); boot script string references `mt.theme` and `classList.remove("dark")`. theme.test: `:root` defines each `--dusk-*` with the day hex, `.dark` with the night hex; no white/black/oklch. Layout: `<html>` has `dark` class and `suppressHydrationWarning`. TabBar contains a button named "Day or night colours".
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement: `@theme inline { --color-dusk-*: var(--dusk-*) }`; `:root{--dusk-*: day}` `.dark{--dusk-*: night}`; shadcn tokens use `var(--dusk-*)` (destructive per theme); body `transition: background-color .4s, color .4s` (off with Reduce Motion); fixed status-bar backdrop `h-[env(safe-area-inset-top)]` in `bg-dusk-tabbar`.
- [ ] **Step 4:** `npm test`, lint, build → PASS.
- [ ] **Step 5:** Commit `feat: day/night switch (Kokonut switch-button), warm day palette`.

### Task 4: Browser check

- [ ] Start dev server; at 375×812 and 844×390: `/login` toggles nothing (tab bar hidden) but respects stored pref; `/doctor` → 308/307 to `/insights`; signed-in screens checked only if the pane is signed in (else note it).
- [ ] Commit any fix-ups.
