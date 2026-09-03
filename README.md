# Timeframe — Cross-Device Attention Ledger

Timeframe is a cross-device attention ledger (Next.js web mirror + Kotlin/Compose Android app).

- **Web:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide icons, Vitest.
- **Android:** Kotlin, Jetpack Compose, Room database, pure JVM :engine, background :collector, :app.
- **Shared IP:** Pure determinism engine under twin-engine golden harness contract (goldens.json).

## Architecture

- web/: Next.js web application, metrics engine, replay dashboard, checkout & entitlement.
- ndroid/: Native Android project (:engine, :collector, :app).
- 	ools/: Shared sync tooling (sync-shared.mjs) & drift guard.
- spec-inputs/: Delivered fixture & master seed-map datasets.
