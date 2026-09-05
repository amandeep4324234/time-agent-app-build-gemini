# Timeframe — Premium Insight Dashboard & Focus Block Specification

Version 4.1 · Owner-directed replacement · 2026-09-05

**Read first:** This is the complete replacement specification. Sections 2–6 define the visual experience; 7–9 define Focus Blocks and synced corrections; 10 defines insights and the custom-range AI Analyzer; 12 defines searchable logs; 13–15 define implementation and acceptance. The creature stays dormant throughout.

**Implementation priority:** compact premium Overview → large interactive timeline and app lens → Focus Block/review → synced corrections → searchable Logs → evidence-backed AI observation and custom Analyzer. Do not implement only the styling and call the full task complete.

## 1. Build this vision

Timeframe should feel like a beautifully designed personal time observatory: an insight-focused dashboard with composed cards, expressive graphs, a witty, evidence-grounded AI observation at the top, and a large horizontal timeline that feels satisfying to explore. Focus blocks glow softly within the day. Users can start an intentional block, review the activity recorded inside it, add their own meaning, and correct what counts—even after the underlying records have synced.

Premium means strong composition, typography, precise interaction, beautiful data rendering, and excellent small details. Minimalist means visual restraint and clear priorities; it does **not** mean tiny strips, bare rows, no cards, or suppressing useful charts.

The defining experience is:

1. Read a short personal reflection.
2. Understand the day through a few beautifully composed metric cards.
3. Explore a large time canvas and its highlighted focus blocks.
4. Start a block when ready to work.
5. Review, tag, and correct its recorded activity afterward.
6. See historical insights recompute from those corrections.

### 1.1 Authority and explicit changes

This document replaces the previous `TIMEFRAME-UI-REDESIGN.md` in full. Place it in the project root beside `AGENT.md`. Add a pointer at the top of `AGENT.md` making this the current UI and Focus Block implementation contract. Record supersessions in `DEVIATIONS.md`; preserve older documents as history.

The owner now explicitly authorizes:

- A compact card-led dashboard, sophisticated charts, restrained gradients, focus highlights, an app-icon grid, and searchable organized logs.
- An AI-crunched, original observation with optional witty, gently teasing accountability against explicit user intentions.
- A spacious, horizontally zoomable and scalable timeline.
- Intentional Focus Block mode, custom tags, post-block review, and later corrections.
- Persisted user-authored blocks, tags, and correction records, with sync support for edits made after usage data was sent.

These user-authored records are a deliberate extension to the old “session rows only” feature boundary. They do not authorize new passive surveillance. Raw capture remains foreground occupancy only. No screenshots, page content, page titles beyond what already exists, keystrokes, or new attention sensors.

The previous bans on cards, gradients, glow, custom AI, and new block workflows are superseded. Preserve verified engine rules, deduplication, overlap handling, logical-day boundaries, and privacy protections unless an explicit rule below addresses presentation or user corrections. Do not use an older design lock to reject this design.

The supplied ZIP contains specifications, not working application source. The implementing agent must inspect the actual repository and reuse its stack, navigation, design primitives, engine adapters, billing, and storage. If application source or delivered fixtures are missing, report those concrete integration blockers; do not invent a functioning backend. A visual prototype must be labeled as a demo and kept separate from production data and goldens.

### 1.2 Dormant creature

Keep the creature dormant. Preserve existing code, assets, and stored state if present; do not implement it if absent. Disable its entrypoints, background listeners, timers, animation, growth/death/revival behavior, notifications, and goal consequences. No creature in cards, navigation, Focus Mode, pricing, onboarding, or export. Guard old deep links. There is no user-visible creature toggle. Focus Block mode is a timer and review workspace, not a creature replacement game.

## 2. Art direction: Midnight Studio

Commit to one visual direction rather than generating multiple competing themes.

A deep ink background supports slightly lighter floating cards. Off-white type carries most of the visual weight. Cool periwinkle is the primary focus color, with a small cyan edge in selected focus treatments. Muted rose represents sink activity. Softly rounded corners and precise hairline borders give structure. A few carefully placed gradients make the product feel designed; whitespace prevents it from becoming a neon control room.

The three memorable visual elements are:

- **AI observation:** a slim, editorial, often witty interpretation with a small evidence link, pinned within a compact command area.
- **Focus ribbon:** a broad, translucent highlighted region spanning a focus block on the timeline, with a bright top edge and an elegant duration label.
- **Evidence cards:** metric-specific graphs that open the exact observations behind their conclusions.

No stock illustrations, random decorative waveforms, giant marketing heading, mascot, glass blur over every surface, or all-monospaced terminal aesthetic. Do not fill space with more cards. Different card sizes must communicate importance.

### 2.1 Shared tokens

```css
:root {
  color-scheme: dark;
  --background: #0B0E14;
  --sidebar: #0E121B;
  --card: #141A25;
  --card-raised: #1A2230;
  --card-hover: #1F2939;
  --border: #2B374B;
  --border-strong: #53637D;
  --text: #F2F5FB;
  --text-secondary: #B8C4D8;
  --text-muted: #96A5BD;
  --focus: #AAA9FF;
  --focus-edge: #D0CEFF;
  --focus-secondary: #7CDCE5;
  --sink: #EE9DAA;
  --games: #D9BE87;
  --other: #92A6C1;
  --unclassified: #64748B;
  --selection: #E3EAFF;
  --success: #90D2BC;
  --radius-card: 18px;
  --radius-control: 10px;
  --radius-segment: 6px;
  --shadow-card: 0 10px 28px rgba(0,0,0,.16);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --motion-fast: 120ms;
  --motion-normal: 180ms;
  --motion-layout: 240ms;
  --ease: cubic-bezier(.2,.8,.2,1);
}
```

Default card: 1px border, 18px radius, 24px padding, restrained shadow. Mobile padding 16px and radius 16px. Internal subdivisions use spacing/dividers rather than nested cards. Card hover changes border/surface without moving the card.

Gradients are permitted in exactly these roles: the AI card's faint corner illumination; the focus ribbon; chart area fills. Do not put gradients behind body paragraphs or every metric card. Color opacity never carries essential text contrast.

Focus chart line: 2px, `--focus`; area fill fades from 20% at the line to 0% at baseline. Selected focus ribbon: 14% periwinkle fill, 1px 55% periwinkle border, 2px bright top edge, optional outer glow no larger than 12px at 14% opacity. High-contrast mode removes glow and uses a solid outline.

### 2.2 Typography

Use the existing sans family if suitable; otherwise bundle Inter. Use JetBrains Mono only for primary durations, timer, and precise chart readouts. Prefer existing bundled font resources; no remote font dependency required.

| Role | Desktop | Mobile | Weight / line height |
|---|---|---|---|
| Page heading | 28px | 24px | 600 / 1.2 |
| AI reflection | 22px | 18px | 450 / 1.45, sans |
| Main duration | 44px | 36px | 500 / 1.15, mono |
| Other card metric | 30px | 26px | 500 / 1.2, mono |
| Active block timer | 72px | 56px | 450 / 1.1, mono |
| Card heading | 17px | 17px | 600 / 1.4 |
| Insight/body | 16px | 16px | 400 / 1.5 |
| Controls/labels | 14px | 14px | 500 / 1.4 |
| Supporting metadata | 12px | 12px | 400 / 1.4 |

Use rem/sp and support text enlargement. Durations: `2h 18m`, `46m`, timer `24:08`. Use tabular numbers. No letter-spaced uppercase headings everywhere. Full number/unit labels are available to screen readers. Locale-sensitive dates and clocks; show timezone in date and timeline details. Distinguish em dash/unavailable from verified `0m`.

### 2.3 Accessibility and movement

Touch targets: at least 44px web / 48dp Android. Focus ring: 2px selection color with 3px offset. Every chart has a readable table/list equivalent. Verify text contrast ≥4.5:1 and essential non-text distinctions ≥3:1; do not assume the proposed palette alone proves compliance. Category labels, line styles, and patterns supplement color.

Hover 120ms, state changes 180ms, sheet/layout transition ≤240ms. Zoom and direct scrubbing track input without delayed spring motion. No number counting animation on every refresh. Only the active focus boundary may pulse slowly, and never under reduced motion. No continuous background animation. Preserve text and scroll position during data refresh.

## 3. Compact workspace: overview first, depth on demand

Primary destinations: **Overview**, **Focus blocks**, **Insights**, **Logs**. Compare lives inside Insights. Settings and Devices & data are secondary. Desktop has a 192px rail with icon + short label; tablet uses a compact labeled top navigation; mobile has four labeled bottom-navigation items. The page header always offers **Start focus**, changing to **Return to block · {elapsed}** while active.

Overview is a compact instrument workspace, not an endlessly stacked report. It exposes the current interpretation, key numbers, timeline, and app grid. Extra charts live in tabs or the Insights destination. App detail opens in a panel. Logs have their own destination. Do not place a long app table, three insight cards, a heatmap, and two graphs sequentially beneath the timeline.

### 3.1 Pinned command area

The compact header and AI observation form a pinned command area. Desktop: header approximately 56px, observation 60–80px; sticky at the top of the main scroll container. Mobile: one 56px header plus a 56–76px observation. Use an opaque background and bottom hairline, not transparent text over moving graphs. Heights are content-driven and increase for text enlargement.

Header contains page/date controls and the primary focus action. Observation contains the AI sentence, small AI label, Why this? and tone overflow. No giant quote marks or decorative banner. When the user scrolls, collapse secondary metadata, not the quote's essential meaning or the focus action. The observation may use a shorter prevalidated version only if it preserves the claim; otherwise keep it intact. Never marquee or auto-rotate text. Hide the pinned observation entirely when the user turns it off.

On very short viewports (<600px high) or large text settings, pin only the header/action; let the observation scroll normally. Sticky UI must not consume the whole usable viewport or cover focused controls. Reserve bottom-navigation and sticky-footer space explicitly.

### 3.2 Desktop composition and exact budget

At ≥1200px, use a 12-column main grid, 20px gaps, 24px gutters, maximum 1480px. At 1440×900 and 100% text, target the following composition:

| Region | Placement | Target content height |
|---|---|---|
| Command area | Full width, pinned | 120–136px |
| Four metric cards | Full width; Focus 4/12, Blocks 3/12, Sink 3/12, Longest 2/12 | 116–136px |
| Time canvas | Left 8/12 | 390–430px including toolbar/navigator |
| App grid | Right 4/12, aligned with time canvas | Same outer height as canvas |
| Workspace tabs | Beneath time canvas, optional lower row | A single active 180–220px panel; collapsed by default |

The default desktop overview fits the command area, metrics, timeline, and icon grid within roughly one viewport; at 900px height total page scrolling should stay under 200px without browser zoom. These are QA targets, not fixed-height containers allowed to clip content. The extra panel is explicitly opened by tabs **Rhythm / Mix / Patterns**; switching replaces its content rather than appending another section. Include a clear Close detail action.

At 1024–1199px, show timeline full width with Apps / Rhythm / Mix / Patterns in the single detail workspace below. At smaller widths, use the mobile composition. Avoid multiple independently scrolling small cards on Overview. The app grid is paginated rather than internally scrolled; the timeline has intentional horizontal pan only.

### 3.3 Mobile composition

At 390×844, prioritize legibility and short navigation:

1. Pinned header and compact AI observation.
2. Two-by-two metric cards, approximately 96–112px each; Focus is visually dominant through typography, not double height.
3. One workspace tab bar: **Timeline / Apps / Patterns**. Default Timeline. Each tab replaces the region below it; do not stack all three.
4. Timeline begins immediately under tabs; approximately 330–390px including controls/navigator in its default combined-device view. Apps is a 4-column icon grid. Patterns shows one strongest insight with Previous / Next and Open Insights.
5. Persistent bottom navigation.

Target default mobile Overview document height ≤1.4 viewports at 390×844, normal text and no expanded detail. A small vertical scroll is acceptable; do not make essential controls tiny to force a screenshot fit. When device lanes or event details expand, show an intentional expanded workspace/sheet rather than making the default dashboard permanently tall.

At 320px, mobile app grid uses 3 columns; controls wrap and timeline labels thin. At 200% text, prioritize full readable content over the viewport budget. No truncated essential metrics, no global horizontal scrolling. Mobile detail sheets can scroll; the app dashboard should not accumulate their content underneath itself.

### 3.4 Metric cards

1. **Focus time:** approved effective Work duration across devices. Large value, tiny optional goal line and a seven-day sparkline. Click opens definition and evidence.
2. **Focus blocks:** completed intentional blocks; secondary “{n} reviewed.” Mini bars of completed elapsed durations. Never substitute auto-detected deep blocks.
3. **Sink time:** effective Sink duration and a restrained rose mini-series; factual share only with a valid denominator.
4. **Longest deep block:** longest engine-qualified run, with “Auto-detected” metadata and a small run strip.

No-data is an em dash with explanation; no intentional blocks reads “No blocks yet.” All metrics and timeline use the same revision. Selected-date comparison does not compare an unfinished day to a full day. Click-through opens panels; it does not add expanding metric paragraphs to the dashboard.

### 3.5 App constellation: a readable icon grid

Display apps as recognizable icon tiles, not a list of raw domains such as instagram.com. Each tile contains a 36–40px icon inside a 48px icon well, short friendly label below, and one duration. Tile target 76–88px wide × 84–96px high. Default desktop right panel: 3 columns × 3 rows, nine apps per page; on wide panels ≥420px use 4 columns × 3 rows. Mobile: 4 columns × 3 rows (3 columns below 360px). Pager has Previous / Next and an accessible page label. Default order: effective safe duration descending; tie by friendly name then stable ID. A small sort control offers Time / Name. No bouncy rearrangement while someone is interacting.

An icon is not a reason to remove its accessible name or all text. Show “Instagram,” not “instagram.com”; unknown domains use a short derived site name and a letter tile. Exact captured domain appears only in detail when needed to distinguish records. Names can wrap to two lines. Duration remains readable. Tooltip/accessibility label includes the full friendly name, duration, and action.

Prefer installed-app icons from permitted local metadata and bundled known-service assets. For unknown sites use a local initials fallback. Do not send browsing domains to a third-party favicon service, fetch arbitrary remote URLs, execute remote SVG/HTML, or introduce a network side channel merely to render logos. Resolve aliases through a conservative explicit map; do not merge unrelated services or devices just because names look similar. Branding colors stay inside icons, so the overall dashboard remains calm. App icons do not change category chart colors.

Selecting a tile opens **App lens**, a right sheet at desktop (440–520px) or full-height mobile sheet. Close returns to the same grid page/focus. The sheet never pushes the main dashboard into a longer document. No hidden swipe-only interaction.

### 3.6 App lens: nerdy, useful, easy to read

Header: large icon, friendly name, safe domain/source context, current category, selected date/window. Tabs: **Summary / Patterns / Sessions**. Consistent controls: Today / 7D / 14D / 28D. Defaults inherit the current dashboard period.

Summary shows total union duration, sessions (when counted correctly), median session length, longest session, and one compact session-length histogram. These describe occupancy, not actual app launches or phone unlocks. Buttons: View in timeline / Review category / Exclude selected activity. Scope is always explicit.

Patterns shows at most three eligible nerdy insights; plain-English conclusion first, exact calculation below:

| Insight | User-facing value | Definition and gate |
|---|---|---|
| Quick checks vs long visits | “Most sessions were short; most time came from longer visits.” | Same-device sessions; show count and time shares for <1m, 1–5m, >5m; ≥10 valid sessions; compute claim from actual distribution |
| Typical session | “Median visit {duration}; 80% ended within {p80}.” | Median and nearest-rank p80 duration; ≥10 valid sessions; never call median mean |
| Revisit interval | “A median {duration} between recorded visits.” | Same-device next-session start minus prior session end; nonnegative valid gaps, ≥5; omit gaps crossing unknown coverage |
| After this app | “{B} followed in {hits} of {eligible} transitions.” | Same-device non-overlapping successor within 60s; ≥8 eligible transitions, ≥3 matching; exclude private/self-loop pairs |
| Inside focus blocks | “{duration} appeared inside your planned blocks.” | Union of app activity intersecting intentional active intervals; ≥1 block; clarify overlap is not proof of distraction |
| Return to Work | “Work apps resumed a median {duration} later.” | Sink-ended engine runs attributable safely to this app, ≥3 return samples; suppress if >50% anchors missing |
| Time-of-day signature | Hourly histogram with clear peak if supported | ≥7 observed eligible days in 14-day window; ≥60m in winning two-hour window; no peak claim for flat distribution |
| Review impact | “You reclassified {duration} as Work.” | Explicit accepted correction history; ≥1 relevant revision; distinguishes correction from behavior change |

When data is sparse, show exact descriptive values and “More recorded sessions needed for this pattern”; do not fill the sheet with made-up statistical insights. Histograms have bin labels, units, and a list/table alternative. Sessions tab deep-links to Logs prefiltered by the canonical app key, keeping friendly naming in the UI.

## 4. AI-crunched observations: witty, personal, evidence-backed

This feature is a small AI interpretation layer that crunches approved observations and the user's explicit intentions into one original line. It is not a random quote generator, generic motivational wallpaper, a famous-person quote, or a long chat conversation. The personality should appeal to someone who likes data and a little dry humor.

The assistant/model identifies an interesting supported contrast, chooses an angle, and writes the observation. All arithmetic and evidence are produced and validated by the deterministic engine. The model does not invent goals, infer hidden intent, or calculate unsupported statistics from raw browsing rows.

### 4.1 Voice and settings

Default tone: **Witty**. Other options: **Straight facts**, **Gentle**. Witty allows light teasing of a recorded pattern, never the person's intelligence, worth, health, or character. Gently remind users about an intention only when they explicitly set a target, block title/context, allowance, or review choice that supports it.

Default 12–26 words, hard maximum 36. One observation, optionally one small suggestion. No excessive exclamation points, emojis, lecture, “I'm disappointed,” or fake intimacy. No automatic notifications or recurring reprimands. The user can dismiss today's line, switch tone, or turn the feature off. “Not relevant” hides that candidate without treating feedback as new surveillance.

Illustrative tone examples, permissible only when their facts exist:

- Planned 45-minute completed block with 12 minutes of Instagram: “You booked 45 minutes for work. Instagram booked 12 of them.”
- User-set completed-day goal of 60 minutes, actual Work 42: “The plan said 60 minutes. The log says 42. A modest plot twist.”
- Ten sessions under one minute: “Ten quick checks. Your app-switching got a workout.”
- Three reviewed blocks completed with Work activity: “Three blocks, reviewed and accounted for. A tidy little dataset.”

Never say someone failed a daily goal while there is still time left, or imply time in a chosen app is necessarily wasted. For in-progress Today, use remaining duration against a chosen goal without predicting failure. A sink classification is a user choice; an app appearing during a block is not itself proof of unwanted behavior. Review-driven reclassification invalidates incompatible jokes immediately.

### 4.2 Compact card and proof

Label **Timeframe AI**; one original line; Why this?; overflow with Tone / Refresh / Hide today / Turn off. It lives in the compact command area in §3. Do not build another large AI panel on Overview. Why this? shows the factual contrast, sample counts, period, the user's applicable intention, and an evidence link. Example: Planned active block 45m; recorded Instagram overlap 12m; reviewed state; effective revision. The joke never substitutes for these numbers.

### 4.3 Safe fact envelope and model output

Build candidate facts first: explicit intention versus recorded outcome; change from a comparable period; repeated short sessions; block completion/review pattern; app-return interval; positive consistency; or insufficient-data/general line. Candidate facts carry IDs, exact values/units, eligible sample counts, coverage, window, reviewed status and applicable correction revision.

Rank candidates by relevance to explicit intent, minimum support, recency and non-repetition. On Today prefer active/completed blocks and completed comparable windows; avoid a full-day failure judgment. Maintain only existing-permitted/device-local presentation preferences to avoid showing the identical angle repeatedly; do not add analytics tracking.

The model receives a bounded allowlisted fact packet and tone. It can select supporting facts and express a witty contrast, but cannot change evidence. Required output: `text`, `supportingFactIds`, `angle`, `tone`, `requiresCompletedWindow`. Validate facts, numbers, units, window completion, length, and character-targeting/shaming claims. Invalid output falls back to a safe deterministic original line. A fallback is labeled “Local summary,” not falsely labeled AI-generated.

For app-specific humor, generic “that app” is possible locally. Named external-provider generation is opt-in: explain what is shared and allow **Aggregate facts only** (default) or **Include selected app names**. In aggregate mode, use neutral placeholders such as APP_1 and substitute approved friendly names locally only through a validated structured mention; the provider never sees the actual name. Custom tags, block titles and personal context are excluded unless the user separately chooses to include that context. Privacy-fenced activity never enters any mode.

User-authored titles/tags/context are untrusted data, not model instructions. Never send raw sessions, page content, full browsing records, device/account IDs, or private fields. Use the existing secure provider gateway and keep credentials off clients. No model/provider is prescribed here; the integration must follow its actual environment and cost constraints.

### 4.4 Generation cadence, corrections and fallbacks

Generate on deliberate Overview entry with a materially changed completed fact set, at most three automatic observations per logical day, and no more frequently than once per 60 minutes. Explicit Refresh may request one more under the configured quota. Do not regenerate every timer tick, scroll, tab change, or session sync. Keep text stable during interaction; show new observations on next entry or explicit refresh, except retract a now-invalid claim immediately.

Correction invalidation outranks cadence limits. Remove stale goal/app jokes and figures as soon as their revision changes; show an updated local summary until a valid model result is available. AI generation runs asynchronously and cannot block dashboard, logging, tracking, or save. A cached presentation line is keyed to its facts/revision, not treated as authoritative stored metrics.

First external use requires Enable / Keep local summary with a plain-language aggregate-processing explanation. If no provider exists, mark the AI integration incomplete and provide the honest local fallback. Offline/model error/rate limit follows the same fallback. Generic original thoughts may appear as “General reflection” only when the user wants them; do not masquerade as personalized analysis.

### 4.5 Monetization intent without a promise

A witty, accurate observation plus inspectable personal patterns is a candidate Pro benefit. Do not assume users will pay for one joke alone. The valuable bundle is relevant interpretation, attractive app analytics, long-term patterns, and low-friction review. Preserve free essential data accuracy, correction controls, and privacy. Do not add pricing, guilt-driven upgrade copy, surprise model charges, or a fake blurred personalized quote. Product-market demand remains a hypothesis to validate with users, not a claim built into the UI.

## 5. Time canvas: large, scalable, zoomable

This is the main visual attraction. It must look like an editable analytical canvas rather than three narrow colored strips.

### 5.1 Card anatomy

Header: **Your time, mapped**; selected date/timezone; device scope. Toolbar: Full day / 12h / 6h / 3h / 1h / 15m; minus, plus, Fit selection, Reset; density Compact / Comfortable / Expanded. Default: 6h centered on the most recent displayable activity for Today, and Full day for a completed past day. Always show a full-day navigator below so the user understands the current window.

Main canvas fills its allocated workspace in §3. Default comfortable drawing area is approximately 220–260px desktop, plus toolbar/ruler/navigator. On mobile, default combined device row saves vertical space; Expand devices reveals separate rows or opens the expanded canvas. Heights grow when labels wrap. Lane drawing heights:

| Lane | Compact | Comfortable | Expanded |
|---|---|---|---|
| Intentional focus blocks | 40px | 56px | 72px |
| Automatically detected deep blocks | 24px | 36px | 48px |
| Computer activity | 36px | 48px | 64px |
| Phone activity | 36px | 48px | 64px |

Use 12px lane gaps and 16px chart padding. Horizontal zoom changes time scale; density changes lane height. Do not conflate the two. Hide unavailable device lanes with an explicit availability note. Deep blocks and intentional blocks have separate labels and encodings.

For concurrent intentional blocks created on different offline devices, stack non-overlapping subrows in their lane; never draw one over another invisibly. See conflict behavior in §9.

### 5.2 Focus ribbon treatment

An intentional block appears as a broad rounded ribbon in its own lane, with title, duration, and small tag chips when they fit. A faint continuous vertical wash may extend behind the device lanes for the block's **active intervals only**. It sits behind event bars and never makes sink/other events look like Work. Paused intervals have a neutral dashed connector and no focus wash.

Reviewed block: small check icon and “Reviewed” in detail. Unreviewed block: small hollow marker and “Review” action. Active block: bright right boundary and elapsed label. Selected block: stronger top edge and outline. Overlapping block washes use the union of intervals at one fixed opacity; do not brighten overlap and imply extra time.

Automatically detected runs use a solid periwinkle bar with a distinct square start marker and their own row. They never inherit intentional-block tags unless explicitly shown as annotation context.

At broad scales, tiny activity records keep truthful temporal widths. They may be binned into category occupancy segments for rendering, with “Aggregated view—zoom for individual sessions.” Bins must preserve duration totals; never widen an event to change its apparent length. The focus ribbon remains clearly visible while device-level detail increases on zoom.

### 5.3 Interaction mechanics

- Scroll wheel normally scrolls the page. Ctrl/Cmd + wheel over the canvas zooms around the pointer; never hijack ordinary scrolling.
- Plus/minus move through the preset scales. Minimum window 15 elapsed minutes; maximum is the actual logical day's duration, including DST differences.
- Pointer drag on empty canvas pans; dragging an event does not edit timestamps. Touch uses one-finger pan and pinch zoom, with visible button equivalents.
- Full-day navigator has an outlined viewport brush, 44px interactive handle targets, and accessible start/end controls. Brushing changes the main viewport; it is not a block editing tool.
- Zoom anchor: pointer time when available, selected event midpoint otherwise, viewport center as fallback. Clamp to logical-day bounds.
- Hour labels adapt to width; aim for ≥72px between major ticks. Time values derive from instants, not a fixed 24-hour array. Repeated local hours include offset in tooltip.
- Clicking a block selects it and opens a detail sheet on desktop or mobile; it never appends a permanent section below the dashboard. Selecting an event opens its app/category/duration detail and “Correct activity.”
- Viewport width affects label density, not recorded duration. No body-level horizontal overflow at 320px.
- Keyboard entry into the canvas exposes Left/Right event navigation, +/- zoom, Shift+Left/Right viewport pan, Enter detail, Escape close. Include visible instructions and Events list alternative.

Persist density and preferred zoom as device-local display preferences. Selected date/range is navigation state, not analytics data. Reset returns the date's default viewport. Switching days cancels stale requests and preserves density.

### 5.4 Selected detail

Block detail: title, status, active elapsed time, recorded Work time, Sink time, excluded time when safe, tags, review state, sync state; actions Review/Edit, Show activity, View revision history. Session detail: safe label/device, actual captured time range, effective category, adjustment indicator, correction entrypoint. Never imply raw captured timestamps were rewritten by a visual adjustment.

Show “Combined across devices; overlap counted once” in the evidence explanation. Time spent in a planned block is not proof of focus. The highlight is an intentional interval, not an automatic reclassification of everything inside it.

## 6. Fancy graphs that answer real questions

Use a small set of strong chart designs rather than a graph for every possible statistic. No fake smoothing, random decorative series, 3D pies, or speedometer productivity scores.

| Card | Visualization | Question | Drill-down |
|---|---|---|---|
| Your rhythm | Soft area/line chart of daily Work duration; discrete points; gaps for missing data | How is recorded Work time changing? | Day timeline |
| Time mix | Elegant 160px donut, 12px stroke, center display-safe tracked total; exact legend beside it | Where did recorded time go? | Filtered app/event list |
| Focus block lengths | Rounded horizontal bars, one per intentional block, elapsed vs recorded Work as separate labeled tracks | How did each block actually go? | Block review |
| Best windows | Hour-of-day histogram or weekday/time heatmap, per eligible observed bucket | When do longer work periods tend to appear? | Bucket samples and coverage |
| What changed | Aligned current/reference bars and exact deltas | Which activity changed between comparable periods? | Compare evidence |
| Return intervals | Dot plot with median line | How long between a recorded interruption and work resuming? | Individual samples |

Overview exposes Rhythm, Mix, and Patterns through the single optional workspace panel in §3; only one is visible at a time. The full Insights destination contains the other chart families. Do not stack three insight cards or two full charts below the default Overview. Charts get 200–240px plotting height on desktop and 180–220px on mobile, plus labels. Tooltips are bounded, keyboard reachable, and not the only way to read a value.

Chart controls: 7D / 14D / 28D for rhythm; selected-day scope for mix; matching period for insight samples. Axes include units. Duration bars start at zero. Donut segments are mutually exclusive display-safe categories; if the engine cannot resolve cross-device category overlap consistently, show independent duration bars instead of false percentages. Explain the reason in evidence, not implementation jargon on the card.

Selection cross-highlights related cards only within a clearly marked scope. A category selection updates app list and timeline highlight, not the entire dashboard's totals silently. Include Clear filter. No hover interaction permanently changes a user's data.

### 6.1 Insight card structure

Eyebrow naming the pattern; one supported sentence; one small chart; support line such as “8 eligible blocks · last 14 days”; one action, View evidence. No generic AI jargon or opaque confidence percentage. A data-derived insight is computed deterministically even when AI rephrases its explanation.

Examples are conditional templates, never hard-coded user claims:

- “Your longest recorded Work periods were between {start} and {end}.”
- “{count} of {eligible} reviewed blocks included activity you later excluded.”
- “Work apps resumed a median {duration} after these recorded interruptions.”
- “{tag} accounted for {duration} of reviewed block time.”

User tags are not inferred labels. Multi-tag charts must explain overlap; do not sum overlapping tag totals into a fake 100% composition.

## 7. Focus Block mode

An intentional Focus Block is a user-started container with a goal and reviewable activity. It is distinct from an automatically detected focus run. Starting one does not change app classifications or the locked run detector.

### 7.1 Start sheet

Fields in order:

1. “What are you working on?” optional title, max 80 characters.
2. Duration presets 25 / 45 / 60 / 90 minutes; Custom 1–240 minutes; Open-ended. Default 45 minutes; use the user's last choice afterward.
3. Tags: choose/create up to 8, max 32 characters each. Local normalization trims spaces and prevents case-insensitive duplicates while preserving display case. Optional; no taxonomy setup required.
4. “Review activity when I finish” on by default; changes only whether the review opens automatically, not whether later review is possible.
5. Primary Start block; Cancel.

No required app allowlist before starting. App/site classification can be corrected after the fact. Starting is immediate after local validation and persists the block before navigating to active mode. If persistence fails, do not display a running timer.

### 7.2 Active surface

Use the same Midnight Studio theme with fewer elements: title/tags at top, large remaining time (or elapsed for open-ended), broad horizontal elapsed progress bar with soft focus highlight, and Pause / Finish controls. Secondary “Return to overview” keeps it running. Compact safe activity summary can show recorded Work and Other durations if available; do not show a stream of private app names.

Keep time from persisted start/resume instants and monotonic elapsed time while the process is alive; do not rely on interval tick counts. A timer tick updates display, not a per-second database record. Recover accurately after backgrounding. Treat significant clock-change ambiguity as a recovery state; never silently invent duration.

Pause closes the current active interval; resume opens another. Paused time does not count in active elapsed time or block-scoped rollups, but normal device tracking remains unchanged. Explain that pause stops the block timer, not global tracking.

Switching to a sink app may end an automatic run but does not terminate the intentional block. The user finishes the block. No death event, punishment, hard site blocking, or forced app closure.

### 7.3 Timer completion

At target duration, close the active interval at the intended endpoint and move to Awaiting review. Do not silently extend it when backgrounded. A notification is optional and only uses an existing authorized permission; otherwise show completion on return. No sound enabled by default.

Completion view: “Block complete,” title, elapsed time, Review activity (primary), Save for later. “Start another block” creates a new record; never appends time to the completed record without an explicit edit.

For an open-ended block interrupted by app/process loss, restore its persisted running state and offer Resume running / Finish at selected time. Show the actual uncertainty; no fabricated automatic end. Cross-day blocks retain one identity while metrics allocate interval contributions to engine logical days.

### 7.4 State model

`draft → running ↔ paused → awaiting_review → reviewed`

Additional states: `cancelled` for an explicitly discarded block record; `recovery_needed` for unresolved timing; `conflict` for competing revisions. Sync status is separate: saved locally / syncing / synced / needs attention. Offline is not a timer state.

Leaving review does not cancel the block. Editing a reviewed block makes a new revision; successful save returns it to reviewed. Cancellation of a block does not delete captured usage. Review can be reopened from Overview, Focus blocks, timeline detail, or search within Focus blocks.

## 8. End-of-block review and custom corrections

This workflow is a core paid-value-quality feature, not a minor settings modal. Basic accuracy corrections remain available regardless of subscription.

### 8.1 Review workspace

Desktop: wide sheet or dedicated page, max 1120px; header + block ribbon; activity list left (approximately 65%), live before/after summary right (35%). Mobile: full-screen sheet with stacked summary, app groups, and sticky Save changes footer. Preserve scroll and draft edits when an app group expands.

Header: editable title and tags, captured block start/end, active/paused duration, review state, existing sync state. Summary: Recorded Work, Sinks, Other, and safe excluded duration. These are not independently additive across devices unless category resolution makes them so. A “How time is counted” explanation supplies the basis.

Activity grouped by app/domain, ordered by time contribution. Each group expands into chronological sessions with exact captured ranges and the intersection with active block intervals. Group checkbox supports batch edits; individual session rows support finer changes. Use only the specificity actually captured: if the collector stores a domain, do not invent page-level selection or full URLs.

### 8.2 Correction actions and exact scope

| Action | Default scope | Effect |
|---|---|---|
| Rename block | This block | Changes user title; raw usage unchanged |
| Add/remove tags | This block | Changes user annotation; raw usage unchanged |
| Mark as Work/Sink/Games/Other | Selected activity portion within this block | Creates an effective category override for the selected interval |
| Exclude from analysis | Selected activity portion within this block | Removes the selected interval from eligible analysis, not from captured storage |
| Restore included activity | Existing selected exclusion | Adds a reversal restoring the previous effective state |
| Apply category to this app going forward | Future records after confirmed effective time | Creates a user classification rule; never retroactively relabels history implicitly |
| Apply category to historical range | Explicit selected date range, optional advanced action | Preview affected records and totals, then save versioned corrections |

Do not interpret “remove sites I don't want” as automatic permanent deletion of all browsing records. Default means **Exclude from analysis**, with transparent copy: “Excluded from calculations. Original activity is retained.” Separately expose the product's existing permanent-delete/privacy controls if available; do not fake deletion with exclusion. Future collection exclusions, if supported, must use the existing privacy path and clearly state they stop collection, not just change charts.

Each correction preview states its scope. Batch selection never includes collapsed unselected sessions. A privacy-fenced app cannot be revealed, tagged, or reclassified out of the fence through this flow.

### 8.3 Partial intervals and truthful totals

If a captured session runs 10:00–10:40 and the block covers 10:15–10:30, the default correction applies to the 15-minute intersection only. The rest remains unchanged. Paused portions are outside the block scope. Two overlapping block-scoped corrections target the same underlying activity interval and must not double-subtract it.

Use interval splitting/read-time overlays rather than editing raw start/end values. Exclusion means “ignore this occupancy in effective analysis”; it must not bridge gaps to make a longer automatic deep block. Preserve an internal continuity barrier for excluded intervals as required to avoid manufacturing uninterrupted Work. Automatic metrics are computed by the verified engine from effective classifications with explicit continuity semantics.

User-reviewed Work changes may legitimately recompute an automatic run; they are labeled as reviewed adjustments, not original detector output. Display a “Reviewed adjustments applied” note on affected evidence. Preserve an Original / Reviewed comparison in block detail when safe so the correction is inspectable.

### 8.4 Save and later editing

Live preview updates locally without committing on every click. Sticky footer: “{n} changes” + Discard / Save changes. Save commits block metadata and its correction batch atomically. On local write failure, keep the draft and show Retry; no false saved toast. On success: “Saved on this device” followed by actual sync status. Offline save is valid and queues sync.

After save, Overview, graphs, block totals, insights, and relevant AI reflection invalidate against the new revision and recompute. No stale export preview remains marked current. If recomputation is slow, keep previous values with an explicit Updating state and disable final export until a consistent revision is ready.

A block remains editable after sync and after past reports were generated. Open the same review screen with current effective values. Revision history contains time, changed fields, previous/new safe values, and sync state. Undo creates a new reversal revision; it does not erase history or silently mutate another device's concurrent work.

Discard prompts only when unsaved changes exist. Provide Undo after excluding activity. Undo uses the same atomic correction machinery as ordinary edits.

## 9. Corrections after sync: storage and consistency contract

This is essential scope, not optional polish. The user must be able to correct activity **after sending/syncing it**. “Already uploaded” is not a reason to lock review.

### 9.1 Separate capture from interpretation

Keep original deterministic session rows append-only as in the established architecture. Add user-authored entities and an append-only revision stream for blocks, tags, classification rules, and corrections. Do not write calculated focus hours or AI-invented facts into the usage table.

Conceptual entities, adapted to the existing stack:

```ts
FocusBlock {
  id; ownerId; title; tagIds;
  plannedSeconds: number | null;
  activeIntervals: Array<{startUtc; endUtc: string | null}>;
  state; revisionId;
}
CorrectionEvent {
  id; ownerId; targetSessionId;
  intervalStartUtc; intervalEndUtc;
  operation: 'category' | 'exclude' | 'restore';
  category?: 'work' | 'sink' | 'games' | 'other';
  scopeBlockId?: string;
  baseRevisionId; batchId;
  createdAtUtc; originDeviceId;
}
RevisionBatch {
  id; ownerId; baseRevisionId;
  operations; status;
}
```

These are persisted user intent, not passive capture fields or stored derived metrics. IDs are stable and retries idempotent. Store/sync free-form titles and tags under the same encryption and access-control posture as sensitive user metadata; do not leak them into URLs, logs, AI prompts, or share images by default.

### 9.2 Effective read order

1. Deduplicate captured session rows by established IDs.
2. Resolve privacy eligibility before any display/export/AI summary.
3. Resolve active user correction revisions and applicable classification rules.
4. Split intervals at correction/block/day boundaries without overwriting captured rows.
5. Apply exclusions and continuity barriers consistently.
6. Run verified union/idle/run computations over the effective interpretation.
7. Produce revision-consistent display-safe metrics and evidence.
8. Generate optional AI phrasing from approved aggregate facts only.

Precedence: immutable privacy fence > explicit interval correction > historical/future user classification rule applicable at its effective time > default classification. Exclusion overrides category until explicitly restored. Restore removes the named exclusion's effect; it does not magically remove unrelated overlapping exclusions. Never use wall-clock timestamps alone to decide which offline edit wins.

### 9.3 Offline edits, retries, conflicts

Use an outbox and stable operation/batch IDs. Local commits apply immediately; sending the same batch twice has exactly one effect. A correction arriving before its target session is held pending until the row is available, not discarded. Metadata-only edits on different fields can merge. Concurrent changes to the same activity/category/exclusion scope must surface a conflict with both safe versions and a Keep mine / Use other / Review choice. Exclusion and privacy rules must not be silently relaxed during conflict resolution.

A revision identifies the effective data interpretation; every dashboard request/export binds to one. Recompute on new accepted corrections or sync arrival. Backend authorization checks owner access to the target session/block, not merely a client-supplied owner ID. Preserve existing encrypted-sync design; if the server cannot read content, clients resolve conflicts from encrypted revision metadata/content without uploading plaintext session labels.

One active block per device. Starting while another is running on that device offers Return to block / Finish current and start new. Different offline devices may start overlapping blocks; sync preserves both and shows a review notice. Global totals still use interval union, and aggregate block active time is unioned rather than summed when overlapping. Per-block durations remain individually accurate.

### 9.4 Exclusion versus permanent deletion versus published copies

Exclude from analysis is reversible interpretation, not deletion. Actual data deletion must use a separately implemented authenticated deletion/tombstone flow that propagates across replicas and prevents old offline copies resurrecting deleted rows. If that infrastructure is absent, say so in the implementation report and do not label exclusion “Delete.” A pending correction targeting a permanently deleted session must not restore it.

New reports and share previews use revised data. Previously downloaded images cannot be remotely rewritten; explain this when relevant: “Changes apply to new exports. Files already shared will not update.” Existing immutable report artifacts remain labeled with their creation revision/date; generating a replacement is an explicit action. Do not claim that editing synced records recalls copies already sent to other people.

## 10. Insights, comparison, and statistical honesty

Insight computations stay deterministic; AI only supplies the optional top reflection and phrasing. Read-time metrics remain read-time. Minimum gates:

| Insight | Required support |
|---|---|
| Daily longest run | At least one safe completed engine run ≥15 minutes |
| Block review pattern | At least 5 completed reviewed intentional blocks in selected window |
| Return interval | At least 3 valid same-definition return samples; median, labeled median; suppress if >50% missing anchors |
| Hourly concentration | At least 7 eligible days in 14-day window; ≥60 minutes in winning two-hour window; peak density ≥1.25× daily mean |
| Recurring weekday window | At least 3 observed corresponding weekday buckets in 28 days; mean computed including verified observed zeros |
| Period comparison | At least 4 eligible days in each seven-day period; disclose missing coverage |

Window eligibility must be grounded in existing coverage metadata. No rows is not verified zero. If the engine lacks support for a threshold/denominator, withhold that insight and state the missing integration. Do not backfill fake history to make graphs attractive.

Comparisons default to last seven completed logical days versus the preceding seven. Side-by-side aligned bars share a scale. If eligible day counts differ, use clearly labeled per-eligible-day averages as primary comparison and expose raw totals in detail. Today can compare only against matching elapsed windows with actual support, otherwise no improvement delta.

“What changed” ranks up to three safe changes, by absolute duration difference, requiring at least 30 minutes. Review-driven changes are distinguished from behavior changes: “Updated after your activity review,” not “You suddenly focused more.” AI reflections must respect that distinction too.

Tag reporting defaults to reviewed intentional blocks. A multi-tag block contributes to each tag's independent duration, so tag bars may overlap. State this and never use a pie chart for overlapping tags. User-defined tag color uses a small predefined palette and does not replace category colors in the main timeline.

### 10.1 Custom-range AI Analyzer — dedicated, opt-in workspace

Add **Analyzer** as a tab inside Insights, alongside Patterns and Compare. It is an explicit analytical tool, not a dashboard feed, intrusive floating assistant, chatbot bubble, popup, or daily unsolicited critique. Overview may have one quiet **Analyze a period** action in the Patterns panel/overflow. It never auto-opens or expands a report on Overview. No notification badge merely because the user has not run an analysis.

Product promise: choose a time window and understand how recorded activity progressed, what supported your own intentions, what repeatedly got in the way, and where the data suggests a practical next experiment. Present direct analysis without claiming to know whether someone is morally “good,” mentally focused, or actually completing their tasks.

### 10.2 Setup form and period semantics

Compact form above the workspace:

- **Time range:** 7 days / 14 days / 30 days / Custom. Custom accepts inclusive start and end dates up to Today. No future dates. Users can select any available historical window; do not force calendar weeks or a fixed recent range.
- **Compare with:** Previous equal-length period (default), Custom baseline, or No comparison. Always display the actual resolved dates before running. Preserve the selected analysis timezone.
- **Look at:** All activity (default), selected apps, selected block tags, or a chosen category. Filters use safe canonical IDs; scope is visible throughout the report.
- **Your intention:** Use applicable saved goals (default if available), or optional short user-entered purpose. Example: “I wanted longer study blocks with fewer app switches.” Text alone does not become a measurable goal unless the user confirms the mapped metric/target.
- **Primary action:** Analyze period. Editing any option marks the shown result “Settings changed—run again”; never silently relabel an old report with new filters.

Resolve dates to engine logical-day boundaries (04:00 local). The selected end date includes its full logical day if completed; Today includes data only through the actual safe cutoff. Show that cutoff and “Partial day.” Comparison defaults exclude an unfinished Today from trend/goal conclusions, while still showing its descriptive data separately. Custom baseline must be non-overlapping with the analysis range; otherwise ask the user to choose a disjoint range. Do not silently shorten either.

Allow long ranges without a fake hard product limit: compute facts in bounded background chunks using the existing query/storage architecture, with progress and Cancel. For >90 days, use weekly chart buckets by default; for >365, monthly buckets. Exact underlying daily totals and the user's chosen boundaries remain intact. The AI receives summarized facts, not one prompt per raw session. If the deployed engine has a real query limit, show its exact supported limit and offer narrower dates; report that implementation limit, never fabricate a complete analysis.

A selected tag filters intentional block active intersections, not all app activity in a day containing that tag. Multi-tag selections use interval union; display the scope. App/category analyses still preserve exclusion, correction revision, privacy fence, and device overlap handling.

### 10.3 Result layout: compact report, progressive detail

Analyzer is its own spacious page; keep its controls and range summary pinned, with accessible short-height behavior from §3. Results are tabbed, not one endless wall of AI prose:

1. **Summary:** one 40–70 word overview, a progression chart, and three concise columns/cards: **Working well**, **Getting in the way**, **Worth trying**. Each has at most three findings; empty categories are omitted with “No supported finding for this section,” not filled artificially.
2. **Progress:** metrics over time and baseline comparisons; select Focus time / Deep-block length / Planned vs recorded Work / Sink time / Review completeness. A metric appears only when supported. One large chart at a time, with a metric selector and exact values table.
3. **Evidence:** finding list, sample counts, relevant logs/blocks, computations, and limitations. Selecting a finding cross-highlights the corresponding chart interval or sample set.

The report header contains exact range, comparison range, filters, observed-day counts, partial-period warning if any, and effective data revision status. Keep these as short expandable metadata, not jargon dominating the result. The user-facing revision state reads “Current” or “Activity changed—rerun.”

Summary style may be Direct / Witty / Gentle, inheriting the quote setting initially. Keep humor light and secondary to analytical clarity; evidence never jokes about the numbers. No overall productivity grade, mysterious composite AI score, invented certainty percentage, or universal good/bad judgment.

### 10.4 How progression is actually calculated

Compute deterministic facts before model interpretation:

- Duration per logical day from corrected display-safe activity, unioning device overlap.
- Eligible-day averages, medians, distributions, sample counts and missingness.
- Completed planned block targets against their active elapsed intervals and approved recorded Work intervals, with pause/exclusion accounting shown explicitly.
- Deep-run counts and duration quantiles using verified engine rules.
- Completed-day user-goal attainment only against the goal revision actually applicable to that day. Do not apply today's newly changed goal retroactively without explicit historical scope.
- Per-app time concentration, same-device transition patterns, safe return intervals and review-derived changes meeting their thresholds.

Progression is not a line sloping upward by artistic choice. Show daily points for short ranges; aggregate long ranges into explicit week/month buckets with observed-day count per bucket. No-data buckets are gaps. A moving average is optional only as a labeled overlay with window size and gaps honored; raw points remain available.

When no external baseline is selected, compare the first and last equally sized thirds of completed eligible-window calendar days only if the full selected window has at least 9 completed days and each end segment has at least 3 eligible observed days. Use per-eligible-day averages and show the exact segment dates; missingness must not change segment boundaries. Otherwise provide descriptive trends without claiming improvement/regression. A one-day analysis is valid for descriptive review, not a claim of progression.

For selected-period versus baseline comparison, use per-eligible-day averages when lengths/coverage differ and show both denominator counts. Require at least 4 eligible days per period for behavioral trend conclusions; below this threshold, show descriptive totals with “Too little comparable data for a trend.” Weekday/weekend composition differences appear as a limitation when periods differ. Do not call reduced recording “less distraction.”

A “doing right” finding means a supported pattern aligned with an explicit user intention, or neutral successful completion of a selected block goal. A “getting in the way” finding requires an explicit target/classification plus repeated supporting evidence. Without a goal, say what happened and ask what outcome the user wants; do not invent what they should optimize.

Corrections can alter figures. When a material change is due to reclassification/exclusion rather than new behavior, mark “Changed by your review,” explain its contribution, and avoid celebratory progress claims. Correlation can suggest an experiment, not establish that an app caused poorer work.

### 10.5 Findings and recommendations contract

Each finding contains:

```ts
AnalyzerFinding {
  id;
  kind: 'working-well' | 'getting-in-the-way' | 'worth-trying';
  headline; // max 14 words
  explanation; // max 55 words
  supportingFactIds: string[];
  intentionId?: string; // explicit relevant goal, when claiming alignment
  evidenceAction; // opens exact samples or computation
  limitation?: string;
  suggestedExperiment?: {
    action; durationDays; successMetric; // suggestion only, never auto-applied
  };
}
AnalyzerResult {
  requestId; range; baseline; filters; dataRevision;
  coverage; generatedAt; summary;
  findings: AnalyzerFinding[];
}
```

Examples of supported findings:

- Working well: “Reviewed morning blocks lasted longer.” Evidence names windows, sample counts, statistic, and exclusions; does not infer that mornings universally improve attention.
- Getting in the way: “Your chosen sink allowance was exceeded on {n} completed days.” Valid only for applicable daily allowances; for weekly allowance use completed defined weeks and label them accordingly.
- Worth trying: “Try a 30-minute first block for the next five days.” Explain that current first-block completed duration is shorter than planned; success metric is completion of the chosen plan, not a medical attention claim.

Never force a weakness finding when there is none. Avoid “lazy,” “addicted,” “undisciplined,” “wasted your life,” diagnostic language, or interpreting app usage as personality. The user's phrase “what I did wrong” maps to observable mismatches against their intentions, not a moral verdict.

Every proposed change has an optional user action such as Edit goal / Review category / Open block / Try this plan. No automatic schedule creation, app restriction, data correction, notification, or goal change. A recommendation is not authorization to edit anything. For this build, “Try this plan” opens the existing goal/block setup prefilled for review; it never creates a new automation system.

### 10.6 AI pipeline, privacy, persistence and failure states

Run one analysis request from user intent: validate query → build corrected safe facts → apply statistical gates → generate interpretation → validate all references/claims → present. Show real progress stages: Preparing data / Finding patterns / Writing analysis. Percentages appear only when measurable. Cancel stops pending generation and keeps the previous valid report, clearly labeled with its original range.

Reuse the consent, aggregate-only provider boundary, placeholder app names, context opt-in, input isolation, validation, and API-key protection in §4. No raw browsing log in a prompt. Supply goals only when the user has authorized the relevant context; otherwise retain local goal-comparison facts stripped of personal labels. The AI should not request more passive collection to complete a report.

Do not permanently store a second derived metrics database. An open report is a request-bound presentation artifact; user-requested saved reports, if implemented, are explicitly dated snapshots with their data revision. Do not silently sync new analytical text/history beyond the product's existing permitted artifact storage. On accepted relevant corrections, mark current report stale and offer Rerun; remove any quote that directly contradicts updated facts. Already exported snapshots do not update retroactively.

Model failure: preserve deterministic charts and facts with “AI interpretation unavailable” and Retry. Insufficient data: show honest descriptive summary and unmet requirements, not a generic essay pretending analysis occurred. External processing declined: show the local facts/graphs and local supported observations. Quota: preserve computed results and explain generation availability; no surprise billing or fabricated output.

Analyzer is a plausible Pro capability, alongside long-history app analytics. Do not make essential corrections dependent on Pro. If access is gated, a user-initiated screen explains the benefit and data requirements; no intrusive dashboard panel, blurred fake report, or unsolicited critique.

## 11. Privacy and data-state presentation

Respect the original strict private fence. Private app names, individual durations, event timing, inferred categories, identifiers, and reconstructable hidden contributions must not reach user-facing payloads, chart tooltips, accessibility text, exports, logs, or AI. Keep private occupancy internally where engine correctness requires it; do not expose its interval as a labeled private event. Every view has the same general disclosure “Private activity is excluded from this view,” independent of whether such activity exists.

Use a display-safe aggregate adapter so headlines and mix denominators do not expose a total-minus-public-subtotal leak. If a block overlaps protected details, suppress the affected app-level explanation rather than fabricate a cause. User-authored block start/end and title can remain visible because they are explicitly entered by the user, but never use that as permission to reveal protected captured activity within them.

| State | Presentation |
|---|---|
| Loading | Card-shaped static placeholders; stable dimensions; busy labels |
| No data | Em dash values, chart gaps, “No activity data for this day” |
| Verified observed zero | 0m only with collector coverage evidence; distinct from missing |
| Light day | Actual safe values; “Limited activity recorded”; suppress unsupported conclusions |
| Partial sync/coverage | Actual source cutoff/status and appropriate limitation; no fake Live badge |
| Offline | “Saved locally” for edits; queue visible in data status; primary app remains usable |
| Sync conflict | Notice in affected block; corrections retained; review resolution available |
| AI unavailable | Local factual/general fallback correctly labeled |
| Error | Retry in affected card/screen, not zeroed dashboard |
| Empty tags/blocks | Real helpful empty state with Create/Start action, no fake sample records |

## 12. Searchable logs and component map

### 12.1 Logs are a dedicated, organized workspace

Logs belongs in primary navigation, not at the bottom of Overview. It is the source-of-truth inspection surface for recorded events, blocks, and corrections. Page header, search and active filters stay pinned within Logs. Results use one virtualized vertical list/table, not many independently scrolling cards.

Header contains search, date range, and result count. Search placeholder: **Search apps, blocks or tags**. Match friendly app names, safe captured domains, user block titles, tags, and exact local timestamps within the chosen date range. Default range Last 7 days; show the selected date range beside search so “no results” has context. Never search private labels or promise full URL/page-content search that capture cannot provide.

Search is case-insensitive, trimmed and debounced 200ms. Escape clears the query; Enter commits immediately. Cancel stale queries. Stable cursor pagination keys use event time plus ID; do not skip/duplicate rows after a page loads. Revision change invalidates cursor/results coherently and preserves the search inputs.

### 12.2 Scope and organization

Top tabs: **Activity / Focus blocks / Changes**. Search and date filters persist across tabs where meaningful; unsupported filters are removed visibly, never silently applied to unrelated data.

Filter chips open concise controls: App, Device, Category, Tag, Reviewed/Unreviewed, Included/Excluded. Show only filters meaningful to the selected tab. Visible applied chips can be removed individually; Clear all resets filters but retains date range. Default newest first, optional oldest first. Group results by logical date with sticky group headings beneath the search region. Display calendar/timezone context because the logical day starts at 04:00.

Activity rows: time range, recognizable app icon + friendly name, duration, device, effective category, associated block when safe, adjustment marker. The default timestamp is actual capture interval; corrected subintervals are inspectable without pretending the original record changed. Focus block rows: title, tags, active duration, recorded Work duration, reviewed status, sync status. Changes rows: time, action, target safe context, affected scope, revision status, View details / Undo where supported.

Mobile rows use a clear two-line summary and tap for details. Desktop tables allow sortable time/duration only when the backing query supports complete ordering. Row selection is separate from opening detail. Batch correction buttons appear only when selected items have a compatible scope; preview before saving. No hidden bulk selection of unloaded rows.

### 12.3 Cross-navigation

From App lens → Sessions: open Logs with canonical app filter and selected date window. From block → Show activity: open Logs filtered to that block's active intersections. From insight evidence → View sessions: use the exact eligible sample set or an explicit evidence filter; do not substitute all app sessions and imply they were all analyzed. Back restores previous dashboard tab, zoom, grid page, search and scroll where available.

Selecting a log row opens the same safe evidence/review panel used elsewhere. No separate correction logic in Logs. Logs can access already-synced activity and revisions. No “upload completed, editing disabled” state.

No-results copy distinguishes: no match within the range; no recorded data; excluded-only filter; unavailable source; loading/error. Offer Clear filters or Widen date range as appropriate, never a fabricated empty history. Query strings in browser URLs must not expose sensitive raw labels/tags; use opaque navigation state or local route state consistent with the app architecture.

### 12.4 Component responsibilities

Map these roles onto actual project files; the names are component responsibilities, not an instruction to replace the stack:

- `AppShell`: compact responsive navigation, pinned command area, Start focus / active-block entrypoint.
- `AppIconGrid`, `AppLens`: safe icon/name mapping, pagination, app-level evidence.
- `ActivityLog`, `LogFilters`: searchable grouped history and deep-link restoration.
- `ReflectionCard`: original AI quote, provenance, tone, fallback.
- `MetricCard`: consistent card styling with a metric-specific compact chart slot.
- `TimeCanvas`: viewport, lanes, ruler, focus ribbon, navigator, density, selection.
- `TimelineEvents`: accessible non-graphical alternative using the same selection model.
- `EvidencePanel`: safe supporting facts, chart/table, calculation explanation.
- `RhythmChart`, `TimeMixCard`, `InsightCard`: shared axes/tooltips/formatting, distinct graph forms.
- `FocusStartSheet`, `FocusActiveView`, `FocusReviewWorkspace`, `BlockHistory`.
- `CorrectionPreview`: before/after safe values and exact scope.
- `EffectiveActivityAdapter`: privacy, correction overlays, revision binding, verified engine calls.
- `CorrectionRepository` / sync adapter: atomic local batch, outbox, idempotence, conflict handling.
- `ReflectionService`: approved facts, provider boundary, validation, graceful fallback.
- `AnalyzerWorkspace`, `AnalyzerQuery`, `AnalyzerService`: explicit custom range/baseline, revision-consistent fact building, supported interpretations, tabbed progress and evidence.

Do not put correction math, model requests, or raw session processing inside chart components. Use existing accessible dialogs, tabs, select, tooltip, table, form, and sheet primitives where available. Shared formatting and timezone utilities must be reused across chart, review, and export.

The block workflow and correction pipeline are genuine new implementation work; do not hide that under a superficial styling estimate. Implement in vertical slices while preserving the usable app.

## 13. Delivery sequence

### Phase A — visual direction and honest dashboard

Read actual source/engine contracts. Add new tokens, shell, reflection card fallback, metric cards, large timeline, and chart components. Disable creature behavior. Use existing real data or approved test/demo fixtures with explicit labeling. Deliver Overview with working navigation, evidence, zoom/density, and states.

### Phase B — intentional blocks

Add persisted block metadata/intervals, Start, active, pause/resume, completion/recovery, list and detail. Keep automatic deep runs separate. Verify background behavior and timer restoration before making time claims.

### Phase C — review and synced corrections

Add activity intersections, title/tags, category overrides, exclusions/restores, atomic preview/save, revision history, outbox and conflicts. Recompute graphs from effective data. This phase is required before claiming the user's requested Focus Block feature complete.

### Phase D — insight and AI integration

Wire supported deterministic families and their evidence, user-controlled aggregate-only AI generation, provenance, invalidation, fallbacks, period comparison, and the dedicated custom-range Analyzer. Include its input form, progression calculations, strengths/friction/experiments, evidence tabs, cancellation and stale-report handling. Use existing entitlements; corrections and privacy controls must not be paywalled. Do not invent a new subscription price or quietly introduce model usage charges.

### Phase E — visual polish and verification

Inspect real rendered desktop/tablet/mobile views and fix alignment, readability, chart labels, focus highlights, zoom behavior, sheet layout, and empty states. Validate keyboard/reduced-motion/contrast. Run production build and meaningful engine/sync tests. Preserve delivered golden fixtures; add targeted tests for the new correction functionality according to the repository's fixture policy.

Do not deploy, message anyone, or enable external AI processing merely because this document exists; follow the implementing user's actual task authorization and environment controls.

## 14. Acceptance criteria

### Visual identity

- [ ] Overview contains a compact pinned AI observation, metric cards, substantial time canvas and paginated app-icon grid; extra charts replace one workspace panel rather than extending a long feed.
- [ ] Desktop default at 1440×900 scrolls no more than approximately 200px; mobile default at 390×844 fits within 1.4 viewports at normal text, with accessibility reflow taking priority.
- [ ] Header/focus action remains available; short-height/large-text layouts do not get trapped behind oversized sticky regions.
- [ ] App icons have friendly labels and accessible names; no third-party browsing-domain leakage for favicons. App lens opens nerdy evidence without stretching Overview.
- [ ] Logs has persistent search/filter/date context, three organized tabs, stable pagination and precise app/block/evidence deep links.
- [ ] Design uses periwinkle focus ribbons, restrained illumination, rounded cards, generous graph heights, and readable sans typography—not the previous bare instrument-strip design.
- [ ] Mobile adapts content rather than shrinking all desktop columns; no page overflow at 320px or clipping at 200% text size.
- [ ] All chart marks represent data; missing values are not smoothed into plausible-looking lines.
- [ ] Creature is absent from UI and background execution, while existing code/state is preserved.

### Timeline

- [ ] Full day through 15m zoom, pointer anchoring, pinch/button equivalents, pan, navigator brush, Fit selection, Reset, and three density levels work.
- [ ] Focus ribbons remain readable, paused intervals are distinct, and active highlights never recolor sink sessions as work.
- [ ] Intentional blocks and automatic deep runs cannot be confused; overlaps do not double-count or stack opacity.
- [ ] Timeline values match accessible event lists and evidence across timezone/DST fixtures.

### Focus mode and review

- [ ] Start persists before timer display; pause/resume/finish/completion/background recovery preserve accurate active intervals.
- [ ] A sink visit does not forcibly end the intentional block.
- [ ] User can create tags, rename, review grouped/individual activity, reclassify partial intervals, exclude, restore, and save later.
- [ ] A 10:00–10:40 session corrected inside a 10:15–10:30 block changes only the 15-minute intersection.
- [ ] Pause intervals and excluded activity do not produce artificial uninterrupted deep blocks.
- [ ] Cancelling review preserves saved data; failed save preserves draft; successful save reports actual local/sync state.

### Post-sync correctness

- [ ] Edit a previously synced block offline, reconnect, and verify both devices converge on one effective revision without duplicating capture rows or corrections.
- [ ] Replay the same correction batch twice: identical effective totals and one revision effect.
- [ ] Correction arriving before the original row is retained and applied when available.
- [ ] Conflicting offline category/exclusion changes are surfaced; no silent loss or unintended relaxation.
- [ ] Overlapping block corrections do not double-subtract; undo reverses only its targeted change.
- [ ] All affected graphs, insight samples, AI reflections, and new export previews invalidate/recompute together.
- [ ] Exclusion is clearly distinguished from permanent deletion; already shared static images are not claimed to update.

### AI and evidence

- [ ] Top observation is AI-crunched, original, short, optionally witty, and tied to exact evidence and explicit intentions; no generic quote masquerades as personalized analysis.
- [ ] Witty/straight/gentle tone, dismiss and off controls work; reminders never invent goals or treat unfinished days as failure.
- [ ] App-specific jokes use validated placeholders or explicit app-name sharing preference; default external payload omits actual labels.
- [ ] Why this? reproduces approved fact IDs, samples and windows; invalid model claims trigger fallback.
- [ ] No external AI request before enablement; no raw labels/tags/session records in default payload; no client API key.
- [ ] AI errors/offline state never stop block tracking or edits; stale quote numbers disappear after corrections.
- [ ] Median/mean/denominators match their labels; review changes are not framed as behavior changes.

### Custom-range Analyzer

- [ ] Analyzer is inside Insights and opens only on deliberate action; it does not add a long report or floating assistant to Overview.
- [ ] Any supported historical custom date range, explicit disjoint baseline, safe scope filters and optional user intention resolve to visible logical-day dates/cutoffs.
- [ ] One-day/insufficient-data analyses remain descriptive; progression gates, coverage denominators, partial-day and unequal-range rules are enforced.
- [ ] Summary, Progress and Evidence are tabbed; exact supporting facts exist for every strengths/friction/experiment finding.
- [ ] Goals use applicable historical revisions; model output never invents a goal, diagnosis, cause or negative judgment.
- [ ] Long-range bucketing preserves exact range/totals; background cancellation, failure, quota and consent-declined states retain truthful local results.
- [ ] Corrections mark reports stale and new analysis uses updated effective records; recommendations never auto-apply settings or schedules.

### Privacy/accessibility/reliability

- [ ] Private data does not leak through charts, totals, tooltips, review rows, accessibility text, URLs, logs, exports, or AI payloads.
- [ ] Keyboard-only users can operate blocks, corrections and timeline; touch targets and contrast pass verification.
- [ ] Raw capture, dedupe, overlap and logical-day invariants remain intact under existing engine tests.
- [ ] Production build succeeds; relevant new block/correction/sync tests pass; visual evidence includes populated Overview, zoomed selected block, active focus, review, and mobile states.

## 15. Coding-agent handoff requirements

Deliver implemented source changes, a concise changed-file map, screenshots of the five key states above, actual validation results, and concrete unresolved integrations. Distinguish completed design from missing backend/provider behavior. Never substitute a screenshot-only dashboard for functional zoom, review, or sync corrections.

The final standard: **a compact premium workspace, witty evidence-backed observations, beautiful app analytics, an on-demand custom-period Analyzer, a time canvas worth exploring, searchable logs, and focus blocks the user can make accurate in their own words.**
