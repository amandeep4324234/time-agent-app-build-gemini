# Timeframe — UI redesign implementation contract

Version: 3.0 · 2026-09-05 · Status: implementation specification

## 1. Mission and authority

Build a polished, realistic time-analysis product whose value is useful, explainable insight into recorded app activity. The experience must make a day understandable at a glance and let users investigate the evidence without getting lost. Preserve the dark instrument-panel identity, but replace the cramped, all-monospace, miniature-chart presentation.

The owner explicitly requested this redesign and instructed that the creature remain dormant. This document is the implementation authority for the new UI, interactions, presentation, and dormant-feature policy. It is not a request to implement the entire legacy roadmap or change the collection architecture.

Place this file at the repository root as `TIMEFRAME-UI-REDESIGN.md`. Add a link at the top of `AGENT.md`: “For the current UI redesign, follow TIMEFRAME-UI-REDESIGN.md; its explicit UI overrides supersede older design instructions.” Record implementation changes in `brief/CHANGELOG.md`. Do not erase historical documents.

### 1.1 Precedence

1. Owner instructions, including keeping the creature dormant.
2. This document for presentation, interaction, feature visibility, and its explicit conflict resolutions.
3. `brief/PRODUCT.md` for collection limits, privacy, read-time computation, and locked focus-run rules.
4. Existing verified engine contracts and `MASTER-BUILD-SPEC.md` for architecture, storage, sync, and platform integration.
5. Older brief documents only where consistent with the above.

The old “zero decision-making authority” and designer-sign-off requirements do not block the design decisions explicitly made here. Do not request another accent-color or font approval. Actual missing engine inputs remain engineering blockers for the dependent functionality, not permission to invent data.

### 1.2 Explicit overrides

| Previous instruction | Replacement |
|---|---|
| Monospace everywhere; 10–11px recurring labels | Sans-serif interface; mono durations; type scale in §4 |
| Desktop mirrors a 720px phone column | Responsive desktop workspace; mobile task hierarchy in §5 |
| 6px run band and 12px device lanes | Readable timeline lanes and accessible event selection in §7 |
| Mix ring as the category summary | Horizontal category bar plus exact values |
| Translucent ghost overlay | Aligned reference timeline in Compare; no overlapping ghost pixels |
| Creature is a paid feature / allowance consequence | Dormant, unreachable, with no runtime side effects (§2) |
| Letter grades, streaks, cost framing in the main experience | No placement in this redesign; preserve existing code if present |
| Automatic day-3 tease and blurred insights | User-initiated Pro details only; clearly labeled illustrative examples |
| “Killed a run,” “danger zone,” inferred waking | Neutral, observational language (§9) |
| Heatmap intensity means tracked time but uses focus color | Neutral tracked-time intensity; focus color only for focus metrics |
| All screens answer whether a day was good | Analysis screens explain activity; setup screens explain their own next action |

### 1.3 Scope and execution boundary

The supplied archive contains specifications, not application source or delivered test fixtures. The receiving coding agent must first inspect the actual target repository. Reuse the existing stack and components. Do not claim a native app, sync system, or engine exists because a specification mentions it.

If only the supplied archive is available, prepare the integration/file plan and report the missing application source. Do not synthesize production engines, fixture files, credentials, or golden outputs. A separately authorized visual demo must be explicitly labeled “Illustrative demo”; its sample data must never be installed as a production fallback or placed in `spec-inputs/`.

## 2. Dormant features and product boundaries

### 2.1 Creature: preserve, disconnect, do not expose

If creature code/assets exist, preserve them in their existing location. Set the existing feature flag to false, or introduce a single internal `CREATURE_ENABLED = false` constant in the existing feature configuration. Do not create a new public setting.

Remove the creature from navigation, Today, live activity, onboarding, billing comparisons, empty states, screenshots, exports, and marketing copy touched by this task. Remove all mounting and background subscriptions from the active application. Disable growth, revival, death, notifications, sound, animation timers, and allowance-triggered consequences. Guard legacy direct routes and deep links: return to Today with no creature rendering. Preserve saved state without reading it during normal use.

Do not delete historical state, migrate it away, or build a new dormant creature implementation if none exists. Changing goals or exceeding an allowance must only update a numerical display; it must never trigger a creature event. Dormant does not mean hidden animation still running.

### 2.2 What ships in this redesign

- Today: summary, timeline, selected-event evidence, category breakdown, apps, and up to three supported observations.
- Patterns: one reusable insight list with evidence detail; no separate screen for each algorithm.
- Compare: aligned periods, supported metric deltas, and a concise “What changed” list.
- Existing settings reorganized into Devices & data, App categories, and Privacy; Goals appears only when already supported.
- Weekly review and share preview using existing export support.

Do not add an AI chat assistant, a new notification system, leaderboards, badges, streak prompts, letter-grade report cards, money-loss projections, social feeds, or a new collection permission. Preserve any existing excluded feature's code without promoting it in this interface. A year recap is outside this pass.

## 3. Product truth before presentation

### 3.1 What Timeframe can say

Timeframe observes foreground app/domain occupancy. It can report duration, sequence, overlap, qualifying focus runs, and supported historical patterns. It cannot know attention, effort, task completion, mood, wake time, sleep, or why someone changed apps.

Keep the established label “Focus time,” but define it in its evidence view: “Recorded time in apps categorized as Work, after the existing idle adjustment. Overlapping device time is counted once. This does not measure attention.” A deep block is an engine-qualified run lasting at least 15 minutes; do not present it as proven uninterrupted mental concentration.

### 3.2 Preserved invariants

- Use the existing session schema; add no capture fields or analytics events.
- Deduplicate deterministic IDs before computation. Derived metrics remain read-time values, not persisted totals.
- Preserve existing idle adjustment and run detection. Known sink at least 5 seconds ends a run; permitted filler is at most 60 seconds per incident and at most 10% of a run; the locked hole rule remains in force; run length is wall-clock.
- Preserve the 04:00–04:00 logical day and existing timezone/day-boundary implementation. Show the analysis timezone. Never reimplement this in a chart component.
- Count device overlap once for union totals. Device totals may legitimately sum to more than the combined total.
- No data is not zero. App-visible collection status is not proof of complete coverage unless the collector provides it.
- Privacy and collection status remain free on every tier.

### 3.3 Privacy conflict resolution: strict disclosure boundary

`PRODUCT.md` prohibits revealing fenced names or data, while older UI examples expose their durations and timing under “private.” Follow the stricter rule. Do not display fenced names, icons, identifiers, category, duration, event counts, timestamps, proportional segments, contributions, or derived app-level comparisons. Never put these in accessibility labels, tooltips, DOM attributes, links, logs, exports, or analytics. Do not relabel a sensitive interval and assume it is safe.

The presentation adapter must provide approved, display-safe aggregates; raw fenced rows never reach a renderer. Private occupancy may remain internal to the established engine where needed for correctness. Do not independently delete it before run detection. A generic disclosure says “Private activity is excluded from this view.” Show the same disclosure regardless of whether private activity exists, so its appearance reveals nothing.

Displayed category shares use only a mutually exclusive, privacy-safe denominator. If the existing backend cannot provide that safely, omit shares and show approved durations only. Never expose both an all-activity total and a public subtotal whose difference reconstructs hidden activity. Timeline blank space is always “No displayable activity”; never attribute a particular blank to privacy, absence, or tracking failure without independently safe evidence.

If a run or an explanation could reveal fenced timing through an endpoint or ending cause, suppress that detail rather than invent a cause. If safe output cannot be established, block that dependent view until the adapter is corrected. Trust beats density.

## 4. Visual system — graphite, ivory, amber

Visual thesis: an analytical desktop instrument with a readable, composed mobile counterpart. Use a large typographic summary, an expansive timeline, quiet chart scaffolding, and precise explanatory text. The signature is the timeline/evidence relationship, not decorative artwork.

### 4.1 Tokens

Use the following shared values on web and equivalent platform tokens on Android. Colors communicate categories consistently across every view.

```css
:root {
  color-scheme: dark;
  --bg: #0D1117;
  --surface: #141A22;
  --surface-hover: #1D2530;
  --surface-overlay: #202A36;
  --border: #303B49;
  --text: #EDF1F5;
  --text-secondary: #B0BBC9;
  --text-muted: #94A1B2;
  --focus: #E4B45F;
  --focus-tint: #30291D;
  --sink: #F28D87;
  --sink-tint: #342224;
  --games: #B3BBC7;
  --other: #8795A8;
  --unclassified: #627086;
  --selection: #E7EEF7;
  --radius-panel: 10px;
  --radius-control: 6px;
  --radius-chart: 3px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --duration-fast: 120ms;
  --duration-normal: 160ms;
  --duration-layout: 200ms;
  --ease: cubic-bezier(.2, 0, 0, 1);
}
```

These tokens are specified design values, not a claim of completed contrast testing. Verify rendered text at 4.5:1 minimum and essential non-text boundaries at 3:1; add outlines or labels where required. Never use unclassified/chart fills as small text colors. Focus and sink fills must carry category labels or patterns, not color alone. Error/status surfaces use neutral borders, icons, and explicit text; red is reserved for sinks.

Use a flat background. No gradients, glass blur, glow, decorative graphs, large shadows, pill-shaped metric cards, or repeated nested cards. Panels use one border and 24px padding on desktop / 16px on mobile. Within a panel, use dividers, not additional panels. Buttons may use neutral ivory with dark text; amber is reserved for focus data, not every CTA.

### 4.2 Typography

Bundle Inter for prose/UI and JetBrains Mono for durations and table numbers if the project already supports bundled fonts; otherwise use system sans and system mono with these roles. Do not add remote font requests. Font licensing files accompany any newly bundled font.

| Role | Desktop | Mobile | Weight / line height |
|---|---|---|---|
| Screen title | 28px | 24px | 600 / 1.2 |
| Primary duration | 56px | 40px | 500 / 1.1; mono |
| Supporting duration | 28px | 24px | 500 / 1.2; mono |
| Section title | 18px | 18px | 600 / 1.35 |
| Insight sentence / body | 16px | 16px | 400 / 1.5 |
| Controls / recurring labels | 14px | 14px | 500 / 1.4 |
| Secondary metadata / axes | 12px | 12px | 400 / 1.4 |

Use rem on web; scalable sp on Android. Durations use tabular numerals. Sentence-case headings; no uppercase tracking-heavy section labels. Use “4h 12m,” not “4.2h,” for primary durations. Use “0m” only for confirmed measured zero; use an em dash plus explanation for unavailable values. Screen-reader duration labels spell out hours/minutes. Date ranges include a year where ambiguity is possible. Clock formatting follows locale; precision appears only where it is needed.

### 4.3 Controls, icons, and motion

Reuse existing icon and component libraries. Icons are 18–20px, consistent outline weight, and accompanied by visible labels for primary actions. Minimum touch target: 44×44 CSS px / 48dp Android. Desktop table rows are at least 48px high; touch rows at least 56dp.

Focus indication: 2px selection-colored outline, 2px offset, visible against surrounding surfaces. Selected navigation has a filled neutral background, a left marker on desktop, and semibold text. Do not encode selection in color alone.

Hover/focus: 120ms; panel updates: 160ms; sheet/layout transitions: at most 200ms. No number count-ups, bouncing, continuous animation, or shimmer. Scrubbing directly follows input. Under reduced motion, remove transforms and animated scrolling; update immediately. Keep content stable during async updates.

## 5. Application structure and responsive layout

### 5.1 Navigation

Three primary destinations, in order: **Today**, **Patterns**, **Compare**. Settings is secondary. The user can enter a past day through Today's date picker and return using “Back to today.” Do not create a fourth primary History destination containing the same data.

Desktop navigation rail: 208px wide, full height; wordmark at top; main destinations below; Devices & data and Settings at bottom. Do not place a large upgrade advertisement in the rail. A small “Pro” link opens entitlement details when relevant.

Mobile: three labeled bottom-navigation items, each at least 48dp high plus safe-area inset. Settings is an accessible top-bar button. Keep bottom navigation above system insets and out of the content's way. Do not use an unlabeled hamburger for the three primary tasks.

### 5.2 Width behavior

| Viewport | Navigation | Main content | Detail evidence |
|---|---|---|---|
| ≥1280px | 208px rail | 32px gutters; max 1440px; centered | Inline 320px column beside timeline |
| 1024–1279px | 184px rail | 24px gutters; single timeline panel | Sheet on selection |
| 768–1023px | Top labeled navigation | 24px gutters | Sheet on selection |
| <768px | Mobile bottom navigation | 16px gutters; one column | Bottom sheet, max 85dvh, internally scrollable |

Desktop Today: header, summary strip, timeline/evidence workspace, then lower grid with category/apps at 7/12 width and observations at 5/12 width. All grid children use `min-width: 0`. On narrower screens, these stack in that order.

At 390×844 with default text size, show the date header, primary and supporting metrics, and the start of the timeline without scrolling. At 1440×900 show summary and the complete timeline/evidence panel, with the next section's heading visible. Do not force these budgets at enlarged text; allow natural vertical growth.

No page-level horizontal scrolling at 320px. The timeline's explicit zoom viewport may scroll horizontally. At 200% text enlargement, reflow controls and stacked metrics instead of clipping text. Native layouts follow content size, not fixed text-bearing heights.

## 6. Today — exact content hierarchy

### 6.1 Header

Left: “Today” or selected date. Beneath: weekday, full date, and analysis timezone. Right: previous day, date picker, next day; Share week is a secondary action in the overflow on mobile. Disable future days and explain the disabled state accessibly. Date changes update the whole screen atomically and preserve device filter.

Show “Data through {time}” only when the data adapter provides a meaningful cutoff. Do not replace it with “Live” or “Synced” based on a component refresh. Device status details are one tap away.

### 6.2 Summary strip

One contiguous surface, no four equal floating cards:

1. **Focus time**: primary mono duration, amber, definition button.
2. **Sink time**: supporting duration, sink color, definition button. Definition: “Recorded time in apps you categorize as Sinks.”
3. **Deep blocks**: count plus “Longest {duration}.”

Below, a single strongest eligible observation with “View evidence.” If none qualifies, show neutral coverage context; do not manufacture an observation. Optional user-set goal appears as a small labeled horizontal progress line below Focus time, not another ring. Numerical progress may exceed a goal; bar fill caps at 100% and text reports the exact overage without celebration or punishment.

Do not add a composite score, good/bad verdict, “hours lost,” or percentage of a life. Do not compare an unfinished today against a full previous day. Today does not show a historical delta unless comparable elapsed-window data is explicitly available.

### 6.3 Lower sections

**Time by category:** stacked horizontal bar, 10px high, with Work / Sinks / Games / Other / Unclassified legend rows. Each row has duration and percentage only when approved mutually exclusive shares exist. Minimum visible segment widths must not distort proportions; very small categories remain available in the legend. Selecting a category filters the app list and highlights matching timeline segments, without changing headline totals. Show a “Clear category filter” action.

**Apps:** five rows initially, descending approved union duration; tie-break by display label then stable internal key. Columns: app/domain, category, duration, recorded session count. Session count is labeled “Sessions,” never “pickups.” Show the Sessions column only if the engine supplies a valid count. “Show all” expands the existing section. Selecting a row opens its event list for the selected date. Category editing is a labeled action, never hidden behind a long press.

**What stands out:** at most three supported insights. Each has one conclusion, a short support line, and “View evidence.” Do not repeat the summary insight; deduplicate by semantic key. If no insights qualify, one quiet empty state replaces the list. Do not leave three empty cards.

## 7. Timeline — signature interaction

### 7.1 Geometry and encoding

Title: “Your day.” Controls: device scope (All devices / Phone / Computer), zoom (Full day / 6 hours), and “Events” list alternative. Initial scope is All devices, initial zoom Full day. Unavailable sources are disabled with explicit reason, not silently represented as zero.

Full-day bounds come from the engine's logical-day instants; do not assume every day is 1,440 minutes. Axis labels use the analysis timezone. The default four-hour label interval is allowed to thin to six hours on mobile; maintain clear start/end labels. For repeated DST hours, include the offset in the readout.

Lanes, in order:

- Focus runs: 24px drawing height inside a 44px row.
- Computer: 28px drawing height inside a 48px row.
- Phone: 28px drawing height inside a 48px row.

Separate rows by 8px. Put lane labels above the lane on mobile and in a 96px label column on desktop. Category fills follow §4. Sink segments also use a subtle diagonal hatch. Unclassified segments have a dotted top edge. The focus-run lane is labeled “Focus runs”; it is not another device total.

Draw each segment at its true temporal width. Do not enlarge a 5-second event into a misleading minute-wide block. For small segments, accessible selection is provided by the Events list and zoom, not hundreds of overlapping minimum-width click targets. A selected item has a 2px ivory outline. Text inside a segment appears only when it fits without truncating essential values; otherwise use evidence detail.

### 7.2 Pointer, keyboard, and touch

- Desktop hover: a crosshair and brief safe time/category readout. Hover never replaces a pinned selection.
- Click/tap segment: select it and open evidence. Click another replaces selection. Escape closes evidence and restores focus to the initiating control.
- Full day → 6 hours centers the viewport on the selected event; if none, on the midpoint of the earliest displayable event; if empty, on noon. Clamp against day bounds.
- Six-hour view has labeled Earlier / Later buttons that move three elapsed hours, clamped to bounds. Dragging or touch scrolling is an optional equivalent, never the only control.
- In keyboard timeline mode, Left/Right selects previous/next displayable event in chronological order; Home/End selects first/last; Enter opens evidence. Provide a visible entry control and instructions. Do not add every dense segment to the page Tab order.
- Events list: chronological, same safe data and selection model. It is fully usable with keyboard and screen reader, and remains available at all widths.
- Device filter affects only timeline/events/app list. Keep the hero labeled “All devices”; show the selected scope in timeline and app headings. Focus-run lane remains labeled “Combined focus runs” and disappears for single-device scope rather than implying recomputed device-only runs. Category summary and insights remain explicitly All devices.

### 7.3 Evidence panel

Before selection, show the longest safe completed block for the day, if available, with “Select a moment to inspect it.” Otherwise show a neutral instruction, not fake detail.

Selected session shows app/domain, device, category, safe start/end, duration, and its surrounding displayable events. Selected run shows start/end, wall-clock duration, safe contributing apps, and explanation of its termination only when the engine supplies a safe cause. Sink termination copy: “This run ended when {app} became active for at least 5 seconds.” Hole termination: “This run ended after a gap longer than 60 seconds.” Add “This describes recorded app activity, not your attention.”

If termination metadata is missing or privacy-sensitive, say “Ending detail unavailable.” Do not infer a cause from a nearby colored segment. Do not call a long session one continuous deep block.

On wide screens, evidence lives inside the timeline workspace as a right column with a left divider. Smaller layouts use the existing accessible sheet/dialog primitive. Sheet has a visible Close button, labeled heading, focus containment, backdrop dismissal, and focus restoration. Mobile sheet has a drag handle visually, but closing never depends on dragging.

## 8. Patterns and Compare

### 8.1 Patterns

Header: “Patterns”; window selector: Last 7 days / Last 14 days / Last 28 days. Default Last 14 days. Each insight states its actual evaluation window, even when a minimum history requirement exceeds the selected window. Do not silently evaluate a 28-day algorithm on 14 days: mark it unavailable for that selection.

Show a vertically ordered list, not a masonry card gallery. Each item contains an observational headline, exact supporting sample count and dates, a small relevant chart only when it adds evidence, and a “View evidence” button. Chart type is fixed by insight family in §9. Show at most five insights, with no repeated app/family conclusion. Unavailable families appear in one collapsed “Data requirements” section.

Evidence uses the same sheet/panel as Today, with a chart or event table, numerical calculation, included/excluded counts, privacy disclosure, and the exact date window. No opaque confidence score or “AI discovered” badge.

### 8.2 Compare

Default comparison: previous seven completed logical days versus the seven completed days immediately preceding them. Labels include exact dates. Additional supported mode: choose two completed dates. Today is not selectable here until elapsed-window comparison exists in the engine. Free users can open an explanation of Compare, but cannot see fabricated personalized results.

Layout: date controls; three metric rows (Focus time, Sink time, Deep blocks); aligned charts; “What changed” list capped at three entries. Values show current, reference, and signed absolute difference. Percent change is secondary, omitted when reference is zero. Zero-to-positive is described as “Previously 0m”; missing reference is “No comparable data.”

For day comparison, stack two timelines with the same viewport and lane scale. Never overlay translucent colors. For week comparison, use paired daily horizontal bars on the same scale with exact durations on selection. A shared legend and clear Current / Reference labels replace color guessing. No smoothed trend curve for discrete daily totals.

If eligible day counts differ, show days with data for both periods and use per-eligible-day averages as the primary focus/sink comparison. Label these as averages. Keep raw totals in detail; do not describe lower totals from missing days as improvement. Suppress “What changed” when either week has fewer than four eligible days. App/category changes require at least 30 minutes absolute supported delta and a matching comparison basis; otherwise omit them. Deterministic sort: absolute delta descending, then safe label.

Do not invent a target, automatically conclude “better,” or recommend a behavioral intervention based on a correlation.

## 9. Insight contract, factual wording, and thresholds

Reuse verified computations through presentation adapters. Do not copy contradictory legacy pseudocode into UI components. The thresholds below are display gates, not a license to change engine rules. The backend must provide the sample set and statistic matching the displayed claim. If it cannot, withhold that insight and record the specific integration gap.

| Family | Exact meaning and minimum support | Display template | Evidence |
|---|---|---|---|
| Daily longest block | At least one completed, safe, qualifying run ≥15 minutes | “Your longest recorded focus block lasted {duration}.” | Selected run on day timeline |
| Early activity pattern | Last 7 completed calendar logical days; ≥4 eligible days; ≥4 hits; hits/eligible ≥50%; label-specific sink starts within 10 minutes of first tracked activity | “{app} appeared within 10 minutes of your first tracked activity on {hits} of {days} days.” | Date/hit table, qualifying denominator |
| App sequence | Last 14 completed days; same-device non-overlapping transitions with gap 0–60s; ≥8 valid successors after A, ≥3 A→B, proportion ≥35%; exclude self-loops | “{B} followed {A} in {hits} of {total} eligible transitions.” | Transition count table; no cross-device causal claim |
| Sink concentration | Last 14 completed days; ≥7 eligible days; ≥60 minutes in winning 2-hour window; winning density ≥1.25× whole-day mean | “{share}% of recorded sink time fell between {start} and {end}.” | Hourly histogram, full denominator |
| Return interval | Last 7 completed days; ≥3 safe sink-ended runs with valid return anchors; group samples by the named sink; suppress if >50% of eligible samples lack an anchor | “After runs ended with {app}, work apps resumed a median {duration} later.” | Sorted intervals, median, omitted count |
| Recurring focus window | Last 28 completed days; same weekday/3-hour bucket observed in ≥3 distinct weeks; ≥30m mean; use day-bucket totals, including verified observed zero | “{weekday}, {start}–{end}: an average {duration} in work apps across {weeks} observed weeks.” | One bar per observed week, mean reference line |

“Eligible” means the established engine can compute that family safely with adequate coverage. Nonempty rows alone must not be treated as evidence of a fully observed day or hour. For families that need bucket coverage, unavailable coverage suppresses the result rather than changing the denominator to only positive observations. Privacy-sensitive anchors/relationships invalidate the sample. Rolling windows are bounded calendar logical-day windows, never an unlimited search backward for enough populated days.

Return time uses the engine's sink termination instant to the next eligible work-session start. Label it “median,” not “average.” Never attach a global median to the most frequent app. Explicitly mention overnight intervals in evidence if included; the headline describes an interval, not recovery time or attention cost.

Ranking is deterministic: daily longest block first on Today; then eligible families in order return interval, sink concentration, early activity, app sequence, recurring focus window. Within a family, greatest supporting sample count first, then stable safe label. Patterns uses the same family order without the daily block. Display no more than three Today insights and five Patterns insights. No random rotation across refreshes.

The following copy is prohibited: “You woke up,” “You wasted,” “You lost $…,” “Your danger zone,” “This caused you to…,” “Your productivity score,” “Killed your focus,” medical claims, and promises to improve attention. A proposed action must be user-controlled and traceable, such as “Review app category,” “Inspect this block,” or “Compare these days.”

## 10. Read-time presentation contracts

These are view-model contracts, not new storage tables, capture fields, or a required framework. Implement equivalents in the existing language. No raw fenced row, sensitive ID, or private label may cross into them.

```ts
type Availability =
  | 'ready' | 'loading' | 'no-data' | 'light-day'
  | 'partial' | 'permission-needed' | 'error';

type Metric = {
  value: number | null;       // null is unavailable, never render as zero
  unit: 'seconds' | 'count';
  basis: 'all-devices-safe' | 'phone-safe' | 'computer-safe';
  availability: Availability;
  explanation: string;       // approved display-safe copy
};

type Insight = {
  key: string;               // stable family + safe grouping key
  family: string;
  sentence: string;          // generated from approved template
  windowLabel: string;
  sampleCount: number;
  excludedCount: number;     // only when disclosure-safe
  statistic: 'duration' | 'count' | 'share' | 'median' | 'mean';
  evidenceKey: string;       // opaque non-sensitive lookup key
  availability: Availability;
};

type Evidence = {
  title: string;
  calculation: string;
  windowLabel: string;
  chart: 'timeline' | 'histogram' | 'bars' | 'none';
  rows: Array<Record<string, string | number | null>>;
  limitations: string[];
};
```

The adapter must also expose safe logical-day bounds, timezone, safe events/runs, approved category shares, and source availability. Reuse the existing engine object shapes internally; map enum differences at the adapter boundary. Do not force a storage migration to match these names.

One selected-day request supplies the summary and timeline so they do not visibly disagree. Cancel/ignore stale responses when dates change rapidly. Evidence and chart share the same selected key. Cache only within the existing permitted request/computation lifecycle; no new derived-value persistence. Reclassifying an app invalidates affected read-time views and presents a loading state until the same updated result is ready.

## 11. Settings, onboarding, and goals

### 11.1 Devices & data

One row per existing source: device label, capture/permission status, last successful write or sync when available, and the appropriate existing recovery action. Distinguish “No recent activity recorded” from “Tracking stopped”; use the latter only with an actual collector signal. Never display a green connection indicator without evidence. Preserve existing sync behavior and encryption; this redesign does not add a cloud requirement.

### 11.2 App categories

List only safe apps/domains. Existing classification controls map to Work / Sinks / Games / Other / Unclassified. Provide text search and category filter within this screen; no global command palette. “Review unclassified apps” opens this view with Unclassified selected. Saving one category change recomputes relevant history; cancel leaves it unchanged. Private-fence restrictions cannot be overridden here. Do not expose a hidden fenced-app inventory.

### 11.3 First run

Show the real empty Today layout, with a compact setup panel: “See where your time goes.” Body: “Timeframe measures which app is on the screen and for how long. It never sees screen content, keystrokes, or anything you type.” Action opens the existing permission flow; secondary “Not now” leaves a usable empty interface. No invented sample metrics mixed into the actual day. Request only permissions required by the existing platform implementation.

### 11.4 Goals, when supported

Goals are explicit user choices. No automatically inflated target. Existing daily focus goal and weekly sink allowance are edited with labeled numeric inputs and units. Validate finite nonnegative values; require focus goal >0 when enabled; zero sink allowance is valid and rendered without percentage division. Empty means unset, not zero. Exceeding allowance shows “{duration} above your selected allowance.” Do not recolor the whole screen, trigger a creature, or send a notification.

## 12. States and trust copy

| State | Required treatment |
|---|---|
| Loading | Stable layout, static neutral placeholders; preserve date labels; mark region busy |
| No data | Em dash metrics; “No activity data for this day.” Offer Devices & data; blank heatmap cell with dashed outline |
| Verified zero | “0m” with “No activity recorded during observed coverage.” Use only with explicit coverage evidence; filled neutral heatmap cell |
| Light day (<45 tracked minutes) | Actual approved values plus “Limited activity recorded”; suppress comparative and behavioral conclusions from inadequate data |
| Partial coverage | Actual supported values plus named available source/coverage limitation; no unsupported improvement delta |
| Permission needed | Clear explanation and one permission action; app navigation stays usable |
| Error | “Couldn't load this day.” Retry; retain selected date and filters; do not replace with zeros |
| Cold-start insights | “Not enough history for this pattern yet.” Show that family's minimum requirement, not a guaranteed unlock date |
| Paid capability | Explain benefit and requirements; show no blurred personalized guesses; dismissible user-initiated Pro details |
| Privacy-suppressed detail | Generic “Detail unavailable”; do not reveal that a particular private event caused suppression |

Heatmap is secondary, opened from date/history context. Free range: last seven days; Pro may view 12 weeks. Tracked-time cells use neutral intensities, not amber: positive steps <1h, 1–<3h, 3–<6h, ≥6h mapped to #48576B, #65788F, #879BB2, #B0C0D1. No-data/zero distinction includes accessible text. Cells sit within 44px selectable calendar targets; the mark may be 12px. Long ranges scroll within the calendar surface; they never shrink touch targets to fit.

## 13. Free/Pro and sharing presentation

Preserve core free value: Today, timeline exploration, safe category breakdown, recent seven-day history, basic factual day explanations, device/privacy status, and weekly week card. Historical pattern analysis, full history, Compare, and supported goals are Pro. Do not paywall explanations necessary to interpret an already visible number.

Keep existing verified purchase integration and price source. The brief's $15/year early-bird figure is historical configuration, not proof of current store pricing. Render store-provided annual price prominently, with monthly equivalent secondary and explicitly “billed annually.” If price data is unavailable, do not show an invented checkout amount. Creature, grades, and year recap are not advertised in this redesign. No automatic day-3 teaser or repeated upgrade interruption.

Weekly review: exact date range, supported focus/sink durations, deep blocks, daily bars, and days-with-data coverage. No grade. Use the same display-safe aggregate source as the app. If export exists, Share week opens an explicit preview before the OS share/save action. Render 1080×1350 PNG, solid background, at least 36px smallest text, with safe margins of 64px. Preview matches final pixels. App labels are off by default and may be opted in only for non-fenced apps. Never export sensitive activity, rate settings, account identifiers, raw device IDs, or hidden metadata. No promotional watermark or imposed branding banner. Cancel does nothing.

If export support is missing, omit the Share action and record that integration gap; do not ship a button that only shows a success toast.

## 14. Implementation sequence and file responsibilities

### Phase 0 — reconcile and map

Read `AGENT.md`, this file, `brief/PRODUCT.md`, and actual application entrypoints. Identify current platform, navigation, components, token files, engine adapters, entitlement source, and delivered test fixtures. Record the exact file mapping in `DEVIATIONS.md`. Preserve stack, lockfiles, collection, and golden fixtures. Implement serially; this UI pass does not require spawning the legacy agent fleet.

Audit these known legacy contradictions before wiring affected data: privacy-name masking versus data exclusion; run end enum differences; wall-clock duration versus summed occupancy; day crossing allocation; “on any device” hole wording; fixed-hour versus DST days; median labeled average; falsely claiming a <45-minute light day cannot contain a 25-minute run; and contradictory report-grade formulas. Do not fix the dormant grade/streak engine as collateral work. Use verified engine behavior for locked rules, document unresolved mismatches, and block only dependent features.

### Phase 1 — dormancy and design foundation

Disable creature entrypoints and subscriptions. Create shared theme/type/spacing tokens. Restyle shared controls, headers, panels, navigation, and focus states. Establish responsive shell and empty/loading/error states. Keep existing working functionality reachable.

### Phase 2 — complete Today

Implement safe adapter boundary, summary, timeline, Events alternative, evidence detail, categories, and app rows. Finish keyboard/touch use and truthful source/coverage labels before adding historical insights. Deliver a coherent usable surface, not a collection of disconnected components.

### Phase 3 — reuse evidence for Patterns and Compare

Wire only supported families meeting §9 gates. Add exact sample/window disclosure and deterministic ranking. Build aligned comparisons with eligibility rules. Keep lack of data distinct from lack of entitlement.

### Phase 4 — integrate settings and weekly review

Reorganize existing settings, classification, goals, and share flow. Apply dormant-feature removal to Pro copy and owned product surfaces. Do not build new billing infrastructure.

### Phase 5 — validate and hand off

Run actual production build and meaningful existing tests, then the checks below. Capture desktop/mobile populated and empty states from a real local build using approved fixtures. Include the evidence-open state. Report actual checks and remaining integration blockers. Do not claim parity, visual QA, privacy safety, or complete functionality without performing the corresponding check. Update `brief/CHANGELOG.md` and `DEVIATIONS.md` with the implemented overrides.

## 15. Acceptance checklist — all applicable checks must pass

### Product and appearance

- [ ] No creature appears in normal navigation, deep links, goals, Pro copy, onboarding, exports, or background execution; preserved state remains intact.
- [ ] Today has one dominant duration and a visually dominant timeline; no grid of equally weighted KPI cards.
- [ ] At 1440×900 and 390×844, default-size first viewport meets §5 budgets; at 320px and 200% text, content reflows without clipping.
- [ ] UI uses specified font roles, exact tokens, panel radii, and one coherent spacing grid.
- [ ] No decorative chart, invented metric, fake connection state, countdown, grade, guilt copy, or unsolicited upgrade modal.
- [ ] A five-second review of populated Today lets a tester identify focus time, sink time, and where to inspect the day's sequence. This is a usability check, not a productivity verdict.

### Interaction

- [ ] Date stepping/picker cannot select future days; rapid date changes cannot show stale results.
- [ ] Device/category filters clearly state their scope; unchanged summary metrics remain labeled All devices.
- [ ] Timeline segment, Events row, and evidence detail select the same safe event and values.
- [ ] Full-day/six-hour zoom and Earlier/Later work at day boundaries, including DST days supplied by fixtures.
- [ ] Keyboard-only users can select events, open/close evidence, change dates, edit categories, and navigate all destinations.
- [ ] Sheets have labels, focus handling, visible close controls, and appropriate mobile safe-area padding.
- [ ] Every visible action performs its named behavior; missing integrations do not masquerade as completed actions.

### Data honesty and privacy

- [ ] Known engine fixtures retain union, dedupe, idle, logical-day, and run-duration outputs after the UI changes.
- [ ] No-data, confirmed zero, light, partial, error, and permission-needed states are distinct.
- [ ] No full-day historical comparison is presented as an improvement against unfinished Today.
- [ ] Every insight meets its family gates and reproduces its evidence numerator, denominator, dates, and statistic.
- [ ] A median is labeled median; app-specific claims use app-specific samples; overlapping cross-device rows are not described as sequential behavior.
- [ ] Fenced names, timing, duration, identifiers, and reconstructable contributions do not appear in UI payloads, DOM/accessibility, tooltips, exported pixels, logs, or URLs.
- [ ] Privacy suppression never invents a replacement cause; unsupported private-sensitive detail stays unavailable.
- [ ] No capture field, event analytics, derived-metric table, or new tracking permission was introduced.

### Accessibility and resilience

- [ ] Normal text contrast ≥4.5:1; essential chart/control distinctions ≥3:1 or a verified equivalent non-color representation.
- [ ] Color is not the sole category/state channel; controls have visible focus and accessible names.
- [ ] Touch targets meet §4; dense charts have an equivalent navigable event list.
- [ ] Reduced motion is respected; focus is preserved during refresh and after closing overlays.
- [ ] Large supplied histories do not create an unbounded DOM/event list; use the existing virtualization/windowing facility when needed.
- [ ] Production build and relevant existing engine/integration tests pass; existing fixture files are unchanged.

## 16. Required coding-agent completion response

Return: what changed, which actual screens were implemented, how creature dormancy was verified, what build/interaction/privacy checks ran, representative desktop/mobile screenshots when testing is available, and concrete blockers with affected features. Distinguish design implementation from backend integration. Do not ask for aesthetic approval of decisions already specified here, and do not claim the entire product is production-ready merely because the UI builds.

The finished product should feel precise and calm: the numbers are readable, the day is inspectable, and every insight can explain itself.
