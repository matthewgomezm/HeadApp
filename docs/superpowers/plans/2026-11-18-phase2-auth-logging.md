# Phase 2 — Login, Real Logging, History & Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jadyn can sign in once with an emailed 6-digit code, log a migraine with one tap (even offline), set pain, end it, fill in details later, see her history, and use it all from her iPhone home screen via a Vercel URL.

**Architecture:** Supabase Postgres (project `MigraineTracker`, ref `oatflviqiwereaommdcz`) with RLS on every table; `@supabase/ssr` with a Next 16 `proxy.ts` that refreshes the session and redirects signed-out requests to `/login`. Reads happen in Server Components; the one-tap log and "It's over" go through a client-side localStorage queue that upserts by client-generated UUID (offline-safe, idempotent); the detail form uses a Server Action validated with zod.

**Tech Stack:** Phase 1 stack + `@supabase/supabase-js@2.119.1`, `@supabase/ssr@0.12.7`, `zod@4.6.7`, Supabase MCP (migrations, types, advisors), Vercel CLI 54.

**Spec:** `docs/superpowers/specs/2026-11-18-migraine-tracker-design.md` (sections: Auth, Logging flow, Offline logging, Data model, Navigation, Visual design).

## Global Constraints

- Everything from the Phase 1 plan's Global Constraints still applies (Dusk palette, dark only, ≥48px targets, ≥16px inputs, no animation).
- Auth = email **one-time code** (`signInWithOtp` + `verifyOtp({ type: "email" })`), never magic links. `shouldCreateUser: false`.
- Only the publishable key reaches the browser (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); no service-role/secret key anywhere in this phase.
- RLS on every table; policies `to authenticated` with `(select auth.uid()) = user_id`; UPDATE policies have both `using` and `with check`.
- `user_id` defaults to `auth.uid()` in the DB; the client never sends it.
- All timestamps stored `timestamptz` (UTC); display and `datetime-local` conversion happen on the device.
- Pin exact versions; commit `package-lock.json`. `.env.local` stays git-ignored; commit `.env.example`.
- Stage files explicitly (`git add <paths>`), never `git add -A` — the working tree may contain the user's own changes.

## Decisions made in this plan (builder's calls)

- **Her account is created by Matthew in the Supabase dashboard** (Authentication → Users → Add user, her email, "auto confirm"); the app uses `shouldCreateUser: false` and public sign-ups are turned off. That is the allowlist.
- **Medication and trigger chips** = the spec's default trigger list ∪ every trigger / medication name she has used before (distinct values from her rows). No settings table yet; Settings arrives with Phase 3.
- **One open migraine at a time:** while an episode has `ended_at is null`, Home shows the in-progress state instead of the big button.
- Pain picker after the tap is a full-screen sheet on Home (client-side), so it works offline.

## Manual steps for Matthew (cannot be done by the agent)

1. Supabase dashboard → Authentication → **Email Templates → Magic link**: subject `Your Migraine Tracker code`, body `<h2>Your sign-in code</h2><p style="font-size:24px">{{ .Token }}</p><p>Enter it in the app. It expires in 1 hour.</p>`.
2. Authentication → **Users → Add user**: Jadyn's email (and yours for testing, if you like), auto-confirm on.
3. Authentication → **Sign In / Providers → "Allow new users to sign up" off**.
4. After deploy: Authentication → **URL Configuration → Site URL** = the Vercel production URL.
5. Vercel: `vercel login` once in the terminal (Task 7 does the rest with your approval).

## Review Focus

1. **Double tap on the big button** → exactly one episode; the second tap lands on the pain sheet / in-progress state, never a second row. (Task 4 test.)
2. **Tap while offline** → episode saved locally, Home shows "Migraine in progress since …" immediately, and syncs once online without duplicates even if flush runs twice. (Task 3 tests.)
3. **End time before start time / pain outside 1–10 / future start** → form shows an error; nothing saved. (Task 5 tests.)
4. **Session expired while a tap is queued** → redirected to /login, queue survives in localStorage and flushes after sign-in. (Task 3 test + Task 6 browser check.)
5. **Someone else's episode id in the URL / wrong user** → 404, no data (RLS). (Task 1 SQL check + Task 5 `notFound` test.)

---

### Task 1: Database schema, RLS and generated types

**Files:**
- Create: `supabase/migrations/20261119000000_episodes.sql`, `src/lib/supabase/database.types.ts` (generated)

**Interfaces:**
- Produces tables:
  - `public.episodes` — `id uuid pk default gen_random_uuid()`, `user_id uuid not null default auth.uid() references auth.users on delete cascade`, `started_at timestamptz not null`, `ended_at timestamptz null`, `peak_pain smallint null check (peak_pain between 1 and 10)`, `locations text[] not null default '{}'`, `symptoms text[] not null default '{}'`, `triggers text[] not null default '{}'`, `notes text not null default ''`, `created_at`/`updated_at timestamptz not null default now()`; `check (ended_at is null or ended_at >= started_at)`; index `(user_id, started_at desc)`.
  - `public.medication_doses` — `id uuid pk default gen_random_uuid()`, `episode_id uuid not null references public.episodes on delete cascade`, `user_id uuid not null default auth.uid() references auth.users on delete cascade`, `name text not null check (length(trim(name)) > 0)`, `taken_at timestamptz null`, `helped text not null default 'unknown' check (helped in ('yes','somewhat','no','unknown'))`; index `(episode_id)`.
  - Trigger `set_updated_at` (security invoker, `search_path = ''`) on episodes.
  - RLS enabled on both; four policies per table (select/insert/update/delete) `to authenticated` with `(select auth.uid()) = user_id` (update: `using` + `with check`). Insert into `medication_doses` additionally requires the parent episode belongs to the user (`with check` includes `exists (select 1 from public.episodes e where e.id = episode_id and e.user_id = (select auth.uid()))`).
  - Explicit `grant select, insert, update, delete on ... to authenticated`; `revoke all ... from anon`.
- Produces type `Database` in `database.types.ts`.

- [ ] **Step 1:** Write the migration SQL file.
- [ ] **Step 2:** Apply it to the remote project with MCP `apply_migration` (name `episodes`). Expected: success.
- [ ] **Step 3: RLS check** via MCP `execute_sql`, in one transaction that ends with `rollback`: insert a fake `auth.users` row is not possible — instead `set local role authenticated; select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);` then `select count(*) from public.episodes;` → `0`, and an `insert ... (started_at) values (now())` → fails with FK violation (proves default `auth.uid()` is used). `set local role anon; select count(*) from public.episodes;` → permission denied.
- [ ] **Step 4:** MCP `get_advisors` (security + performance). Expected: no security warnings for these tables; fix any.
- [ ] **Step 5:** MCP `generate_typescript_types` → write to `src/lib/supabase/database.types.ts`.
- [ ] **Step 6: Commit** `feat(db): episodes and medication_doses with RLS` (stage the two files).

---

### Task 2: Supabase clients, proxy and login with emailed code

**Files:**
- Create: `.env.example`, `.env.local` (not committed), `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/app/login/page.tsx`, `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx`, `src/lib/auth-paths.ts`, `src/lib/auth-paths.test.ts`
- Modify: `src/app/layout.tsx` (hide TabBar on `/login` — do it inside `TabBar`: return null when pathname starts with `/login`), `src/components/TabBar.test.tsx`

**Interfaces:**
- Produces:
  - `createClient()` (browser) in `client.ts` → `SupabaseClient<Database>` via `createBrowserClient`.
  - `createClient()` (server, async) in `server.ts` → via `createServerClient` + `await cookies()`.
  - `updateSession(request: NextRequest): Promise<NextResponse>` in `lib/supabase/proxy.ts` — the Supabase docs pattern (getClaims right after client creation), plus: if no claims and `!isPublicPath(pathname)` → redirect to `/login`.
  - `isPublicPath(pathname: string): boolean` in `auth-paths.ts` — true for `/login`, `/manifest.webmanifest`, `/icon/*`, `/apple-icon`.
  - `src/proxy.ts` exports `proxy` and `config.matcher` excluding `_next/static`, `_next/image`, image extensions.
  - `LoginForm({ onSendCode, onVerify }: { onSendCode(email: string): Promise<string | null>; onVerify(email: string, code: string): Promise<string | null> })` — returns error message or null; two steps: email → code. Code input: `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`, font ≥16px. `login/page.tsx` wires it to the browser client (`signInWithOtp({ email, options: { shouldCreateUser: false } })`, `verifyOtp({ email, token, type: "email" })`) and on success `router.replace("/")` + `router.refresh()`.

- [ ] **Step 1: Failing tests.**
  - `auth-paths.test.ts`: `isPublicPath("/login")` true; `"/manifest.webmanifest"`, `"/icon/192"`, `"/apple-icon"` true; `"/"`, `"/history"`, `"/episodes/abc"` false.
  - `LoginForm.test.tsx`: typing an email and pressing "Send code" calls `onSendCode("j@example.com")` and then shows a field labelled "6-digit code"; entering `123456` and "Sign in" calls `onVerify("j@example.com","123456")`; when `onVerify` resolves `"Invalid code"` the text `Invalid code` is shown; "Send code" is disabled for an empty email.
  - `TabBar.test.tsx`: with pathname `/login` renders no navigation.
- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** `npm i @supabase/supabase-js@2.119.1 @supabase/ssr@0.12.7 zod@4.6.7`. Write `.env.example` with the two `NEXT_PUBLIC_` names; fill `.env.local` from MCP `get_project_url` and `get_publishable_keys` (use the `sb_publishable_…` key). Implement the files above.
- [ ] **Step 4:** `npm test` → pass; `npm run build` → succeeds; `curl -sI localhost:3000/history` while signed out → `307` to `/login`.
- [ ] **Step 5: Commit** `feat(auth): email code login and session proxy`.

---

### Task 3: Episode repository and offline log queue

**Files:**
- Create: `src/lib/episode-rows.ts`, `src/lib/episode-rows.test.ts`, `src/lib/log-queue.ts`, `src/lib/log-queue.test.ts`, `src/lib/data.ts`
- Modify: `src/lib/episodes.ts` (add `notes`, `locations`, `symptoms` to `Episode`; meds gain `id?: string; takenAt: Date | null`), `src/lib/sample-data.ts` + existing tests (fill new fields)

**Interfaces:**
- Produces:
  - `rowToEpisode(row: EpisodeRow & { medication_doses: DoseRow[] }): Episode` in `episode-rows.ts` (`EpisodeRow`/`DoseRow` = `Database["public"]["Tables"][...]["Row"]`).
  - `type SerializedEpisode` (dates as ISO strings) + `serializeEpisode(e)`, `deserializeEpisode(s)` — used to pass episodes from Server to Client Components.
  - `getEpisodes(limit?: number): Promise<Episode[]>` and `getEpisode(id: string): Promise<Episode | null>` and `getUsedNames(): Promise<{ triggers: string[]; medications: string[] }>` in `data.ts` (server-only; server client; ordered `started_at desc`).
  - In `log-queue.ts`:
    - `type QueuedOp = { id: string; patch: { started_at?: string; ended_at?: string | null; peak_pain?: number | null } }`
    - `enqueue(op: QueuedOp, storage?: Storage): void` — merges patches for the same `id` into one entry (later fields win), preserving first-enqueue order.
    - `pending(storage?: Storage): QueuedOp[]`
    - `flush(upsert: (row: { id: string } & QueuedOp["patch"]) => Promise<{ error: unknown }>, storage?: Storage): Promise<{ sent: number; failed: number }>` — sends in order, removes each op only after success, stops at first failure (keeps order).
    - `localOpenEpisode(storage?: Storage): { id: string; startedAt: Date; peakPain: number | null } | null` — newest queued op with `started_at` and no `ended_at`.
    - Storage key `"mt.logQueue.v1"`; all reads/writes wrapped in try/catch (private mode) — failures degrade to sending immediately.
  - `upsertEpisodePatch` (browser) = `supabase.from("episodes").upsert(row, { onConflict: "id" })`.

- [ ] **Step 1: Failing tests** (`log-queue.test.ts` uses an in-memory `Storage` stub):
  - enqueue start then pain for same id → `pending()` has 1 op with both fields.
  - two different ids keep insertion order.
  - `flush` with upsert that succeeds → `{ sent: 2, failed: 0 }`, queue empty; upsert called with `{ id, started_at, peak_pain }`.
  - `flush` where the first upsert fails → `{ sent: 0, failed: 1 }`, both ops still pending, second never attempted.
  - flushing twice concurrently sends each op at most once (guard with an in-flight flag) — **Review Focus 2**.
  - `localOpenEpisode` returns the open one; returns null after `enqueue({id, patch:{ended_at}})`.
  - storage that throws on `setItem` → `enqueue` does not throw.
  - `episode-rows.test.ts`: a row with two doses maps to `Episode` with `Date` objects and `helped` preserved; `serialize`→`deserialize` round-trips equal.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5: Commit** `feat: episode repository and offline log queue`.

---

### Task 4: Live Home — one-tap log, pain sheet, in-progress state

**Files:**
- Create: `src/components/PainSheet.tsx`, `src/components/PainSheet.test.tsx`, `src/components/InProgress.tsx`, `src/components/LiveHome.tsx`, `src/components/LiveHome.test.tsx`
- Modify: `src/app/page.tsx`, `src/components/HomeScreen.tsx` (accept `openEpisode` + `onLog`/`onEnd` props), `src/components/HomeScreen.test.tsx`, `src/components/LogButton.tsx` (add `disabled`)
- Delete: `src/components/ClientHome.tsx` (superseded by `LiveHome`)

**Interfaces:**
- Consumes: `getEpisodes`, `serializeEpisode`/`deserializeEpisode`, queue functions, `useNow`.
- Produces:
  - `page.tsx` (server): `const episodes = await getEpisodes(20)` → `<LiveHome name="Jadyn" initial={episodes.map(serializeEpisode)} />`.
  - `LiveHome` (client): merges server episodes with `localOpenEpisode()`; on tap → `crypto.randomUUID()`, `enqueue({ id, patch: { started_at: now.toISOString() } })`, open `PainSheet`, then `flush` (also flushes on mount and on `online` event); after a successful flush calls `router.refresh()`.
  - `PainSheet({ onPick, onSkip }: { onPick(n: number): void; onSkip(): void })` — heading `"How bad is it?"`, ten buttons `1`…`10` (≥56px, 2 rows of 5), `"Skip"` button. Pick → `enqueue({ id, patch: { peak_pain: n } })`.
  - `InProgress({ startedAt, onEnd, detailsHref })` — text `"Migraine in progress since 2:40 PM"` (`toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })`), large button `"It's over"` → `enqueue({ id, patch: { ended_at: now } })` + flush, link `"Add details"` → `/episodes/{id}`.
  - `HomeScreen` shows `InProgress` instead of `LogButton` when `openEpisode` is set.

- [ ] **Step 1: Failing tests.**
  - `PainSheet.test.tsx`: renders 10 buttons named `1`…`10`; clicking `7` calls `onPick(7)`; `Skip` calls `onSkip`.
  - `HomeScreen.test.tsx`: with `openEpisode` set → shows `/Migraine in progress since/`, button `It's over`, link `Add details` with href `/episodes/<id>`, and no `I have a migraine` button.
  - `LiveHome.test.tsx` (mock `next/navigation`, inject a fake upsert via a `upsert` prop defaulting to the real one): tapping the big button twice quickly results in exactly **one** queued op / one distinct id — **Review Focus 1**; after tap the pain sheet shows; picking 7 then flushing upserts `{ id, started_at, peak_pain: 7 }`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement. LogButton is disabled and the tap handler ignores re-entry once an open episode exists.
- [ ] **Step 4:** `npm test` → pass; `npm run build` → succeeds.
- [ ] **Step 5: Commit** `feat: one-tap logging with pain sheet and in-progress state`.

---

### Task 5: Episode detail form, past-migraine entry and History

**Files:**
- Create: `src/lib/episode-form.ts`, `src/lib/episode-form.test.ts`, `src/app/episodes/[id]/page.tsx`, `src/app/episodes/new/page.tsx`, `src/app/episodes/actions.ts`, `src/components/EpisodeForm.tsx`, `src/components/EpisodeForm.test.tsx`, `src/components/ChipPicker.tsx`
- Modify: `src/app/history/page.tsx`, `src/components/EpisodeCard.tsx` (optional `href` → whole card is a link; key fix `key={`${i}-${t}`}`)

**Interfaces:**
- Produces:
  - Constants in `episode-form.ts`: `DEFAULT_TRIGGERS` = `["poor sleep","stress","skipped meal","dehydration","caffeine","alcohol","weather change","period/cycle","screen time","strong smell","bright light","specific food","exercise"]`; `LOCATIONS` = `["left side","right side","both sides","behind eyes","back of head","forehead"]`; `SYMPTOMS` = `["aura","nausea","vomiting","light sensitivity","sound sensitivity","smell sensitivity","dizziness"]`.
  - `episodeInputSchema` (zod): `{ id?: uuid, startedAt: ISO string, endedAt: ISO string | null, peakPain: int 1–10 | null, locations: string[], symptoms: string[], triggers: string[] (trimmed, non-empty, deduped, ≤60 chars), notes: string ≤2000, medications: { name: string 1–60, takenAt: ISO|null, helped: enum }[] ≤10 }` with refinements: `endedAt >= startedAt` (message `"End time must be after the start"`), `startedAt <= now + 5 min` (message `"Start time can't be in the future"`).
  - `toLocalInputValue(d: Date): string` (`YYYY-MM-DDTHH:mm`, local) and `fromLocalInputValue(s: string): Date`.
  - Server Action `saveEpisode(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }>` in `actions.ts` — parses with `episodeInputSchema`; upserts the episode (id or new), replaces its `medication_doses` (delete then insert), `revalidatePath("/")` and `"/history"`.
  - Server Action `deleteEpisode(id: string)` — with confirm dialog in the form ("Delete this migraine?").
  - `EpisodeForm({ initial, usedTriggers, usedMedications, onSave })` — sections in order: When (start/end `datetime-local`, "Still going" checkbox), How bad (1–10 buttons), Where (chips), Symptoms (chips), Medications (chip per used name + "Add" text field; per med: time + Helped yes/a little/no), Possible triggers (chips = DEFAULT_TRIGGERS ∪ used, + "Add your own"), Notes (textarea), sticky "Save" button. Shows the schema's error message on failure.
  - `/episodes/[id]`: `getEpisode(id)` → `notFound()` when null (covers other users via RLS). `/episodes/new`: empty form with start = now rounded to 5 min.
  - `/history`: heading `History`, button link `"Log a past migraine"` → `/episodes/new`, episodes grouped by month heading (`"November 2026"`), each `EpisodeCard` linking to `/episodes/{id}`; empty state `"No migraines logged yet"`.

- [ ] **Step 1: Failing tests.**
  - `episode-form.test.ts`: valid input passes; `endedAt` before `startedAt` → error `"End time must be after the start"`; `peakPain: 11` fails; start 1h in future fails with `"Start time can't be in the future"`; triggers `[" stress ","stress",""]` → `["stress"]`; `toLocalInputValue(new Date(2026,10,14,9,5))` → `"2026-11-14T09:05"` and round-trips through `fromLocalInputValue` — **Review Focus 3**.
  - `EpisodeForm.test.tsx`: renders all section headings; tapping trigger chip `stress` then Save calls `onSave` with `triggers` containing `"stress"`; when `onSave` resolves `{ ok:false, error:"End time must be after the start" }` that text is shown.
  - `/episodes/[id]` page test: mocked `getEpisode` → null makes the page call `notFound` (mock `next/navigation`) — **Review Focus 5**.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → pass; `npm run lint`; `npm run build`.
- [ ] **Step 5: Commit** `feat: episode details form, past-migraine entry and history`.

---

### Task 6: End-to-end check in the browser (needs Matthew to sign in)

**Files:** none (fix-ups only).

- [ ] **Step 1:** Confirm Matthew has done manual steps 1–3. Start dev server; open `/` → redirected to `/login`.
- [ ] **Step 2:** Ask Matthew to sign in in the browser pane with a test account (he types the email and the emailed code himself). Expected: lands on Home, no sample data.
- [ ] **Step 3:** At 375×812: tap big button → pain sheet → 6 → Home shows in-progress; reload → still in progress (from DB). Tap "It's over" → back to big button, "Your last migraine was today".
- [ ] **Step 4:** Offline behaviour is covered by the Task 3/4 tests (the browser pane cannot emulate offline); note that in the ledger. Matthew can spot-check on the iPhone later by tapping in Airplane Mode, then turning it off.
- [ ] **Step 5:** Add details (trigger, med, notes) → Save → History shows it under the month; open it again → values persisted. Log a past migraine → appears in History in date order.
- [ ] **Step 6:** MCP `execute_sql`: `select count(*) from episodes` matches what was created; no duplicate ids.
- [ ] **Step 7:** Delete the test episodes through the app's Delete button.
- [ ] **Step 8:** Commit any fix-ups.

---

### Task 7: Deploy to Vercel (outward-facing — ask before each command)

**Files:** none in repo (Vercel project link lives in `.vercel/`, git-ignored).

- [ ] **Step 1:** With Matthew's go-ahead: `vercel link` (new project `migraine-tracker`), then add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview (`vercel env add …`).
- [ ] **Step 2:** `vercel --prod`. Expected: build passes, production URL printed.
- [ ] **Step 3:** Matthew sets Supabase Site URL to that URL (manual step 4).
- [ ] **Step 4:** Open the production URL in the browser pane: `/` → `/login`; `/manifest.webmanifest` served.
- [ ] **Step 5:** Final message gives Matthew the iPhone steps: open the URL in Safari → Share → Add to Home Screen → open the icon → sign in with her email code once.
