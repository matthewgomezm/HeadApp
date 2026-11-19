# Migraine Tracker — Design

Date: 2026-11-18
Status: draft, awaiting approval

## Intent

Jadyn gets severe migraines and has nothing to track them with. This is a
personal web app, added to her iPhone home screen so it opens like a native
app, that lets her:

1. **Spot her triggers** — with real numbers, so she (and Matthew) can see
   how much more likely a migraine is under a given condition.
2. **Show her doctor** a clear history when needed.

It is used *during* migraines, so speed, calm, and visual comfort matter more
than features.

## Goals

- Log a migraine in **one tap** while in pain. Everything else can be filled
  in later.
- Collect the everyday context (weather, sleep, heart data, cycle) **without
  daily effort** from her, so patterns are measured against good days too,
  not just migraine days.
- Show quantified patterns (likelihood under a condition vs. without it) and
  a printable doctor summary.
- Be visually gentle: dark, warm, low-contrast "Dusk" palette.

## Non-goals (v1)

- A daily journal or daily check-in. Explicitly rejected — too much effort.
- A native iOS app or App Store distribution.
- Multiple users / sharing accounts. One account: hers. Matthew views the
  data on her phone (decided), so no second login or read-only role.
- Medical advice or diagnosis.
- Notifications or reminders.

## Anti-goals (failure even if it "works")

- Logging that feels like a form while she's in pain.
- Bright, high-contrast, flashing, or animated UI. No pure white (#fff), no
  pure black, no saturated blue.
- Presenting weak correlations as facts. Small samples must be labelled as
  such.
- Health data that can be lost (deleted home-screen icon, cleared Safari
  data, new phone).

## Constraints

- Stack (decided by Matthew): **Next.js (App Router) + React + Tailwind CSS**.
- Runs on iPhone as a home-screen web app (standalone PWA).
- Health data is sensitive: everything behind auth, row-level security on.
- Free tiers should cover it (single user).

## Approaches considered

1. **Next.js on Vercel + Supabase (Postgres + Auth)** — *chosen.* Managed
   auth and RLS for sensitive data, a dashboard to inspect data, free tier
   is ample. Cost: one more service.
2. **Next.js on Vercel + Neon Postgres + a homemade passcode.** Fewer moving
   parts, but we'd own the security of health data and lose easy browsing.
3. **Local-only (IndexedDB on her phone).** Rejected: the iPhone Shortcut and
   the daily weather job need a server to send to, and there's no backup.

## Decisions

### Hosting & platform
- Deploy to **Vercel**. Supabase for Postgres + Auth.
- PWA via Next.js `app/manifest.ts`: `display: standalone`, Dusk background /
  theme colors, `apple-touch-icon`, `apple-mobile-web-app-capable`,
  status bar style `black-translucent`. Respect safe-area insets.

### Auth
- Supabase Auth with **email + password** (decided 2026-11-18), *not* magic
  links. Reason: on iOS a home-screen web app has storage separate from
  Safari, so a magic link opens Safari and logs in there, not in the app.
  Email one-time codes were the first choice, but Supabase only allows editing
  the email template (to include the code) with a custom SMTP server; a
  password needs no email at all and still signs in inside the app.
- Accounts are created by Matthew in the Supabase dashboard with a password.
- Long-lived session; she should essentially never see the login again.
- Only her account is allowed (sign-ups disabled after her account exists, or
  an email allowlist).

### Logging flow (two stages)
- **Stage 1, during a migraine (Home):** big "I have a migraine" button.
  Tap → creates an episode with `started_at = now`, then a single screen of
  large 1–10 pain buttons (optional — can be skipped). Done.
- **One button, two presses (Jadyn's request, 2026-11-18):** press when the
  migraine starts (pain screen follows), press the same button again —
  now labelled "It's over" with "Started 2:40 PM · 1h 12m so far" above it —
  when it ends. The duration is end − start, tracked automatically. Pain is
  asked at the start only. A double tap on "It's over" can't start a new
  migraine (1 s guard). (This replaced a short-lived start-time-only version.)
- **Stage 2, later (episode detail):** editable start time, end time (or
  "Still going"), peak pain,
  location (left / right / both / behind eyes / back of head / forehead),
  symptoms (nausea, vomiting, light sensitivity, sound sensitivity,
  smell sensitivity, dizziness), medications (name, time, helped:
  yes / somewhat / no), suspected triggers (checklist), free-text notes.
- Starting trigger checklist: poor sleep, stress, skipped meal, dehydration,
  caffeine, alcohol, weather change, period/cycle, screen time, strong smell,
  bright light, specific food (with text), exercise. She can add her own.
- Medications she has used before appear as one-tap chips.

### Automatic context (no effort from her)
- **Weather:** a daily Vercel Cron job calls **Open-Meteo** (free, no key)
  for her home location and stores, per day: mean & min/max pressure (hPa),
  24h pressure change, max temp, humidity. Backfill when first set up. Home
  location set once in Settings (city search or lat/lon).
- **Apple Watch / Health via iOS Shortcut:** a personal automation runs daily
  (~10–11am, when the phone is likely unlocked; Health data is unreadable
  while locked) and POSTs to `/api/ingest/health` with a bearer token:
  previous night's sleep (total, deep, REM if present), resting heart rate,
  HRV, and menstrual-flow samples if present. Endpoint upserts by date
  (idempotent). Token is generated in Settings, stored hashed.
- **Cycle:** if her period app (Bevel) writes Menstrual Flow to Apple Health,
  the Shortcut carries it. Otherwise a "Period started" button in the app is
  the only manual input. Cycle day is derived from period-start dates.
- Delivering the Shortcut: we write step-by-step setup instructions (and, if
  practical, a shareable iCloud Shortcut link) — Matthew installs it on her
  phone.

### Insights (the "quantified" part)
- All statistics are computed **in code / SQL**, never by an LLM.
- **Per-condition likelihood:** for conditions with a daily baseline (pressure
  drop > X hPa, sleep < 6h, low HRV vs. her own average, cycle days 1–3,
  weekday), show:
  "Migraine within 24h: 38% of days with condition vs 12% without (3.2×) —
  based on 21 vs 140 days." Always show the counts.
- **Definition** *(builder's call)*: unit is her local calendar day. A day D
  "has the condition" based on that day's `daily_context` (sleep = the night
  ending on D's morning; pressure change = D vs D−1). D "leads to a migraine"
  if an episode **starts** on D or D+1. Days on which an episode was already
  in progress at midnight are excluded from both numerator and denominator.
  Days with missing data for that condition are excluded for that condition.
- Below a minimum sample size (e.g. fewer than ~5 events on either side) show
  "not enough data yet" instead of a ratio.
- **Checklist triggers** (only logged on migraine days) are shown as
  frequency: "Poor sleep was ticked in 9 of 14 migraines" — clearly worded
  as frequency, not likelihood.
- Charts: monthly migraine count, calendar heatmap (migraine days by pain),
  a timeline overlaying pressure and sleep with migraine markers.

### Doctor tab
- A print-friendly summary for a chosen date range: migraines per month,
  average/longest duration, pain distribution, medication use and how often
  each helped, top recorded triggers, the strongest measured conditions, and
  a chronological list of episodes.
- Printed via the browser (Print / Save as PDF). Print styles use a light
  background for paper, the screen view stays Dusk.

### Offline logging *(builder's call)*
- The one-tap log must not fail on bad signal. The tap is saved to
  localStorage immediately and sent to Supabase when online (retry on load /
  `online` event). Single user and create-only, so no conflict handling.
  Full offline browsing of history is not required.

### Backups & free tier *(builder's call)*
- Settings has **Export all data** (JSON + CSV download).
- Free Supabase projects pause after a week of inactivity; the daily weather
  cron writes to the database every day, which keeps it active. Stay on free
  tier; revisit Pro only if needed.

### Past data *(builder's call)*
- "Log a past migraine" entry (same detail form with editable start/end), so
  she can enter migraines she remembers.
- The Shortcut supports a one-time **backfill** mode (e.g. last 180 days of
  sleep/HR/HRV/menstrual data); the ingest endpoint accepts an array of days.
  Weather is backfilled from Open-Meteo's historical API for the same range.

### Navigation
- Bottom tab bar: **Home · History · Insights · Doctor**. Settings reached
  from a small icon on Home (home location, medications list, trigger list,
  Shortcut token, sign out).

### Visual design — "Dusk" (approved)
- Background `#1d1a17`, surfaces `#26221e`, button/tag fill `#3a2f25`,
  accent text `#e3c49f`, body text `#d9d0c3`, muted text `#8f857a`,
  tab bar `#191714`.
- Dark only (no light mode in the app UI). Generous sizes: tap targets
  ≥ 48px, body text ≥ 16px (prevents iOS zoom on inputs).
- No animations beyond instant state changes; honour `prefers-reduced-motion`
  regardless. No pure white anywhere, including focus rings and charts.
- System font stack.

### Data model (Supabase / Postgres, all tables RLS on `user_id = auth.uid()`)
- `episodes` — id, user_id, started_at, ended_at (null while still going),
  peak_pain
  (1–10, nullable), locations text[], symptoms text[], triggers text[],
  notes, created_at, updated_at.
- `medication_doses` — id, episode_id, user_id, name, taken_at, helped
  (`yes | somewhat | no | unknown`).
- `daily_context` — user_id, date (her local date), sleep_min, deep_min,
  rem_min, resting_hr, hrv_ms, pressure_mean, pressure_min, pressure_max,
  pressure_change_24h, temp_max, humidity; unique (user_id, date).
- `cycle_events` — user_id, date, kind (`period_start`), source
  (`manual | health`).
- `settings` — user_id, home_lat, home_lon, home_label, timezone, custom
  triggers, known medications.
- `ingest_tokens` — user_id, token_hash, created_at, last_used_at.
- All timestamps stored UTC; "day" computations use her timezone from settings.

## Phasing

1. **Scaffold (first step, this request):** Next.js + Tailwind project, Dusk
   theme tokens, PWA manifest/icons, the Home page UI from the approved
   mockup (option A "Dusk" in
   `.superpowers/brainstorm/92299-1795049573/content/palettes.html`: date,
   greeting, "N days since your last migraine", ~170px round "I have a
   migraine / tap to log" button, hint "Details can wait until you feel
   better", most recent episode card with trigger tags, bottom tab bar) —
   static placeholder data, no backend yet. The implementation plan covers
   Phase 1 in detail; later phases get their own plans.
2. Supabase + email/password auth, episodes: one-tap log with pain, detail
   edit, History list.
3. Weather cron + Settings home location; Insights charts and likelihoods.
4. Doctor summary page with print styles.
5. Shortcut ingest endpoint + token + setup guide; cycle tracking.
6. Later: optional LLM summary (below).

## Later: LLM summary (not v1)

An "Explain my patterns" / "Draft a note for my doctor" button that sends the
**already-computed statistics** (not raw notes, unless she opts in) to the
Claude API and returns a plain-English summary. Needs her consent, since
health data leaves our systems. Cost is pennies per month.

## Left to the builder

- Chart library (Recharts or similar), component structure, file layout.
- Exact thresholds for "pressure drop" and "low HRV" (start with sensible
  defaults, make them constants).
- App icon artwork (simple, Dusk-colored).
- Whether the cron lives in Vercel Cron or Supabase pg_cron.
