# Timeframe update — useful insights with inspectable evidence

Version 1.2 · Amendment to TIMEFRAME-UI-REDESIGN.md v4.2 · 2026-09-05

## 1. Apply this update

Place `update.md` beside `TIMEFRAME-UI-REDESIGN.md` and `AGENT.md`. Read the main design specification first, then apply this amendment. This file takes precedence for analytical claims, calculation semantics, evidence interactions, user interpretation, and statistical thresholds. Preserve the main specification's architecture and other product behavior unless explicitly changed here.

Keep the approved graphite-and-amber design, compact dashboard, pinned focus action, substantial zoomable timeline, app-icon grid, searchable Logs, Focus Block review, post-sync corrections, and on-demand Analyzer. Remove the rejected Rhythm / Time Mix / Patterns tab strip as specified in §3.2. Keep the creature dormant. This update adds depth to those surfaces; it does not add a long dashboard section, new primary navigation destination, surveillance permission, or productivity score.

The product standard is: **show what happened, explain why it may matter to the user's own intention, and offer an action whose result can be inspected.** Helpful interpretation is required; exaggerated certainty is prohibited.

### 1.1 Explicit overrides to the previous specification

| Earlier rule or implication | Required replacement |
|---|---|
| Ten sessions, eight transitions, four days, or a 35% rate establishes reliable behavior | These were product heuristics, not statistical validation. No automatic reliability/confidence claim follows from them. |
| A five-minute visit is objectively long; a one-minute visit is a quick check | Use explicit duration labels and adjustable thresholds. Avoid psychological interpretations of record length. |
| A 15-minute auto-detected run proves deep focus | Keep the established engine definition, but label it a detected Work run; “deep block” is a product-defined run ≥15m, not a validated attention measure. |
| Displayed session equals a visit/app launch | Use “Recorded segments” until the collector's boundary semantics are verified. |
| Returning to Work measures cognitive recovery | Measure only recorded resumption; show unobserved returns and gaps. |
| Existing minimum gates certify scientific validity | Permit exact descriptions of the selected records with sample context; withhold unsupported generalization regardless of sample count. |
| First/last thirds of a custom period demonstrate improvement | Remove automatic thirds-based verdicts. User-selected comparisons may describe a recorded difference; they do not establish durable improvement. |
| AI may turn a suggestive pattern into a confident personal judgment | AI expresses validated facts and conditional suggestions; every claim links to evidence and scope. |
| “Exclude” and “unwanted” mean the same thing | Exclude corrects analysis eligibility; unwanted records the user's appraisal of otherwise valid activity. Separate controls and storage effects. |

No source code was supplied with the log. The audit verified exported-record calculations, not collector correctness or production engine behavior. The coder must perform the integration checks below before upgrading terminology or enabling dependent metrics.

## 2. One insight, three layers

Every insight has a stable identity and three separate fields. Never merge them into an untraceable AI paragraph.

1. **Observed:** a deterministic factual statement about a named window and eligible records.
2. **Meaning:** a conditional interpretation tied to an explicit user intention, or a neutral explanation of the distribution.
3. **Action:** one optional action that opens relevant evidence, review, a user-approved goal edit, or an experiment setup.

Example using the audited YouTube domain records:

- Observed: “Segments over five minutes contained 52.39% of recorded YouTube time in this export.”
- Meaning: “If you want to reduce YouTube time, those longer segments are worth reviewing.”
- Action: “Review 21 segments.”

Do not display all three as a long paragraph on Overview. Show one short observed sentence, with supporting context and interpretation inside the evidence panel. In Analyzer, all three may be visible within one finding card.

An action is never executed merely because the model suggested it. Clicking Review opens the selected records; it does not mark them unwanted. Goal edits require their normal save step. No automatic restrictions, notifications, or scheduled tasks are added by this amendment.

## 3. UI integration without dashboard growth

### 3.0 Group by the user's task: related information and actions stay together

This is a binding integration rule, not an aesthetic suggestion. Organize around the thing being understood or changed, not around separate chart types or implementation modules. Each object has one home and one shared detail experience. Alternate entrypoints open that same experience with context preserved.

| User question/task | Home | Keep together |
|---|---|---|
| How much Work time did I record? | Focus time card | Current value, recent trend, metric explanation, relevant goal and calculation |
| Where did recorded time go? | Time mix strip | Composition, category durations, selected category and matching app/activity drill-down |
| What happened with this app? | App icon → App lens | Friendly identity, duration/distribution, patterns, sessions and correction entrypoint |
| What happened during this block? | Timeline ribbon → Block detail/review | Planned/active/recorded time, tags, intersecting activity, appraisal, correction preview/save |
| Why does the AI say this? | Observation → Evidence | Claim, exact scope, user intention, supporting records and optional action |
| Am I progressing over this period? | Insights → Analyzer | Date/baseline controls, progression, evidence, goals and suggested experiments |
| Where is a particular record/change? | Logs | Search/date filters, result, contextual detail, revision history and safe correction |

Do not send users to Settings to interpret a metric, to an unfiltered Logs page to find supporting records, or back to Overview to correct activity already visible in a block. Settings owns defaults and global preferences; contextual edits occur beside the affected object with explicit scope.

**Detail navigation:** maintain at most one active detail surface. If App lens opens Evidence or Review, replace the current sheet content with a titled subview and a Back button; do not stack multiple modal sheets. Back restores the preceding sheet tab/scroll/selection. Close returns to the initiating grid tile, ribbon or metric, with focus restored. Full Logs/Analyzer navigation preserves the originating context and offers a clear route back.

**Shared context:** carry selected date/range, timezone, device scope, app/category/block filter, evidence sample key and effective revision when relevant. Display a concise scope line in the destination. If a destination cannot retain a filter, explain which one changes before presenting results; never silently widen a numerator or swap a selected day for all history. Metric-specific secondary trend windows remain explicitly labeled and do not silently change the global date.

**One calculation, many entrypoints:** Focus time in Overview, App lens and Evidence uses the same definitions/adapter, scoped explicitly. Tags, appraisals, category edits and exclusions call the same review/correction service. A save updates all affected views at a consistent revision; do not require refresh or repeating an edit in another screen.

**Actions next to effects:** a category-edit control sits beside the category; appraisal beside selected activity; See calculation beside the value/definition; View sessions beside the supporting finding. Keep one primary next action per detail state. Destructive/global actions remain separated from ordinary inspection and clearly scoped.

**Progressive disclosure:** show plain-language summary first, calculation and individual records on demand. App lens/evidence may retain functional detail tabs where useful; this does not reintroduce the rejected Rhythm / Time Mix / Patterns dashboard tabs. Do not turn every relationship into a permanently visible panel. Visual proximity serves understanding, not maximum density.

**Acceptance walkthrough:** a tester must be able to tap an app, understand a finding, inspect its exact segments, mark a selected interval intentional, save, and return to the original app position without manually re-entering dates/filters. Similarly, a timeline block must lead directly to its scoped review and back to the same zoom. No stacked dialogs, unfiltered detours or duplicated corrections are allowed.

### 3.1 Pinned AI observation

Keep the existing slim Timeframe AI strip and focus control. Each generated line must reference a current validated fact. “Why this?” opens the shared evidence panel, initially on Summary. The AI is allowed to be witty but must preserve the exact scope, time window, and uncertainty.

Use a small text context such as “This week · recorded activity” where needed. Do not introduce a bright credibility badge or a made-up confidence percentage. If the selected day lacks enough evidence for a meaningful observation, show a straightforward supported summary. A shortage of data does not require a personalized joke.

The model must not turn record counts into “checks” until the collector supports that interpretation. It must not imply failure of an unfinished goal. If the user marks the relevant activity intentional, remove incompatible guilt/goal-mismatch wording immediately.

### 3.2 Remove Rhythm / Time Mix / Patterns tabs entirely

The owner rejected this three-tab presentation. Remove the tab bar, its underlines, its empty panel region and the permanent lower dashboard row from both desktop and mobile. This overrides the main specification's optional workspace tabs and this amendment's earlier Patterns-tab direction. Do not hide the same three tabs behind a dropdown or rename them.

Integrate the information into objects users already understand:

| Content | Default placement | Deeper interaction |
|---|---|---|
| Rhythm | Seven-day mini-chart inside the Focus time metric card | Tap chart or labeled View trend opens a 28-day trend sheet with range controls and evidence |
| Time mix | One slim composition strip between metric cards and time canvas | Tap the visible Time mix label opens a category breakdown sheet; selecting a category offers Show matching activity |
| Patterns | Strongest eligible observation in the existing pinned AI strip; app-specific patterns inside App lens | Why this? opens evidence; other findings live in the existing Insights destination |

The composition strip is not another card. Desktop: 8px bar with 6px ends, short category legend in the same approximately 40px-high row, no chart title paragraph. Mobile: 6px bar, at most two lines of readable legend and a visible Time mix button, approximately 52px total. Use shared colors, exact valid proportions and a muted scaffold. Full category names/durations remain available in the sheet. Do not make tiny color segments the only clickable targets. Where mutually exclusive attribution is unavailable, replace the segmented strip with a simple Time mix summary button and explanation; do not draw false percentages.

This row is the only extra vertical budget. Recover space by deleting the previous bottom tabs and lower panel, not shrinking labels or timeline lanes. Preserve existing compactness targets. On mobile keep the Timeline / Apps selector only if needed to fit the primary workspace; remove its Patterns item. This selector switches working surfaces, not three decorative chart tabs. Deep analysis remains under primary Insights navigation.

Selecting an app opens App lens without extending Overview. Opening a trend or mix view uses an overlay sheet/popover with a visible close control and returns to the initiating element. The selected-date headline and seven-day trend have separate explicit scopes. Past trend-point selection navigates to that day deliberately; hovering cannot change global date.

There is no carousel of generic insight cards added to Overview. If the AI strip is off, show one small factual summary in its existing footprint only if the user enabled summaries; otherwise reclaim the space.

### 3.3 App lens

Retain Summary / Patterns / Sessions tabs and the icon-led entrypoint. Summary adds exact duration-distribution evidence:

- Recorded duration (union).
- Recorded segment count, clearly distinguished from visits.
- Median segment length and a named percentile convention in evidence.
- Two toggleable chart modes: **Segments** and **Time contributed**.

Default distribution uses the full empirical duration curve, not a verdict about short/long usage. A draggable vertical threshold starts at 5m as a readable display preset. Show “Threshold: 5m” and allow 30s / 1m / 5m / 10m or an exact custom duration. This is a viewing control, not a behavior standard. Changing it updates the numerator, denominator, and matched-record selection. All exact boundary choices are defined in §6.

Use 2px neutral/amber data lines, sparse axes, an explicit threshold marker, and a numerical callout. No smoothed curve implying unobserved values. Keep the plot 180–220px high; supply a table alternative.

Patterns includes observed sequence/return details only when their prerequisites pass. Otherwise use neutral descriptive distributions rather than placeholder claims. Sessions opens Logs with the exact sample set, current effective revision, and threshold filter—not all records for the app indiscriminately.

### 3.4 Time canvas and block detail

The focus ribbon continues to encode the user's intentional active interval. It never proves that everything beneath it was focused or useful. Selecting a block shows planned duration, active elapsed duration, recorded Work overlap, and user-reviewed appraisals as separate labeled values.

Use two different annotations:

- **Adjusted:** category/exclusion correction affects the effective calculation.
- **Reviewed:** user supplied an intention/appraisal, which may not change category or eligible duration.

Both are quiet text/icons in detail, not a new chart color system. Do not draw unwanted activity as a second overlay obscuring original category marks. Selecting “Show unwanted activity” outlines matching safe segments temporarily; clearing it restores the original view.

### 3.5 Analyzer findings

Retain the custom-range, explicitly opened Analyzer. Its Summary cards become:

- **Aligned with your plan**: supported agreement with an explicit applicable goal or user review.
- **Worth reviewing**: supported mismatch, uncertainty, or concentration of user-marked unwanted activity.
- **Try and compare**: a small optional experiment, not a guaranteed fix.

Without explicit goals/appraisals, use **What happened** and **Patterns to inspect**. Do not fabricate what the user did right or wrong. Progress tabs label historical differences as “Recorded change,” with the exact dates and denominator, unless the user is inspecting a named personal experiment.

Each finding includes Observed / Meaning / Action and an evidence button. Model output cannot add untraceable scientific language, a diagnosis, or an invented objective. Keep report detail inside Analyzer rather than injecting it into Overview.

### 3.6 Logs

Add appraisal filters: Intentional / Unwanted / Unsure / Unreviewed. Existing Included/Excluded and category filters remain separate. Show the applied filter in the sticky query header. Row detail exposes captured interval, effective corrections, user appraisal, and revision history as distinct groups.

The exact evidence sample can be carried by an opaque result key. A row no longer eligible after an edit is removed from the recomputed sample, and the summary count updates. Never preserve an old sample count under a newly filtered log.

## 4. Shared evidence panel

Reuse one responsive component everywhere: desktop right sheet 440–520px; mobile full-height sheet. Preserve initiating context, focus, timeline zoom, app grid page, and log filters on close. Header contains the observed claim and date range. Tabs: **Summary / Calculation / Records**.

### Summary

Show observed fact, meaning, applicable user intention, main limitation, and one action. Important limitations are specific: “Recorded browser activity only,” “Three days with data,” “Return not observed in 4 cases,” or “Segment boundaries not verified.” Do not bury the meaning in an essay or show generic disclaimers everywhere.

### Calculation

Show:

- Definition and unit.
- Numerator, denominator, exact threshold/comparison rule.
- Timezone, window bounds/cutoff, device/source scope.
- Included sample count; omitted counts when safe to disclose.
- Original versus effective/reviewed basis.
- Overlap handling and record-boundary status.
- Computation/definition version and current/stale state in expandable technical detail.

Use exact numbers internally and readable rounding in headline copy. Never recompute from rounded display values. Scientific citations support methods/context, not a claim that the user's particular pattern was scientifically diagnosed.

### Records

List the exact safe records/intervals contributing to the fact. Each can open normal review. Do not expose private fields in hidden DOM/accessibility labels, filters, exports or AI context. If showing omitted counts would reveal protected activity, withhold the count and use the generic privacy disclosure.

### 4.1 Tap-and-hold: plain-language metric explanations

Every metric has a short explanation available through **press and hold** on its noninteractive value/label area and a permanently visible small info button beside its name. Single-tapping that info button opens exactly the same explanation. Keyboard users activate the info button with Enter/Space; touch-screen readers use its standard accessible action. Never make long-press the only discoverable path.

Web long-press default: 500ms with movement tolerance 10 CSS px; cancel on pointer cancel, scroll, release before threshold, second pointer, or leaving the target. These are interaction presets, not scientific thresholds. Native Android uses platform long-press timing/touch slop. After a successful hold, consume the following synthetic click so it does not also navigate to evidence. Do not override browser selection/context menus across the page, attach holds to editable text, or interfere with timeline pan/pinch and chart drags. A chart retains its chart interaction; hold is bound to the metric header/value or info control only.

Desktop uses a click-persistent accessible popover, max-width 340px. Mobile uses a compact bottom sheet with natural height. No hover-only tooltip for the explanation body. Content structure:

1. Metric name.
2. **What it means:** one plain sentence, ideally under 25 words.
3. **How we count it:** one plain sentence, ideally under 30 words.
4. One metric-specific limitation when it materially matters.
5. **See calculation** opens the full evidence sheet; Close is always visible/accessibly available.

The short explanation has no formula wall, academic language, provider names or generic warning. It uses 16px body text, 14px labels and normal contrast; no tiny tooltip prose. Outside click/Escape dismisses on desktop and restores focus. The content stays open while reading and never closes on pointer movement alone. Changes in the selected metric/data update it coherently or close with focus restoration; never leave unrelated old figures in it.

Ship these initial definitions in a shared registry, not hard-coded separately in screens:

| Metric | What it means | How we count it / limitation |
|---|---|---|
| Focus time | Recorded time in apps you marked as Work. | We apply the existing idle rules and count simultaneous device time once. It does not measure your attention. |
| Focus blocks | Work periods you deliberately started in Timeframe. | We count completed blocks; pauses do not count toward active duration. |
| Longest deep block | Your longest automatically detected Work run. | “Deep” means the app's run rules passed and the run lasted at least 15 minutes; it is not a measurement of concentration. |
| Sink time | Recorded time in apps you marked as Sinks. | We count eligible activity once across overlapping devices. A chosen break can still be intentional. |
| Median segment | The middle length among the selected recorded segments. | Half lie at or below the middle and half at or above; recording boundaries may differ from real visits. |
| Time mix | How your eligible recorded time is split by category. | Percentages appear only when the categories form a non-overlapping total. |
| Block overlap | App activity recorded during a block's active intervals. | We intersect the app's recorded time with the block, excluding pauses; this does not prove distraction. |
| Marked unwanted | Recorded time you explicitly said you did not want to spend that way. | It reflects your review; unreviewed activity is not automatically unwanted. |
| Recorded change | The difference between the two displayed periods. | Coverage and review changes can affect it; it is not proof of lasting improvement. |

Registry contract: stable metric ID, definition version, short meaning, counting rule, optional limitation, evidence resolver, accessible label. Shared definitions must feed Overview, app sheets, Analyzer, Logs and exports where relevant. Updating a metric's semantics updates its definition version too. Info buttons use accessible names such as “Explain Focus time.” Ensure at least 44px web / 48dp touch hit area even when the visible icon is 16px.

### 4.2 Custom theme and component foundation for the coder

Create an internal **Timeframe UI** design system in the actual application repository. This means reusable themed components owned by this project, not a public theme store or end-user theme marketplace. Use a suitable library for interaction foundations and customize its appearance to the approved graphite-and-amber design.

**Web default when the project is React and lacks an established equivalent:** shadcn/ui components, the project's existing Tailwind setup when present, and Recharts for statistical charts. shadcn provides customizable components and theme variables; retain the installed primitive backend (Radix or Base UI) rather than mixing implementations. Use its actual installed APIs. Do not replace a functioning framework/design library merely to adopt this default. Do not install both Radix and Base UI versions of each control. [shadcn/ui foundation](https://ui.shadcn.com/), [theme configuration](https://ui.shadcn.com/docs/theming).

**Chart foundation:** Recharts with the existing shadcn Chart wrapper if installed; explicit accessible names, keyboard support and an equivalent table remain required. Chart configuration supplies labels/colors; it does not compute or validate the metric. Use the library for time-series/distribution charts, not a premade dashboard template. [shadcn chart configuration](https://ui.shadcn.com/docs/components/base/chart), [Recharts project](https://recharts.github.io/).

**Android:** reuse the existing native UI architecture. For Jetpack Compose, implement a custom `TimeframeTheme` using Material 3 color, typography and shape systems, with app-owned components wrapping primitives. The theme API supports those customizations; do not ship default Material appearance just because its behavior is useful. No web component library inside a new WebView. [Compose Material 3 theming](https://developer.android.com/develop/ui/compose/designsystems/material3).

The library choice does not authorize a framework migration, package upgrade or lockfile replacement. Inspect package manifests/Gradle versions and existing components first; use compatible installed versions. If a required component is missing, add only that capability using the repository's dependency policy and check official API/version docs at implementation time. Retain licenses for bundled component/icon/font assets. No arbitrary third-party theme ZIPs, unofficial mirror imports or runtime remote theme loading.

Use this mapping:

| Product component | Foundation | Project-owned behavior/style |
|---|---|---|
| Metric card | Semantic container + Button/Popover/Sheet | Layout, mini-chart, info action, hold handling, shared definition |
| Evidence sheet | Sheet/Dialog | Summary/Calculation/Records and revision binding |
| Trend and mix detail | Dialog/Sheet + Chart | Date scope, exact curves/values, category logic |
| Start/review block | Dialog/Sheet + existing form controls | Interval scope, atomic preview/save, tags |
| App grid/lens | Semantic grid + Button + Sheet | Safe icon map, friendly labels, pagination, scoped evidence |
| Logs | Existing Table and suitable virtualizer when needed | Search/cursors/group headings, safe row details |
| Context action | Dropdown menu/Popover | Explicit correction scope and undo |
| Time canvas | Custom app-owned SVG/Canvas or native drawing | Time scale, layered focus ribbons, zoom/pan/navigator, event-list accessibility |

Timeline rendering is deliberately custom because it is the product's signature interaction. Use existing time-scale utilities if available; do not hand-build date parsing or replace the engine. Raster mockup screenshots are references, not production controls or chart assets. Keep geometry based on real instants and shared safe view models.

**Shared tokens:** map the main specification's final values into the installed theme API's expected format. Do not paste hex into a token expecting HSL channels or break light/dark scoping. Keep raw design tokens separate from semantic theme aliases where necessary. Required visual values: background #171819; cards #202122; primary text #ECECE7; secondary #C1C5C1; muted #A1A9A5; amber focus #DDB66D; coral sink #DFA095; borders #3A3D3E; stronger outlines #737978; 10px cards, 6px controls, flat card surfaces. Off-white primary action buttons use dark text; amber remains focus-data emphasis. Translucent borders alone are not guaranteed accessible; verify essential control contrast.

Implement app-owned wrappers rather than restyling every call site independently:

- `TimeframeTheme` / theme tokens: colors, type, spacing, radii, chart tokens, motion.
- `MetricCard` and `MetricHelp`: one interaction/definition system.
- `FocusRibbon`, `TimeCanvasToolbar`, `TimeNavigator`: signature time surface.
- `AppTile`, `AppLens`, `TimeMixStrip`, `TrendPreview`: compact overview composition.
- `EvidenceSheet`, `InsightSummary`, `AppraisalControl`: shared analytical/review UI.

Use equivalent native names/organization; these are responsibilities, not a demand to create an exact file tree. No repeated one-off inline color hexes in feature screens. Add an internal component preview using the project's existing preview/development mechanism, with normal, loading, empty, error, focus, long-label and enlarged-text states. Do not introduce Storybook or another service solely for this small pass if none exists.

No new user-facing theme selector is required. A library supplies dependable primitives; the Timeframe theme and composition supply the visual identity. Never substitute a stock shadcn dashboard screenshot for the specified design.

## 5. Capture prerequisites and terminology

Before describing habits or sequences, document what ends a segment: app/tab changes, loss of foreground, idle, export truncation, backgrounding, or collector flush. Document how same-label consecutive rows, multiple browser windows/profiles and overlapping rows are represented. Verify actual code and a controlled capture, not just this example file.

Use integer timestamp units at the source's precision; UTC arithmetic for elapsed time. Use an explicit IANA analysis timezone for calendar grouping, keeping timezone choice visible. Do not infer travel history from UTC timestamps. Use half-open intervals `[start, end)` throughout.

Captured versus reconstructed session is a distinction in the adapter. Do not merge records merely because their gap is “small.” Any justified stitching rule must be documented, versioned, tested, and reflected in evidence. Export-clipped/open segments are not completed visits; separate them from completed-session distributions or keep the distribution explicitly about clipped recorded segments.

Same-device overlap affects ordering even when negligible for totals. Interval union can calculate duration but cannot recover foreground ordering. Preserve the ambiguity, exclude affected relationships from sequence claims, and report it safely. Do not silently move timestamps, add epsilon offsets, or choose alphabetical precedence to manufacture an app sequence.

The supplied export lacks IANA timezone, collector coverage/idle events, user goals, categories, and block/appraisal records. These may exist in the real application; query the existing source if available. If not, withhold dependent interpretations. Nonempty rows prove some activity was recorded, not full-day coverage. Chrome data is browser activity, not all computer work.

## 6. Exact metric definitions

### 6.1 Duration and overlap

For selected effective intervals `I`, duration `T = measure(union(I))`. Clip intervals to the selected query scope before union. Cross-device simultaneous occupancy is counted once for combined elapsed totals. Per-device/app durations may sum to more than combined duration; show the basis rather than claiming all figures are additive.

For classified composition, require mutually exclusive attribution supplied by the verified engine. If unavailable, show independent durations and omit a 100% donut/share. Do not invent a priority between different simultaneously active categories in UI code.

### 6.2 Segment counts and distributions

For eligible recorded segments, duration `d_i = end_i - start_i`, `N = count(i)`.

- Median: sort durations; use the middle observation, or arithmetic mean of the two central observations for even N.
- Percentile: use empirical inverse-CDF/nearest-rank `Q(p) = d_sorted[ceil(p*N)]`, 1-based, for `0 < p <= 1`. State this method. It can differ from interpolation methods.
- Count curve: `F(t) = count(d_i <= t) / N`. Label “Share of recorded segments at or below duration.”
- Complement: `1 - F(t) = count(d_i > t) / N`.

No denominator when N=0: unavailable, never zero percent. A one-observation median can be shown as descriptive fact with N=1; it is not a typical-behavior conclusion. Prefer “Median recorded segment” over “Your typical visit” until boundary validity is established.

For convenience histogram bins, use `[0,60)`, `[60,300]`, `(300,infinity)` seconds with visible labels “Under 1m,” “1–5m,” “Over 5m.” This partitions all nonnegative durations with no gaps or double-counted boundary. Invalid nonpositive records are quarantined, not counted as visits. The threshold control uses `<=t` / `>t` explicitly; do not mix it with under-1m wording.

### 6.3 Time contribution by duration

If the selected segments are disjoint, time share over threshold is `sum(d_i where d_i > t) / sum(d_i)`. If they overlap, raw sums describe **summed segment-seconds**, not unique elapsed time. Never quietly label that as union duration.

In the overlapping case, a safe alternative is `measure(union(intervals of segments with d_i > t)) / measure(union(all selected intervals))`, labeled “Recorded time covered by segments over {t}.” Its short and long complements may overlap, so do not display them as a mutually exclusive stacked partition. Explain overlap in detail. Withhold the stacked time histogram until consistent attribution/disjoint reconstruction exists.

Use the complete curve/threshold explorer; 1m and 5m are convenient display choices, not scientific cutoffs for checking, distraction or problematic use.

### 6.4 Planned-block overlap and plan difference

For app intervals A and intentional active block intervals B, app overlap = `measure(union(A) intersect union(B))`. Pauses are excluded from B. Overlapping blocks do not double-count global overlap. A per-block figure remains specific to that block.

Planned duration, active block duration, and recorded Work duration are separate measures. Difference = observed applicable metric minus explicit target. Use target revision applicable at that time. A timer goal is not automatically a Work-occupancy goal. Show completed periods versus ongoing periods; never give a failure verdict before the goal window closes.

### 6.5 App return gaps and sequences

Two different measurements must remain separate:

- Same-app return gap: next eligible same-device segment start for that app minus its preceding segment end, where ordering and intervening coverage are known.
- Work resumption interval: next eligible Work foreground instant minus the defined interruption anchor supplied by the verified engine.

Unknown coverage, conflicting foreground rows, protected relationships and absent anchors make interpretation unresolved. Do not jump across these and describe the result as an observed interruption chain. Always state the anchor definition; ending a sink session and ending a Work run are different anchors.

For a sequence A→B, define an explicit window `w` and display it (“next recorded app within 60s”). The window is a definition/preset, not an established psychological boundary. Numerator counts observed qualifying A→B pairs; denominator includes only cases eligible under the same successor/window/coverage definition. Label the proportion conditional on that eligibility, not “every time you use A.” Same-device ordering is required; cross-device timestamps do not prove task sequence.

For returns, show resolved duration distribution and counts of observed/unresolved returns where safe. Label the median “Median among observed returns.” Never replace unresolved returns with 0, infinity, or an arbitrary maximum, or silently interpret that median as all interruptions. The earlier >50%-missing suppression rule is not scientific validation; remove it as a certificate of reliability. If boundaries/coverage are unknown, suppress the interpretation regardless of that percentage.

A censored time-to-event analysis may be a future separately validated capability. Do not add Kaplan–Meier or a recovery score merely to make this feature look scientific; its censoring assumptions would need to be established.

### 6.6 Fragmentation, concentration, and progress

Show distributions of verified same-device Work intervals, their median, and exact threshold counts. Switching among Work apps may be one task; do not infer cognitive fragmentation from each domain change. “Recorded Work intervals” is the default label.

Hourly distributions are descriptive of **recorded** time. Without exposure/coverage data, do not claim that the peak is the user's intrinsically best/worst time or that a low bucket proves absence. Remove automatic peak claims based on 1.25× density and fixed two-hour maxima. An hour-range selector can expose the actual sum and denominator without declaring a meaningful behavioral peak.

Progress shows exact date-by-date figures and explicit comparisons. Use matched source scope, classifications, correction revisions, timezone and observation support. When coverage cannot be established, display “Average across days with recorded data,” state both counts, and avoid a behavior-improvement verdict. No-data remains a gap, not a zero. Corrected classification can change historical totals; label that as a review change, not behavioral progress.

Seven days with one Tuesday do not establish a recurring Tuesday effect. A larger N alone does not establish independent observations or future predictability. Remove automatic first/last-thirds conclusions and arbitrary confidence gates. User-selected baseline comparisons are descriptive differences; goals/appraisals supply personal relevance.

### 6.7 Statistical claims policy

Exact descriptions of the exported records do not require a confidence interval: they describe those records, not a population estimate. Any prediction about future behavior, significance claim, or confidence interval needs a separately specified inferential method that addresses dependence, missingness, selection and multiple pattern searches. The model cannot invent it.

Do not run a naive binomial confidence interval on every app transition and call the findings validated; repeated events within one day/person can be dependent. Do not select the threshold/window with the most dramatic result and present it as a prespecified discovery. Expose exploratory controls honestly.

Use data availability labels (“Observed,” “User reviewed,” “Partial coverage”) only for their factual meaning. Do not replace confidence scores with equally ungrounded “Strong pattern” badges.

## 7. User appraisal: meaning without corrupting the log

Add an optional field in the existing review flow: **Was this how you wanted to spend the time?** Choices Intentional / Unwanted / Unsure; default Unreviewed. Allow an optional reason, max 160 characters, stored as user-authored private context and not sent to external AI by default.

This is authorized user feedback, not new passive collection. Reuse correction revisions/outbox/ownership/privacy controls for a distinct `appraisal` operation or entity. It must not silently change category, delete data, alter raw times, exclude valid occupancy, or modify engine rules.

Scope defaults to the selected effective interval within the block, with preview. Partial session intersections are preserved. Batch changes affect only explicitly selected rows/intervals. Save/undo works after sync, offline, and across conflicts exactly like other user edits.

A safe interval can be Work and Unwanted (for example, unnecessary work), or Sink and Intentional (a chosen break). That is valid. Categories and appraisals measure different things. “This was intentional” updates interpretation/ranking immediately; it does not erase the recorded activity.

User-confirmed unwanted duration = union of effective, included intervals explicitly marked Unwanted. Excluded intervals stay out of active analysis. Display “Marked unwanted by you,” never “Objectively wasted.” Show unreviewed coverage separately so a small reviewed subset is not presented as the whole week. Across devices, conflicting overlapping Intentional/Unwanted appraisals are marked Mixed in combined summaries; do not silently call the entire shared minute unwanted. Preserve source-level review evidence.

Default dashboard does not gain a fifth metric card. The new value appears in block review, App lens and Analyzer when reviews exist. Its coverage disclosure stays inside the same small evidence line.

## 8. Useful guidance and small experiments

A suggestion must name its factual basis and the user intention it addresses. If no intention exists, its action is Review activity or Set a goal—not “stop wasting time.” Offer at most one experiment per finding.

Example: “If fewer long YouTube segments is your goal, try choosing a stop point before starting, then compare the next selected period.” The experiment's threshold/duration are explicit user choices, not evidence-backed optimal values. Do not claim guaranteed savings or causation.

Use existing goal/block setup, prefilled for review. An experiment record, if implemented, is user-authored: chosen action, start/end, selected metric, baseline window and scope. No new reminders or enforcement are implied. At review time show before/after values, source/coverage differences, correction changes, and the user's own appraisal. Say “Recorded difference during this experiment,” not “This intervention caused a 30% improvement.”

Prefer a reviewable action over a catchy but unactionable statistic. A numerical novelty belongs in App lens detail unless it answers a user's question.

## 9. AI contract and invalidation

Extend the existing fact packet with:

```ts
type InsightFact = {
  id: string;
  definitionVersion: string;
  dataRevision: string;
  window: { startUtc: string; endUtc: string; timezone: string };
  scope: string; // display-safe description
  observedText: string;
  numerator: number | null;
  denominator: number | null;
  unit: string;
  comparator?: '<' | '<=' | '>' | '>=';
  threshold?: number;
  sampleUnit: 'recorded-segment' | 'verified-session' | 'block' | 'interval';
  sampleCount: number;
  basis: 'recorded' | 'effective' | 'user-appraised';
  limitations: string[];
  evidenceKey: string;
};

type GuidedInsight = {
  factIds: string[];
  observed: string;
  interpretation: string | null;
  intentionId: string | null;
  action: { label: string; destination: string } | null;
};
```

Use integer duration units internally; types above represent view contracts, not a new captured-session schema. Derived values are computed at read time. AI receives only the existing approved, consented fact summary. Preserve aggregate-only defaults, validated app placeholders, provider key security and private-fence enforcement.

Reject generated numbers not supported by the packet; causal/medical claims; changing segments into checks/visits; failure judgments for open goals; unsupported “usually,” “always” and “best”; claims treating excluded data as gone; or missing qualifiers that materially change interpretation. Repair only from deterministic templates or fall back to local factual copy. Model confidence is not evidence.

When a classification, appraisal, exclusion, goal revision, timezone, source scope or sync batch changes relevant inputs, invalidate affected facts, matched records, quote and report together. Never leave an old witty line contradicting a newly intentional appraisal. Preserve generated report snapshots as dated artifacts where supported, but mark them stale in app. Previously exported static files do not update remotely.

Ranking is a transparent product choice, not a scientific score: prioritize current explicit goal relevance, user-requested scope, actionable reviewed activity, then recent neutral descriptions. Cap item count per existing design and avoid repetitive app criticism. If there is no useful supported insight, show the factual summary without manufacturing a weakness.

## 10. Audit reference and implementation examples

Source: `timeframe-log-7d-all-2026-09-02.json`, exported 2026-09-02. This is a user-supplied example, not a synthetic golden or proof of complete capture. Do not hard-code these values into UI or create fixture copies contrary to repository policy.

| Exact selected-label audit | instagram.com | youtube.com |
|---|---:|---:|
| Recorded segments | 151 | 273 |
| Timestamp duration sum (seconds) | 6,792 | 21,830 |
| Median segment seconds | 14 | 18 |
| Nearest-rank p80 seconds | 55 | 94 |
| Count under 60 seconds | 121 | 190 |
| Duration under 60 seconds | 1,932 | 2,891 |
| Count over 300 seconds | 3 | 21 |
| Duration over 300 seconds | 1,807 | 11,437 |

These selected-label durations matched interval unions in the audited export. That does not justify using raw sums for arbitrary future queries. The export contains 1,563 records, no duplicate IDs, UTC timestamps without an IANA timezone, and small same-device overlaps. The computer source is Chrome extension activity. Source-specific capture semantics and coverage remain unverified.

For YouTube: `11,437 / 21,830 = 52.39%` of recorded duration in segments over 300 seconds. The same statistic is 62.92% over 180 seconds and 24.27% over 600 seconds. All are factual; none makes its threshold scientifically privileged.

Do not expose any unrelated sensitive labels from the audit. Examples use only these ordinary app/domain labels, and production privacy filtering precedes all display/AI/export operations.

## 11. Implementation order and acceptance

1. Audit collector boundaries, overlap, timezone and coverage adapters; document unknowns.
2. Implement shared exact interval/distribution fact definitions and evidence identity.
3. Apply Timeframe UI shared components, remove the rejected three-tab strip, and wire metric help.
4. Replace arbitrary reliability wording and thresholds-as-science in all existing copy/generation prompts.
5. Wire Evidence Summary/Calculation/Records to Overview, App lens, timeline, Logs and Analyzer.
6. Add optional appraisal distinct from classification/exclusion, including versioned offline/post-sync edits.
7. Wire conditional guidance and current-revision AI generation/fallbacks.
8. Validate computations and real rendered layouts before calling this update complete.

Required targeted checks:

- [ ] Rhythm / Time Mix / Patterns tabs and their lower empty panel are absent on desktop and mobile; trend, mix and findings appear in the specified contextual placements.
- [ ] No dashboard height growth beyond the slim composition strip; app/trend/mix detail opens without adding permanent page sections.
- [ ] Metric hold and visible info-button paths open identical short definitions; keyboard/screen-reader path works; holds cancel on scroll/pan and do not trigger a second click.
- [ ] Short explanation is plain language with See calculation for depth; no formula wall or hover-only essential content.
- [ ] Timeframe UI wrappers/theme are applied consistently; no mixed primitive backends or unsolicited framework migration; actual installed versions compile.


- [ ] Touching intervals [0,10), [10,20) total 20; overlapping [0,10), [5,15) total 15; duplicate IDs do not double-count.
- [ ] Exact 60s/300s durations land in defined histogram bins; threshold <=/> partitions counts exactly.
- [ ] Nearest-rank quantile, even-N median and empty/singleton states match the specified convention across platforms.
- [ ] Overlapping time-contribution bins never falsely total to 100%; union and summed segment-seconds are distinguished.
- [ ] Partial block intersection and pauses produce correct intervals; overlapping blocks/corrections do not double-count or bridge excluded gaps.
- [ ] Ambiguous overlap, private relationships and missing coverage cannot become definite transitions or return times.
- [ ] Unobserved returns are not silently dropped from the explanation or imputed as zero.
- [ ] No-data versus measured zero, partial day, timezone change and DST cases retain correct state and duration.
- [ ] Witty copy uses the correct sample unit, goal revision, review meaning, window and numbers.
- [ ] Intentional appraisal changes interpretation but not category/union duration; exclusion changes eligible analysis and is not labeled deletion.
- [ ] Post-sync appraisal/correction retries are idempotent; conflicts retained; evidence/AI/report revisions invalidate consistently.
- [ ] Records opened from a claim reproduce its actual numerator and denominator after filtering, pagination and corrections.
- [ ] No new confidence score or heuristic “scientifically proven” badge appears.
- [ ] Related metrics/actions follow the task-home mapping; one detail surface with contextual Back; date/filter/zoom/scroll state survives investigation and editing.
- [ ] Main Overview stays within the original compactness targets; detail opens in existing tabs/sheets; keyboard and mobile access remain complete.
- [ ] Privacy-safe payloads and outputs contain no hidden app information or reconstructable protected contributions.

Use the repository's existing test and fixture policy. Simple algebra checks may be expressed as unit/property tests where permitted; do not alter supplied goldens to manufacture passing outputs. No new test file should merely assert that a label exists while ignoring the mathematical behavior.

Deliver a changed-file map, passed checks, screenshots of updated evidence/app review/Analyzer states, and unresolved data-contract limitations. Do not claim the analytics are scientifically validated because a build passes.

## 12. Method references and limits

- [NIST: Percentiles](https://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm) explains percentile definitions and estimation conventions. The nearest-rank choice in this update is an explicit implementation convention, not the only valid method.
- [NIST: Confidence intervals for proportions](https://itl.nist.gov/div898/handbook/prc/section2/prc241.htm) describes proportion intervals. This is methodological context, not permission to assume dependent personal activity events are independent trials.
- [Mark et al.: Focused, Aroused, but so Distractible](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/10/p903-mark.pdf) studied activity alongside experience sampling. It does not validate inferring attention or cognitive recovery directly from this app's foreground log.

No source here certifies one-minute/five-minute thresholds, minimum sample gates, or the app's automated deep-block definition as universal boundaries. This update deliberately separates exact observation, user meaning and optional guidance.
