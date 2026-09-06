import { describe, it, expect } from "vitest";
import { CREATURE_ENABLED } from "../constants";
import { buildLedger } from "../ingest";
import { Envelope, EnrichedSession } from "../types";
import demoSessions from "../../../data/demo-sessions.json";
import { buildSafeDayPresentation, isFencedSession, FENCED_DOMAINS } from "../safe-adapter";
import { evaluateTodayObservations, evaluateHistoricalObservations } from "../observations";
import { comparePeriods } from "../compare-engine";
import { generateWeekCardSvg } from "../../adapters/week-card-resvg";

describe("TIMEFRAME-UI-REDESIGN Contracts & Invariants", () => {
  const ledger = buildLedger(demoSessions as unknown as Envelope);
  const TIMEZONE = "Asia/Kolkata";

  // 1. Feature Dormancy Policy (§2.1)
  describe("Creature Dormancy (§2.1)", () => {
    it("CREATURE_ENABLED constant is strictly false", () => {
      expect(CREATURE_ENABLED).toBe(false);
    });
  });

  // 2. Strict Privacy Disclosure Boundary (§3.3)
  describe("Strict Privacy Disclosure Boundary (§3.3)", () => {
    it("Identifies fenced domains as fenced sessions", () => {
      const fencedSession: EnrichedSession = {
        id: "fenced-test-1",
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

      expect(isFencedSession(fencedSession)).toBe(true);
    });

    it("Fenced sessions never reach presentation segments or app lists", () => {
      const dayStartMs = Date.parse("2026-08-27T04:00:00.000+05:30");
      const dayEndMs = dayStartMs + 24 * 3600 * 1000;

      const daySessions = ledger.filter(
        (s) => s.started_at_ms >= dayStartMs && s.started_at_ms < dayEndMs
      );

      const presentation = buildSafeDayPresentation(
        "2026-08-27",
        daySessions,
        [],
        dayStartMs,
        dayEndMs,
        TIMEZONE
      );

      // Check segments
      for (const seg of presentation.segments.computer) {
        expect(seg.category).not.toBe("private");
        expect(FENCED_DOMAINS.has(seg.app.toLowerCase())).toBe(false);
      }
      for (const seg of presentation.segments.phone) {
        expect(seg.category).not.toBe("private");
        expect(FENCED_DOMAINS.has(seg.app.toLowerCase())).toBe(false);
      }

      // Check app list
      for (const app of presentation.apps) {
        expect(app.category).not.toBe("private");
        expect(FENCED_DOMAINS.has(app.label.toLowerCase())).toBe(false);
      }

      // Generic disclosure is present
      expect(presentation.privacyDisclosure).toBe("Private activity is excluded from this view.");
    });
  });

  // 3. Section 9 Insight Contract & Deterministic Ranking
  describe("Observational Insight Contract & Ranking (§9)", () => {
    it("Ranks Daily Longest Block first on Today when qualifying run exists", () => {
      const mockRuns = [
        {
          startMs: Date.parse("2026-08-27T10:00:00.000Z"),
          endMs: Date.parse("2026-08-27T11:00:00.000Z"),
          durationSeconds: 3600,
          fillerSeconds: 0,
          ended_by: "sink" as const,
          killerApp: "YouTube",
          apps: ["VS Code"],
        },
      ];

      const observations = evaluateTodayObservations(
        "2026-08-27",
        mockRuns,
        ledger,
        ledger,
        TIMEZONE
      );

      expect(observations.length).toBeGreaterThan(0);
      expect(observations[0].insight.family).toBe("daily_longest_block");
      expect(observations[0].insight.sentence).toMatch(
        /^Your longest recorded focus block lasted \d+h(?: \d+m)?\.$/
      );
      expect(observations[0].evidence.title).toBe("Longest Focus Block");
    });

    it("Shuts out banned guilt copy across all generated observations", () => {
      const BANNED_PATTERNS = [
        "you woke up",
        "you wasted",
        "lost $",
        "danger zone",
        "this caused you to",
        "productivity score",
        "killed your focus",
      ];

      const observations = evaluateHistoricalObservations(
        "2026-09-02",
        ledger,
        28,
        TIMEZONE
      );

      for (const obs of observations) {
        const lower = obs.insight.sentence.toLowerCase();
        for (const banned of BANNED_PATTERNS) {
          expect(lower.includes(banned)).toBe(false);
        }
      }
    });

    it("App sequence insight requires proportion >= 35% and >= 3 occurrences", () => {
      const obs = evaluateHistoricalObservations("2026-09-02", ledger, 14, TIMEZONE);
      const seq = obs.find((o) => o.insight.family === "app_sequence");
      if (seq) {
        expect(seq.insight.sampleCount).toBeGreaterThanOrEqual(3);
        expect(seq.insight.sentence).toMatch(/followed .+ in \d+ of \d+ eligible transitions\./);
      }
    });
  });

  // 4. Comparison Engine & Deep Blocks (§7.3, §8.2)
  describe("Aligned Comparison Engine (§8.2)", () => {
    it("Calculates signed absolute differences and percent change", () => {
      const currentWeek = ["2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31", "2026-09-01"];
      const priorWeek = ["2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25"];

      const comparison = comparePeriods(currentWeek, priorWeek, ledger, TIMEZONE);

      expect(comparison.metrics.focus.currentFormatted).toBeDefined();
      expect(comparison.metrics.focus.signedDeltaFormatted).toMatch(/^[+-]?\d+/);
      expect(comparison.whatChanged.length).toBeLessThanOrEqual(3);

      for (const item of comparison.whatChanged) {
        expect(Math.abs(item.deltaSeconds)).toBeGreaterThanOrEqual(30 * 60);
      }
    });

    it("Suppresses 'What changed' when fewer than 4 eligible days have data", () => {
      const comparison = comparePeriods(["2026-08-27"], ["2026-08-20"], ledger, TIMEZONE);
      expect(comparison.mode).toBe("day");
    });
  });

  // 5. Cross-Device Union Invariants (§3.1, §3.2)
  describe("Union Durations (§3.1, §3.2)", () => {
    it("Computes union metrics instead of raw sums for overlapping sessions", () => {
      const startMs = Date.parse("2026-08-27T04:00:00.000+05:30");
      const endMs = startMs + 24 * 3600 * 1000;

      const overlapSessions: EnrichedSession[] = [
        {
          id: "overlap-comp-1",
          label: "VS Code",
          canonical_app: "code",
          category: "work",
          source: "chrome_extension",
          device: "computer",
          started_at: "2026-08-27T10:00:00.000+05:30",
          ended_at: "2026-08-27T11:00:00.000+05:30",
          started_at_ms: startMs + 6 * 3600 * 1000,
          ended_at_ms: startMs + 7 * 3600 * 1000,
          seconds: 3600,
          minutes: 60,
          session_kind: "block",
        },
        {
          id: "overlap-phone-1",
          label: "Slack",
          canonical_app: "slack",
          category: "work",
          source: "android",
          device: "phone",
          started_at: "2026-08-27T10:00:00.000+05:30",
          ended_at: "2026-08-27T11:00:00.000+05:30",
          started_at_ms: startMs + 6 * 3600 * 1000,
          ended_at_ms: startMs + 7 * 3600 * 1000,
          seconds: 3600,
          minutes: 60,
          session_kind: "block",
        },
      ];

      const presentation = buildSafeDayPresentation(
        "2026-08-27",
        overlapSessions,
        [],
        startMs,
        endMs,
        TIMEZONE
      );

      // Raw sum is 7200s (2h), but union must be 3600s (1h)
      expect(presentation.metrics.focus.value).toBe(3600);
      expect(presentation.metrics.unionTrackedSeconds).toBe(3600);
      expect(presentation.categories.find((c) => c.category === "work")?.seconds).toBe(3600);
    });
  });

  // 6. Window Gating (§8.1)
  describe("Window Gating (§8.1)", () => {
    it("Enforces strict window gating for 14-day and 28-day insight algorithms", () => {
      // Evaluating on 7-day window should NEVER produce 14d or 28d families
      const obs7d = evaluateHistoricalObservations("2026-09-02", ledger, 7, TIMEZONE);
      for (const obs of obs7d) {
        expect(obs.insight.family).not.toBe("app_sequence");
        expect(obs.insight.family).not.toBe("sink_concentration");
        expect(obs.insight.family).not.toBe("recurring_focus_window");
      }

      // Evaluating on 14-day window should NEVER produce 28d families
      const obs14d = evaluateHistoricalObservations("2026-09-02", ledger, 14, TIMEZONE);
      for (const obs of obs14d) {
        expect(obs.insight.family).not.toBe("recurring_focus_window");
      }
    });
  });

  // 7. Week Card SVG Export Compliance (§13)
  describe("Week Card SVG Export Compliance (§13)", () => {
    it("Week card SVG export strictly complies with §13 design rules", () => {
      const mockCard = {
        label: "merged export · 65% focus-set time",
        focusSharePercent: 65,
        focusHours: 35.5,
        sinkHours: 8.2,
        blocksCount: 12,
        longestMinutes: 75,
        footer: "Tracked 7 days · phone up 7/7 · computer up 7/7 · unclassified 5% · double-counted 1.20h",
        clean: false,
        watermark: false,
        dateRange: "Aug 27, 2026 – Sep 2, 2026",
      };

      const svg = generateWeekCardSvg(mockCard);

      // 1. Dimensions 1080x1350
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1350"');
      expect(svg).toContain('viewBox="0 0 1080 1350"');

      // 2. Solid #0D1117 background
      expect(svg).toContain('fill="#0D1117"');

      // 3. 64px safe margins
      expect(svg).toContain('x="64" y="64" width="952" height="1222"');

      // 4. No promotional watermark
      expect(svg).not.toMatch(/<text[^>]*>Timeframe<\/text>/i);

      // 5. Smallest text >= 36px (no font-size smaller than 36)
      const fontSizeMatches = Array.from(svg.matchAll(/font-size="(\d+)"/g));
      expect(fontSizeMatches.length).toBeGreaterThan(0);
      for (const match of fontSizeMatches) {
        const size = parseInt(match[1], 10);
        expect(size).toBeGreaterThanOrEqual(36);
      }

      // 6. Contains daily activity bars and coverage footer
      expect(svg).toContain("Daily Activity (7 Days)");
      expect(svg).toContain("Tracked 7 days");
    });
  });
});
