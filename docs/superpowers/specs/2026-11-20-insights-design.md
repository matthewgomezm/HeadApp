# Insights (replaces the Doctor tab) — Design

Date: 2026-11-20 · Status: approved (Matthew, 2026-11-20) · Size: small project

## Intent

One place for Jadyn to see her own patterns and learn how to reduce
migraines. A separate Doctor tab would mostly repeat Insights, so it goes;
she can show (or print) Insights to her doctor instead. (Matthew, 2026-11-20.)

## Decided

- **Tabs:** Home · History · Insights. `/doctor` is removed (redirects to
  `/insights` so old bookmarks don't 404).
- **No search bar.**
- **Page order:** Your patterns → What you've logged → Ways to reduce
  migraines. (Sketch approved.)
- **Advice comes from established sources**, each topic links to its source, and the section
  says it's general information, not medical advice. No AI-written or
  invented tips.

- **Sources actually used:** NHS (https://www.nhs.uk/conditions/migraine/)
  and the American Migraine Foundation
  (https://americanmigrainefoundation.org/resource-library/top-10-migraine-triggers/,
  https://americanmigrainefoundation.org/resource-library/lifestyle-changes-for-migraine/).
  Mayo Clinic refused automated reading (HTTP 403), so nothing is taken from it.
- **Doctor tab removed for good** (Matthew): the route, its tab, and the
  original design doc's Doctor section are deleted/updated.

## Day / night switch (added 2026-11-20)

- **Kokonut `switch-button`** (sun ↔ moon); the new colours spread from the
  button as a circle (View Transitions). With Reduce Motion, or no View
  Transitions support, it switches instantly.
- **Placement (builder's call):** right end of the bottom tab bar, so it is
  on every screen and never crowds a page title. Hidden on /login (the tab
  bar is).
- **Night = today's Dusk palette (default).** **Day = warm light**, chosen by
  Matthew over pure white: bg `#f4ede3`, surface `#fbf6ef`, fill `#e9dccb`,
  accent `#8a5a2b`, text `#3b322a`, muted `#7a6d60`, tabbar `#ece2d4`,
  destructive `#a4553a`. Still no pure white or black.
- Implemented with the `dark` class on `<html>` (night) vs none (day); all
  Dusk tokens become CSS variables that change with it, so every screen and
  recoloured Kokonut/shadcn component follows automatically.
- Remembered per device (localStorage `mt.theme`); an inline script in
  `<head>` applies it before first paint so there's no flash.
- **iOS status bar:** the home-screen app's status bar text stays white
  (Apple reads that setting only at launch), so a thin status-bar backdrop
  in the tabbar/text colour sits behind it in both themes. This also stops
  content scrolling under the clock.

## Sections

1. **Your patterns** (last 90 days): migraine count, average duration (ended
   ones only), average pain (rated ones only), most common time of day
   (morning / afternoon / evening / night) and weekday. Fewer than 3
   migraines in the window → "Not enough data yet" instead of figures.
   Weather / sleep / Health patterns come later with automatic data.
2. **What you've logged:** each trigger as "stress · 3 of 4 migraines" with a
   bar, worded as frequency, not cause. Each medication as "Sumatriptan ·
   helped 3 of 4 times" (yes = helped, somewhat = half, unknown not counted).
   Top 6 of each; empty states when nothing logged.
3. **Ways to reduce migraines:** ~8 topics — sleep, stress, meals,
   hydration, caffeine, alcohol, screens & light, menstrual cycle, plus
   "Keep a diary" and "When to see a doctor" (red-flag symptoms). Topics
   matching her logged triggers come first with a "Your trigger" badge.
   Each opens to 2–4 short tips and a source link.

## Components (builder's call, approved for review)

shadcn Card (exists), Accordion, Progress, Badge — recolored to Dusk, 48px
rows, 16px text. No Kokonut: every candidate animates continuously, against
the no-motion rule.

## Constraints

- Dark Dusk palette, ≥48px targets, no animation beyond the accordion's
  open/close (off with Reduce Motion), portrait + landscape (page utility;
  two columns in landscape: patterns+logged | advice).
- Dates and time-of-day computed on the device (her timezone).
- **Print:** `@media print` renders Insights on a light background with all
  accordion topics expanded and the tab bar hidden.
- Stats are pure functions with unit tests; advice content is a typed data
  file (`src/content/reduce-migraines.ts`) so tests can check every topic
  has tips and an https source.

## Approaches considered (advice content)

1. **Static, sourced content in the code — chosen.** Reliable, offline,
   reviewable.
2. Database table — only useful if non-developers edit it; nobody will.
3. Fetched from health sites at runtime — brittle and needs a connection.

## Left to the builder

Exact tip wording (paraphrased from the cited pages, not copied), topic
icons (none, or a small lucide icon), thresholds for "time of day".
