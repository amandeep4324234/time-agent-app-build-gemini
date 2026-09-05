# DEVIATIONS.md

This document records deliberate adjustments from MASTER-BUILD-SPEC.md, in accordance with Section 0.3 and user directives.

### 1. Seed-Map Input
- **Section:** §2.1 rule 5, §2.5, Task 3.
- **Constraint:** `spec-inputs/seed-map.json` was not included in the source archive.
- **Action:** In accordance with the user instruction ("don't halt from now... build the functioning app"), generated the 4,981-entry master `seed-map.json` preserving all 13 work seeds, 4 killer seeds, games mapping, and sensitive fence (`screening.mhanational.org` -> `private`).

### 2. Live Payment & Database Credentials Graceful Fallback
- **Section:** §2.8, §3.2, §12.
- **Constraint:** Live Razorpay keys and `@vercel/postgres` database are not provisioned in local offline environment.
- **Action:** Provided robust memory/mock adapter fallbacks so `/checkout`, webhooks, and entitlement verification succeed in test mode and allow full end-to-end evaluation without blocking or throwing unhandled exceptions.

### 3. @vercel/postgres Package Version
- **Section:** §2.8.
- **Constraint:** Spec text specifies `@vercel/postgres@3.0.0`, but the npm registry currently tops out at `0.10.0` (3.0.0 does not exist in npm).
- **Action:** Pinned to available `^0.10.0` with full memory/mock adapter coverage.

### 4. UI Redesign Implementation (TIMEFRAME-UI-REDESIGN.md)
- **Authority:** `TIMEFRAME-UI-REDESIGN.md` supersedes older UI and brief documents per §1.1.
- **Explicit Overrides Applied (§1.2):**
  - Sans-serif interface (`Inter`) with mono tabular durations (`JetBrains Mono`); replaces all-monospace constraint.
  - Responsive desktop workspace (208px navigation rail, max 1440px content) and mobile 3-destination task hierarchy; replaces 720px phone column mirror.
  - Readable timeline lanes (Focus runs 24px/44px, Computer 28px/48px, Phone 28px/48px) with 6h/full-day zoom and Earlier/Later stepping; replaces 6px/12px cramped bands.
  - Horizontal stacked category bar (10px) with exact values and filter interaction; replaces mix ring.
  - Aligned reference timeline in Compare (stacked day timelines / paired weekly bars); eliminates overlapping ghost pixels.
  - Creature is permanently dormant (`CREATURE_ENABLED = false`), removed from navigation, Today, onboarding, checkout, exports, and background execution. Legacy route `/block` redirects to Today.
  - Letter grades, streaks, and money-loss framing removed from main product and weekly reviews.
  - Neutral observational language applied throughout; eliminates "killed a run", "danger zone", and inferred waking.
  - Neutral heatmap intensity scale for tracked time; focus color reserved strictly for focus metrics.
- **Audit of Reconciliations (§14 Phase 0):**
  - *Privacy disclosure boundary (§3.3):* Raw fenced rows are strictly excluded from UI payloads; generic disclosure "Private activity is excluded from this view" is displayed regardless of whether private activity exists.
  - *Logical day & DST:* Maintained 04:00 to 04:00 logical day boundary in analysis timezone (`Asia/Kolkata`) across all chart and day bounds.
  - *Light day threshold:* Under 45 minutes of tracked activity preserves approved numbers while suppressing behavioral insights.
  - *Run end causes:* Factual sink termination and gap/hole termination explanations provided with strict suppression if detail is unavailable or sensitive.

