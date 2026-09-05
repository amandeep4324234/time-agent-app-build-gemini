import { describe, it, expect } from "vitest";
import { METRIC_REGISTRY, getMetricDefinition } from "../metric-registry";

describe("Shared Metric Registry Contract (§4.1)", () => {
  const keys = Object.keys(METRIC_REGISTRY);

  it("Contains all 9 specified metrics", () => {
    expect(keys).toContain("focus_time");
    expect(keys).toContain("focus_blocks");
    expect(keys).toContain("longest_deep_block");
    expect(keys).toContain("sink_time");
    expect(keys).toContain("median_segment");
    expect(keys).toContain("time_mix");
    expect(keys).toContain("block_overlap");
    expect(keys).toContain("marked_unwanted");
    expect(keys).toContain("recorded_change");
    expect(keys.length).toBe(9);
  });

  it("Satisfies length constraints: meaning <= 25 words, countingRule <= 30 words", () => {
    for (const key of keys) {
      const metric = METRIC_REGISTRY[key];
      const meaningWords = metric.meaning.trim().split(/\s+/).length;
      const countingWords = metric.countingRule.trim().split(/\s+/).length;

      expect(meaningWords).toBeLessThanOrEqual(25);
      expect(countingWords).toBeLessThanOrEqual(30);
      expect(metric.accessibleLabel).toMatch(/^Explain\s+/);
      expect(metric.version).toBeDefined();
      expect(metric.evidenceResolverKey).toBeDefined();
    }
  });

  it("getMetricDefinition returns matching definition", () => {
    const ft = getMetricDefinition("focus_time");
    expect(ft).toBeDefined();
    expect(ft?.name).toBe("Focus time");
    expect(ft?.limitation).toBe("It does not measure your attention.");
  });
});
