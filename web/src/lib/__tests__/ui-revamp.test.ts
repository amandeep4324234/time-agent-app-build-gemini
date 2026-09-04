import { describe, it, expect } from "vitest";
import { buildTimelineModel, hitTestTimeline } from "../timeline-model";
import { compute12WeekHeatmap } from "../heatmap";
import { generateInsightLines } from "../insight-lines";
import { formatClock, formatDuration, formatHoursDuration, maskFencedLabel } from "../format";
import { EnrichedSession } from "../types";
import { computeDay } from "../metrics";
import demoSessions from "../../../data/demo-sessions.json";
import { buildLedger } from "../ingest";
import { Envelope } from "../types";

describe("Revamped UI Spec Tests (UI.md & QA.md)", () => {
  const ledger = buildLedger(demoSessions as unknown as Envelope);

  // 1. Contrast and Color Token tests (QA.md U3, U4, U7)
  describe("Visual System Tokens & Contrast (UI.md §0.1, QA.md U7)", () => {
    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace("#", "");
      const num = parseInt(clean, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function luminance(r: number, g: number, b: number): number {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const [r1, g1, b1] = hexToRgb(hex1);
      const [r2, g2, b2] = hexToRgb(hex2);
      const l1 = luminance(r1, g1, b1);
      const l2 = luminance(r2, g2, b2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const bg = "#0D1117";

    it("U7: Primary text #E6EDF3 passes AAA (>= 7:1) on bg #0D1117", () => {
      expect(contrastRatio("#E6EDF3", bg)).toBeGreaterThanOrEqual(7.0);
    });

    it("U7: Secondary text #8B949E passes AA (>= 4.5:1) on bg #0D1117", () => {
      expect(contrastRatio("#8B949E", bg)).toBeGreaterThanOrEqual(4.5);
    });

    it("U7: Accent amber #D29922 passes AA (>= 4.5:1) on bg #0D1117", () => {
      expect(contrastRatio("#D29922", bg)).toBeGreaterThanOrEqual(4.5);
    });

    it("U7: Sink red #F85149 passes AA (>= 4.5:1) on bg #0D1117", () => {
      expect(contrastRatio("#F85149", bg)).toBeGreaterThanOrEqual(4.5);
    });
  });

  // 2. Timeline model and Day bucketing tests (UI.md §2.1, QA.md A1, P1, P2)
  describe("Timeline Model (UI.md §2.1)", () => {
    it("A1: Computes timeline spanning 04:00 to 04:00 (+1) local time", () => {
      const model = buildTimelineModel("2026-08-27", ledger, "Asia/Kolkata");
      const durationMs = model.dayEndMs - model.dayStartMs;
      expect(durationMs).toBe(24 * 3600 * 1000);
      expect(model.phoneSegments.length).toBeGreaterThan(0);
      expect(model.runSegments.length).toBeGreaterThan(0);
    });

    it("P1 & P2: Fenced apps are strictly masked to 'private' on timeline and popover", () => {
      const fencedSession: EnrichedSession = {
        id: "fenced-1",
        label: "screening.mhanational.org",
        canonical_app: "private",
        category: "private",
        source: "chrome_extension",
        device: "computer",
        started_at: "2026-08-27T10:00:00.000Z",
        ended_at: "2026-08-27T10:20:00.000Z",
        started_at_ms: Date.parse("2026-08-27T10:00:00.000Z"),
        ended_at_ms: Date.parse("2026-08-27T10:20:00.000Z"),
        seconds: 1200,
        minutes: 20,
        session_kind: "block",
      };

      const model = buildTimelineModel("2026-08-27", [fencedSession], "Asia/Kolkata");
      const seg = model.computerSegments[0];
      expect(seg).toBeDefined();
      expect(seg.displayLabel).toBe("private");
      expect(seg.displayLabel).not.toContain("screening");

      // Scrub hit test
      const hit = hitTestTimeline(seg.leftPercent + seg.widthPercent / 2, model, "Asia/Kolkata");
      expect(hit.readoutText).toContain("private");
      expect(hit.readoutText).not.toContain("screening.mhanational.org");
    });

    it("Direct manipulation scrub reports 'nothing tracked here today' when only ghost pixels exist", () => {
      const ghostSession: EnrichedSession = {
        id: "ghost-1",
        label: "GitHub",
        canonical_app: "GitHub",
        category: "work",
        source: "chrome_extension",
        device: "computer",
        started_at: "2026-08-20T10:00:00.000Z",
        ended_at: "2026-08-20T11:00:00.000Z",
        started_at_ms: Date.parse("2026-08-20T10:00:00.000Z"),
        ended_at_ms: Date.parse("2026-08-20T11:00:00.000Z"),
        seconds: 3600,
        minutes: 60,
        session_kind: "block",
      };

      // Day with no live sessions, but ghost session
      const model = buildTimelineModel(
        "2026-08-27",
        [],
        "Asia/Kolkata",
        5,
        [ghostSession],
        "2026-08-20"
      );

      const ghostSeg = model.ghostComputerSegments[0];
      expect(ghostSeg).toBeDefined();

      const hit = hitTestTimeline(ghostSeg.leftPercent + ghostSeg.widthPercent / 2, model, "Asia/Kolkata");
      expect(hit.isGhostOnly).toBe(true);
      expect(hit.readoutText).toBe("nothing tracked here today");
    });
  });

  // 3. 12-Week Heatmap Tests (UI.md §2.3)
  describe("Heatmap 12wk Geometry & Intensity (UI.md §2.3)", () => {
    it("Produces exactly 12 columns x 7 weekday rows with Monday as top row", () => {
      const grid = compute12WeekHeatmap(ledger, "2026-09-02", "Asia/Kolkata");
      expect(grid.length).toBe(12); // 12 weeks
      for (const week of grid) {
        expect(week.length).toBe(7); // 7 weekdays
        expect(week[0].weekday).toBe(0); // Monday is top (index 0)
        expect(week[6].weekday).toBe(6); // Sunday is bottom (index 6)
      }
    });

    it("U8: No-data is visually distinct from zero (intensity -1 != 0)", () => {
      const grid = compute12WeekHeatmap(ledger, "2026-09-02", "Asia/Kolkata");
      // Pick a day far in the past that has zero rows in demo data
      const pastCell = grid[0][0];
      expect(pastCell.isNoData).toBe(true);
      expect(pastCell.intensity).toBe(-1); // -1 is transparent with 1px outline
      expect(pastCell.intensity).not.toBe(0); // 0 is #161B22
    });
  });

  // 4. InsightLines Templates Tests (UI.md §3, QA.md P3)
  describe("InsightLines Templates (UI.md §3)", () => {
    it("Formats FOCUS_HOURS, SINK_HOURS, and HOURS_BY_SOURCE according to locked templates", () => {
      const dayMetrics = computeDay("2026-08-27", ledger);
      const timelineModel = buildTimelineModel("2026-08-27", ledger, "Asia/Kolkata");
      const lines = generateInsightLines(dayMetrics, timelineModel.runSegments, ledger, "Asia/Kolkata");

      const focusLine = lines.find((l) => l.type === "focus_hours");
      expect(focusLine?.text).toMatch(/^Focus \d+h \d+m across \d+ runs\.$/);

      const sinkLine = lines.find((l) => l.type === "sink_hours");
      expect(sinkLine?.text).toMatch(/^Sinks took \d+h \d+m — \d+% of tracked time\.$/);

      const sourceLine = lines.find((l) => l.type === "hours_by_source");
      expect(sourceLine?.text).toMatch(/^Phone .+ \| computer .+\.$/);
    });

    it("P3: Insight sentences name zero fenced labels", () => {
      const dayMetrics = computeDay("2026-08-27", ledger);
      const timelineModel = buildTimelineModel("2026-08-27", ledger, "Asia/Kolkata");
      const lines = generateInsightLines(dayMetrics, timelineModel.runSegments, ledger, "Asia/Kolkata");

      for (const line of lines) {
        expect(line.text).not.toContain("screening.mhanational.org");
        expect(line.text).not.toContain("heartitout.in");
      }
    });

    it("Suppresses DEEP_BLOCKS and RETURN_AFTER_SINK on light days (< 45 min)", () => {
      const dayMetrics = computeDay("2026-08-27", ledger);
      const lightDayMetrics = { ...dayMetrics, lightDay: true };
      const timelineModel = buildTimelineModel("2026-08-27", ledger, "Asia/Kolkata");
      const lines = generateInsightLines(lightDayMetrics, timelineModel.runSegments, ledger, "Asia/Kolkata");

      expect(lines.find((l) => l.type === "deep_blocks")).toBeUndefined();
      expect(lines.find((l) => l.type === "return_after_sink")).toBeUndefined();
      expect(lines[0].text).toContain("Light day:");
    });
  });

  // 5. Formatting Utilities Tests (UI.md §0.2)
  describe("Formatting Utilities (UI.md §0.2)", () => {
    it("Formats duration without emojis, decoration, or invalid formats", () => {
      expect(formatDuration(3600)).toBe("1h");
      expect(formatDuration(3600 + 720)).toBe("1h 12m");
      expect(formatDuration(47 * 60)).toBe("47m");
      expect(formatDuration(22 * 60)).toBe("22m");
      expect(formatDuration(4 * 60 + 12)).toBe("4m 12s");
    });

    it("Formats clock in lowercase 12-hour format: '2:47pm'", () => {
      // 2026-08-27T09:17:00Z in Asia/Kolkata is 14:47 (2:47pm)
      const ms = Date.parse("2026-08-27T09:17:00.000Z");
      expect(formatClock(ms, "Asia/Kolkata")).toBe("2:47pm");
    });

    it("Masks fenced apps to 'private'", () => {
      expect(maskFencedLabel("screening.mhanational.org")).toBe("private");
      expect(maskFencedLabel("GitHub")).toBe("GitHub");
    });
  });
});
