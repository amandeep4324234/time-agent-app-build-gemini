# Changelog

All notable changes to the Timeframe product UI and architecture are documented here.

## [3.0.0] - 2026-09-06

### Redesign & Visual Overhaul (TIMEFRAME-UI-REDESIGN.md)
- **Visual System**: Implemented dark instrument tokens (`--bg: #0D1117`, `--surface: #141A22`, `--focus: #E4B45F`, `--sink: #F28D87`, etc.), panel radius 10px, control radius 6px, and Inter / JetBrains Mono typography hierarchy.
- **Dormancy Policy**: Fully disabled and disconnected creature companion from navigation, Today, live block, onboarding, checkout, exports, and background processes (`CREATURE_ENABLED = false`). Legacy routes (`/block`) redirect safely to Today.
- **Application Shell**: Responsive navigation layout: 208px desktop rail, tablet top bar, mobile 3-destination bottom navigation + top bar settings control.
- **Today Workspace**: Single contiguous summary strip (primary Focus duration, supporting Sink, Deep blocks, optional goal progress line, top observation), signature 3-lane timeline (Focus runs, Computer, Phone) with 6h/full-day zoom and Earlier/Later controls, inline 320px evidence panel (desktop) / sheet (mobile), 10px stacked category bar with filter interaction, top 5 apps with expand and Sessions count, and up to 3 factual observations.
- **Patterns**: Dedicated destination (`/patterns`) supporting 7/14/28-day windows, 5 deterministic insight families (Return interval, Sink concentration, Early activity, App sequence, Recurring focus window), chart/table evidence, and data requirement disclosures.
- **Compare**: Dedicated destination (`/compare`) with aligned periods, metric deltas, dual stacked timelines for day comparison (no translucent overlap), paired daily bars for week comparison, and "What changed" 30m+ delta summary.
- **Settings**: Reorganized into Devices & data, App categories (with live search & category editing), Privacy (strict disclosure boundary), and Goals (numeric focus goal & sink allowance).
- **Weekly Review & Share Preview**: Clean weekly review without letter grades, featuring a 1080x1350 PNG share card preview with privacy gating.
