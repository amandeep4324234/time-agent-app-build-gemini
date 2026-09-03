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
