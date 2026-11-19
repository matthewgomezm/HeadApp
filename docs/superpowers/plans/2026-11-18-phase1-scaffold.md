# Phase 1 — Scaffold & Dusk Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js app, installable on an iPhone home screen, whose Home page renders the approved "Dusk" mockup from static sample data, with a bottom tab bar to placeholder History / Insights / Doctor pages.

**Architecture:** Next.js App Router with Tailwind v4 (`@theme` tokens in `globals.css`). Pure helpers in `src/lib/` (unit-tested with Vitest), small presentational components in `src/components/` (tested with React Testing Library). No backend yet; Home reads from `src/lib/sample-data.ts`, which Phase 2 replaces with Supabase.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Tailwind CSS v4, Vitest 5 + @testing-library/react + jsdom, Node 24.

**Spec:** `docs/superpowers/specs/2026-11-18-migraine-tracker-design.md`

## Global Constraints

- Dusk palette, exact values: bg `#1d1a17`, surface `#26221e`, fill `#3a2f25`, accent `#e3c49f`, text `#d9d0c3`, muted `#8f857a`, tabbar `#191714`.
- Dark only. No `#fff`/`white`, no `#000`/`black`, no saturated blue anywhere in app CSS (print styles are Phase 4).
- Tap targets ≥ 48px; body text ≥ 16px.
- No transitions/animations; add a global `prefers-reduced-motion` reset anyway.
- System font stack (remove the `next/font` Geist import create-next-app adds).
- PWA: `display: "standalone"`, `background_color` and `theme_color` = `#1d1a17`, `appleWebApp.capable: true`, `statusBarStyle: "black-translucent"`, `viewport-fit=cover` with safe-area padding.
- App name `"Migraine Tracker"`, short name `"Migraines"` (builder's call; easy to rename).
- Home copy, verbatim: button `"I have a migraine"` with sub-label `"tap to log"`; hint `"Details can wait until you feel better"`; tabs `Home · History · Insights · Doctor`.
- `.superpowers/` is git-ignored.

## Review Focus

1. **No migraines logged yet** → Home shows `"No migraines logged yet"` instead of a days-since line, and no episode card. (Task 3 + Task 4 tests.)
2. **Last migraine was today / yesterday** → `"Your last migraine was today"`, `"1 day since your last migraine"` (singular). Day counts use calendar days, not 24h blocks: 11pm yesterday → 1 day at 1am today. (Task 3 tests.)
3. **Episode still in progress** (`endedAt` null) → card shows `"In progress"` instead of a duration. (Task 3 test.)
4. **Long trigger/medication names** wrap inside the card; page never scrolls horizontally at 375px width. (Task 4 test asserts `break-words`; Task 5 browser check.)
5. **iPhone notch / home indicator in standalone mode** → tab bar sits above the home indicator (`pb-[env(safe-area-inset-bottom)]`), header below the status bar. (Task 5 browser check at 375×812.)

---

### Task 1: Project setup with test runner

**Files:**
- Create: whole Next.js project in repo root (via create-next-app), `vitest.config.mts`, `vitest.setup.ts`, `src/lib/smoke.test.ts`
- Modify: `.gitignore`, `package.json` (scripts)

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run build`, `npm run dev`; `@/` alias → `src/`.

- [ ] **Step 1: Init git and scaffold.** The folder already holds `docs/` and `.superpowers/`; create-next-app refuses non-empty dirs with conflicting files, so scaffold into a temp dir and move contents in:

```bash
cd /Users/matthewgomez/EngPractice/JadynMigraine
git init
npx create-next-app@16.4.6 ../_mt_tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
rsync -a ../_mt_tmp/ ./ && rm -rf ../_mt_tmp
```
Expected: `src/app/page.tsx`, `package.json` exist in the repo root.

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`.**

- [ ] **Step 3: Install test deps.**
`npm i -D vitest@5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths`

- [ ] **Step 4: Configure Vitest.** `vitest.config.mts`: plugins `react()`, `tsconfigPaths()`; `test.environment: "jsdom"`, `test.setupFiles: ["./vitest.setup.ts"]`, `test.include: ["src/**/*.test.{ts,tsx}"]`. `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`. Add script `"test": "vitest run"`.

- [ ] **Step 5: Smoke test** `src/lib/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Run `npm test` → 1 passed.

- [ ] **Step 6: Commit** (include the spec and this plan):
```bash
git add -A && git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Dusk theme, layout and PWA manifest/icons

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/app/manifest.ts`, `src/app/manifest.test.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`
- Modify: `src/app/globals.css` (replace contents), `src/app/layout.tsx`

**Interfaces:**
- Produces: `export const dusk: { bg; surface; fill; accent; text; muted; tabbar }` (strings) in `src/lib/theme.ts`; Tailwind color utilities `bg-dusk-bg`, `bg-dusk-surface`, `bg-dusk-fill`, `text-dusk-accent`, `text-dusk-text`, `text-dusk-muted`, `bg-dusk-tabbar` (and matching `ring-`/`border-` variants) via `@theme { --color-dusk-*: … }`.

- [ ] **Step 1: Failing tests.**
`theme.test.ts` — `"dusk palette matches approved values"`: `expect(dusk).toEqual({ bg: "#1d1a17", surface: "#26221e", fill: "#3a2f25", accent: "#e3c49f", text: "#d9d0c3", muted: "#8f857a", tabbar: "#191714" })`.
`theme.test.ts` — `"globals.css defines every dusk token and no pure white/black"`: read `src/app/globals.css` with `fs`; for each key k assert it contains `--color-dusk-${k}: ${dusk[k]}`; assert it does not match `/#fff\b|#ffffff|\bwhite\b|#000\b|#000000|\bblack\b/i`.
`manifest.test.ts` — `"manifest is standalone and Dusk-colored"`: `const m = manifest()`; expect `m.display === "standalone"`, `m.background_color === "#1d1a17"`, `m.theme_color === "#1d1a17"`, `m.name === "Migraine Tracker"`, `m.short_name === "Migraines"`, `m.start_url === "/"`, icons include sizes `"192x192"` and `"512x512"`.

- [ ] **Step 2: Run `npm test`** → FAIL (modules missing).

- [ ] **Step 3: Implement.**
  - `theme.ts`: `dusk` constant per test.
  - `globals.css`: `@import "tailwindcss";` + `@theme` with the seven `--color-dusk-*` tokens and `--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`; `html, body { background: var(--color-dusk-bg); color: var(--color-dusk-text); font-size: 16px; }`; `-webkit-tap-highlight-color: transparent`; reduced-motion reset (`*, *::before, *::after { animation: none !important; transition: none !important; }` inside `@media (prefers-reduced-motion: reduce)`).
  - `manifest.ts`: `MetadataRoute.Manifest` per test; icons `{ src: "/icon/192", sizes: "192x192", type: "image/png" }` and `{ src: "/icon/512", sizes: "512x512", type: "image/png" }` — these routes come from `icon.tsx` exporting `generateImageMetadata()` with ids `"192"` and `"512"` (verify the exact served path in Task 5 Step 4 and adjust `src` if Next serves it differently).
  - `icon.tsx` / `apple-icon.tsx` (180×180): `ImageResponse` from `next/og` — Dusk bg `#1d1a17`, centered `#3a2f25` circle with a small `#e3c49f` dot or "M". Simple; artwork is builder's call.
  - `layout.tsx`: remove Geist fonts; `metadata = { title: "Migraine Tracker", appleWebApp: { capable: true, title: "Migraines", statusBarStyle: "black-translucent" } }`; `viewport = { themeColor: "#1d1a17", viewportFit: "cover", width: "device-width", initialScale: 1 }`; `<body className="bg-dusk-bg text-dusk-text font-sans antialiased">`.

- [ ] **Step 4: Run `npm test`** → all pass. Run `npm run build` → succeeds.

- [ ] **Step 5: Commit** `feat: Dusk theme, layout metadata, PWA manifest and icons`.

---

### Task 3: Episode type, sample data and display helpers

**Files:**
- Create: `src/lib/episodes.ts`, `src/lib/episodes.test.ts`, `src/lib/sample-data.ts`

**Interfaces:**
- Produces (in `src/lib/episodes.ts`):
  - `type Episode = { id: string; startedAt: Date; endedAt: Date | null; peakPain: number | null; triggers: string[]; medications: { name: string; helped: "yes" | "somewhat" | "no" | "unknown" }[] }`
  - `daysSinceLabel(last: Date | null, now: Date): string`
  - `formatDuration(startedAt: Date, endedAt: Date | null): string`
  - `episodeHeadline(e: Episode): string` — e.g. `"Sat, Nov 14 · 7/10"`; without pain: `"Sat, Nov 14"`.
  - `episodeSubline(e: Episode): string` — e.g. `"6h 20m · Sumatriptan helped"`; joins duration and first medication (`helped` → `"helped"`, `"somewhat"` → `"helped a little"`, `"no"` → `"didn't help"`, `"unknown"` → name only).
  - `latestEpisode(list: Episode[]): Episode | null` (max `startedAt`).
- Produces (in `src/lib/sample-data.ts`): `sampleEpisodes: Episode[]` — 3 episodes, the latest matching the mockup (2026-11-14 09:00 local, 7/10, 6h20m, Sumatriptan helped, triggers `["poor sleep", "pressure drop"]`).

All date math uses the device's local timezone (`date-fns` not needed; use `Date` with local getters).

- [ ] **Step 1: Failing tests** in `episodes.test.ts` (construct dates with `new Date(y, m, d, h, min)` — local time):
  - `daysSinceLabel(null, now)` → `"No migraines logged yet"`
  - same calendar day → `"Your last migraine was today"`
  - last = Nov 17 23:00, now = Nov 18 01:00 → `"1 day since your last migraine"`
  - last = Nov 14 09:00, now = Nov 18 08:00 → `"4 days since your last migraine"`
  - `formatDuration(start, start+6h20m)` → `"6h 20m"`; `+45m` → `"45m"`; `+2h` → `"2h"`; `endedAt null` → `"In progress"`
  - `episodeHeadline` with pain 7 on Sat Nov 14 2026 → `"Sat, Nov 14 · 7/10"`; pain null → `"Sat, Nov 14"`
  - `episodeSubline` with Sumatriptan `yes` → `"6h 20m · Sumatriptan helped"`; no medications → `"6h 20m"`; `no` → `"6h 20m · Sumatriptan didn't help"`
  - `latestEpisode([])` → `null`; returns the max-`startedAt` episode regardless of array order.

- [ ] **Step 2: Run `npm test`** → FAIL.
- [ ] **Step 3: Implement** the signatures above. Calendar-day difference: compare local midnights (`new Date(y, m, d)`) and round `(b - a) / 86_400_000` (rounding absorbs DST). Headline date via `toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })`.
- [ ] **Step 4: Run `npm test`** → pass.
- [ ] **Step 5: Commit** `feat: episode type, sample data and display helpers`.

---

### Task 4: Home screen components and page

**Files:**
- Create: `src/components/LogButton.tsx`, `src/components/EpisodeCard.tsx`, `src/components/TabBar.tsx`, `src/components/HomeScreen.tsx`, `src/components/HomeScreen.test.tsx`, `src/components/TabBar.test.tsx`, `src/app/history/page.tsx`, `src/app/insights/page.tsx`, `src/app/doctor/page.tsx`
- Modify: `src/app/page.tsx` (replace), `src/app/layout.tsx` (render `<TabBar />` after `{children}`)

**Interfaces:**
- Consumes: `Episode`, `daysSinceLabel`, `episodeHeadline`, `episodeSubline`, `latestEpisode` (Task 3); `sampleEpisodes`; Dusk utilities (Task 2).
- Produces:
  - `HomeScreen({ name, episodes, now }: { name: string; episodes: Episode[]; now: Date })` — pure presentational; `page.tsx` renders `<HomeScreen name="Jadyn" episodes={sampleEpisodes} now={new Date()} />`.
  - `LogButton({ onLog }: { onLog?: () => void })` — `<button>` with accessible name starting `"I have a migraine"`; ~170px circle (`size-[170px] rounded-full bg-dusk-fill text-dusk-accent ring-[10px] ring-dusk-surface`). Phase 1: `onLog` optional, no-op.
  - `EpisodeCard({ episode }: { episode: Episode })` — headline, subline, trigger tags (`bg-dusk-fill text-dusk-accent rounded-full`), container has `break-words`.
  - `TabBar()` — client component using `usePathname()`; four `<Link>`s `/`, `/history`, `/insights`, `/doctor` labelled Home/History/Insights/Doctor; active one has `aria-current="page"` and `text-dusk-accent`; others `text-dusk-muted`; each link `min-h-12`; bar `fixed bottom-0 inset-x-0 bg-dusk-tabbar pb-[env(safe-area-inset-bottom)]`.
  - Placeholder pages: heading with the tab name and `"Coming soon"` in `text-dusk-muted`.

Layout of `HomeScreen` (top→bottom, matches mockup): date line (e.g. `"Wed, Nov 18"`, muted), `"Hi Jadyn"` (22px semibold), days-since label, LogButton centred, hint `"Details can wait until you feel better"` (muted, centred), EpisodeCard for latest episode (omitted when none). Page wrapper: `px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28` so content clears the fixed tab bar.

- [ ] **Step 1: Failing tests.**
`HomeScreen.test.tsx` (now = `new Date(2026, 10, 18, 10, 0)`):
  - `"shows greeting, days since, log button and hint"`: with `sampleEpisodes` → texts `"Hi Jadyn"`, `"4 days since your last migraine"`, `"Details can wait until you feel better"`; `getByRole("button", { name: /I have a migraine/ })` present; `"Sat, Nov 14 · 7/10"` and `"poor sleep"` visible.
  - `"empty state"`: `episodes=[]` → `"No migraines logged yet"` shown; `queryByText(/\/10/)` is null; button still present.
  - `"long trigger names wrap"`: episode with trigger `"a".repeat(80)` → the tag's closest card element has class `break-words`.
`TabBar.test.tsx` (mock `next/navigation` `usePathname` → `"/insights"`):
  - four links with names Home, History, Insights, Doctor and hrefs `/`, `/history`, `/insights`, `/doctor`
  - only Insights has `aria-current="page"`.

- [ ] **Step 2: Run `npm test`** → FAIL.
- [ ] **Step 3: Implement** components, pages and layout change as specified.
- [ ] **Step 4: Run `npm test`** → pass; `npm run lint` → clean; `npm run build` → succeeds.
- [ ] **Step 5: Commit** `feat: Dusk home screen with tab bar and placeholder pages`.

---

### Task 5: Visual verification on an iPhone-sized viewport

**Files:** none (fix-ups only if a check fails, then re-run Task 4 tests).

- [ ] **Step 1:** Add `.claude/launch.json` config `"web"` running `npm run dev` on port 3000; start the browser preview.
- [ ] **Step 2:** Resize to 375×812. Check against the mockup (`.superpowers/brainstorm/92299-1795049573/content/palettes.html`, option A): colours, button size, card, tab bar. Expected: matches; no horizontal scroll (`document.documentElement.scrollWidth <= 375`).
- [ ] **Step 3:** Click History / Insights / Doctor → placeholder page, active tab highlighted; back to Home.
- [ ] **Step 4:** Fetch `/manifest.webmanifest` → JSON with `"display":"standalone"`; `/apple-icon` returns a PNG.
- [ ] **Step 5:** Commit any fix-ups: `fix: home screen visual adjustments`.
- [ ] **Step 6:** Note for Matthew in the final message: testing "Add to Home Screen" on the real iPhone needs a deployed HTTPS URL (Vercel) — that happens when Phase 2 deploys, or earlier on request.
