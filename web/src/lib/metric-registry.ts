/**
 * Shared Metric Registry & AI Fact Types
 * Authority: update.md §4.1, §9
 *
 * Ship initial definitions in a shared registry, not hard-coded separately in screens.
 * Registry contract: stable metric ID, definition version, short meaning,
 * counting rule, optional limitation, evidence resolver, accessible label.
 */

export interface MetricDefinition {
  id: string;
  version: string;
  name: string;
  meaning: string;       // One plain sentence <= 25 words
  countingRule: string;  // One plain sentence <= 30 words
  limitation?: string;   // One metric-specific limitation
  accessibleLabel: string; // e.g. "Explain Focus time"
  evidenceResolverKey: string;
  stableId?: string;
  definitionVersion?: string;
  whatItMeans?: string;
  howWeCountIt?: string;
}

export const METRIC_REGISTRY: Record<string, MetricDefinition> = {
  focus_time: {
    id: "focus_time",
    version: "1.2",
    name: "Focus time",
    meaning: "Recorded time in apps you marked as Work.",
    countingRule:
      "We apply the existing idle rules and count simultaneous device time once.",
    limitation: "It does not measure your attention.",
    accessibleLabel: "Explain Focus time",
    evidenceResolverKey: "focus",
  },
  focus_blocks: {
    id: "focus_blocks",
    version: "1.2",
    name: "Focus blocks",
    meaning: "Work periods you deliberately started in Timeframe.",
    countingRule:
      "We count completed blocks; pauses do not count toward active duration.",
    limitation: "Pauses and unfinished blocks are excluded from active block count.",
    accessibleLabel: "Explain Focus blocks",
    evidenceResolverKey: "focus_blocks",
  },
  longest_deep_block: {
    id: "longest_deep_block",
    version: "1.2",
    name: "Longest deep block",
    meaning: "Your longest automatically detected Work run.",
    countingRule:
      "“Deep” means the app's run rules passed and the run lasted at least 15 minutes.",
    limitation: "It is not a measurement of concentration.",
    accessibleLabel: "Explain Longest deep block",
    evidenceResolverKey: "longest_run",
  },
  sink_time: {
    id: "sink_time",
    version: "1.2",
    name: "Sink time",
    meaning: "Recorded time in apps you marked as Sinks.",
    countingRule:
      "We count eligible activity once across overlapping devices.",
    limitation: "A chosen break can still be intentional.",
    accessibleLabel: "Explain Sink time",
    evidenceResolverKey: "sink",
  },
  median_segment: {
    id: "median_segment",
    version: "1.2",
    name: "Median segment",
    meaning: "The middle length among the selected recorded segments.",
    countingRule:
      "Half lie at or below the middle and half at or above.",
    limitation: "Recording boundaries may differ from real visits.",
    accessibleLabel: "Explain Median segment",
    evidenceResolverKey: "median_segment",
  },
  time_mix: {
    id: "time_mix",
    version: "1.2",
    name: "Time mix",
    meaning: "How your eligible recorded time is split by category.",
    countingRule:
      "Percentages appear only when the categories form a non-overlapping total.",
    limitation: "Simultaneous overlapping categories are measured without false proportions.",
    accessibleLabel: "Explain Time mix",
    evidenceResolverKey: "time_mix",
  },
  block_overlap: {
    id: "block_overlap",
    version: "1.2",
    name: "Block overlap",
    meaning: "App activity recorded during a block's active intervals.",
    countingRule:
      "We intersect the app's recorded time with the block, excluding pauses.",
    limitation: "This does not prove distraction.",
    accessibleLabel: "Explain Block overlap",
    evidenceResolverKey: "block_overlap",
  },
  marked_unwanted: {
    id: "marked_unwanted",
    version: "1.2",
    name: "Marked unwanted",
    meaning: "Recorded time you explicitly said you did not want to spend that way.",
    countingRule:
      "It reflects your review; unreviewed activity is not automatically unwanted.",
    limitation: "Reflects explicit user reviews only; unreviewed time is not counted as unwanted.",
    accessibleLabel: "Explain Marked unwanted",
    evidenceResolverKey: "marked_unwanted",
  },
  recorded_change: {
    id: "recorded_change",
    version: "1.2",
    name: "Recorded change",
    meaning: "The difference between the two displayed periods.",
    countingRule:
      "Coverage and review changes can affect it.",
    limitation: "It is not proof of lasting improvement.",
    accessibleLabel: "Explain Recorded change",
    evidenceResolverKey: "recorded_change",
  },
};

export const METRIC_IDS = Object.keys(METRIC_REGISTRY);

export function getMetricDefinition(metricId: string): MetricDefinition | undefined {
  const def = METRIC_REGISTRY[metricId];
  if (!def) return undefined;
  return {
    ...def,
    stableId: def.id,
    definitionVersion: def.version,
    whatItMeans: def.meaning,
    howWeCountIt: def.countingRule,
  };
}

export function resolveMetricFacts(
  metricId: string,
  window: { startUtc: string; endUtc: string; timezone: string },
  scope: string,
  numerator: number | null,
  denominator: number | null,
  unit: string,
  sampleCount: number,
  basis: "recorded" | "effective" | "user-appraised",
  dataRevision: string,
  limitations: string[] = []
): InsightFact {
  const def = getMetricDefinition(metricId);
  const metricLimitations = def?.limitation ? [def.limitation, ...limitations] : limitations;
  return {
    id: `fact-${metricId}-${Date.now()}`,
    definitionVersion: def?.version || "1.2",
    dataRevision,
    window,
    scope,
    observedText: def?.meaning || `Recorded ${metricId}`,
    numerator,
    denominator,
    unit,
    sampleUnit: "recorded-segment",
    sampleCount,
    basis,
    limitations: metricLimitations,
    evidenceKey: `ev-${metricId}`,
  };
}

/**
 * AI Fact Packet & Guided Insight Types
 * Authority: update.md §9
 */
export type InsightFact = {
  id: string;
  definitionVersion: string;
  dataRevision: string;
  window: { startUtc: string; endUtc: string; timezone: string };
  scope: string; // display-safe description
  observedText: string;
  numerator: number | null;
  denominator: number | null;
  unit: string;
  comparator?: "<" | "<=" | ">" | ">=";
  threshold?: number;
  sampleUnit: "recorded-segment" | "verified-session" | "block" | "interval";
  sampleCount: number;
  basis: "recorded" | "effective" | "user-appraised";
  limitations: string[];
  evidenceKey: string;
};

export type GuidedInsight = {
  factIds: string[];
  observed: string;
  interpretation: string | null;
  intentionId: string | null;
  action: { label: string; destination: string } | null;
};
