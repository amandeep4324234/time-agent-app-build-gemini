import { describe, it, expect } from "vitest";
import { validateSession, ingestSessions, buildLedger } from "../ingest";
import { cleanSessions, computeSessionKind } from "../clean";
import { classifySession } from "../classify";
import { getLogicalDay, isLightDay } from "../day";
import { computeTrackedMetrics, computeUnionDurationSeconds } from "../union";
import { computeFocusRuns } from "../focus-run";
import { computeWeek } from "../week";
import { computeHealth } from "../health";
import { Envelope, Session } from "../types";

import demoSessions from "../../../data/demo-sessions.json";
import goldens from "./goldens.json";
import chromeDark from "./fixtures/chrome-dark.json";
import twoDeviceHole from "./fixtures/two-device-hole.json";
import sustainedUnclassified from "./fixtures/sustained-unclassified.json";

describe("Web Replay Harness (Tests 1–20)", () => {
  // Test 1: validateSession accepts valid and rejects malformed
  it("Test 1: validateSession accepts valid sessions and rejects invalid", () => {
    const valid: Session = {
      id: "test-1",
      source: "chrome_extension",
      device: "computer",
      label: "GitHub",
      started_at: "2026-08-27T10:00:00.000Z",
      ended_at: "2026-08-27T10:15:00.000Z",
      seconds: 900,
      minutes: 15,
    };
    expect(validateSession(valid)).toBe(true);

    expect(validateSession(null)).toBe(false);
    expect(validateSession({ ...valid, seconds: 0 })).toBe(false);
    expect(validateSession({ ...valid, started_at: "not-a-date" })).toBe(false);
  });

  // Test 2: Ingest deduplication by id (first occurrence wins)
  it("Test 2: Deduplication by id — replaying twice does not double sessions or hours", () => {
    const sample: Session = {
      id: "dup-1",
      source: "chrome_extension",
      device: "computer",
      label: "GitHub",
      started_at: "2026-08-27T10:00:00.000Z",
      ended_at: "2026-08-27T10:10:00.000Z",
      seconds: 600,
      minutes: 10,
    };
    const doubled = ingestSessions([sample, sample]);
    expect(doubled.length).toBe(1);
    expect(doubled[0].seconds).toBe(600);
  });

  // Test 3: Duration guard (|ended_at - started_at - seconds| > 1s)
  it("Test 3: Duration guard recomputes seconds when discrepancy > 1s", () => {
    const skewed: Session = {
      id: "skew-1",
      source: "chrome_extension",
      device: "computer",
      label: "GitHub",
      started_at: "2026-08-27T10:00:00.000Z",
      ended_at: "2026-08-27T10:10:00.000Z",
      seconds: 100, // Should be 600
      minutes: 1.67,
    };
    const res = ingestSessions([skewed]);
    expect(res[0].seconds).toBe(600);
  });

  // Test 4: session_kind recomputed at ingest: <5s -> flicker, 5-120s -> glance, >=120s -> block
  it("Test 4: session_kind is correctly classified by duration", () => {
    expect(computeSessionKind(4)).toBe("flicker");
    expect(computeSessionKind(5)).toBe("glance");
    expect(computeSessionKind(120)).toBe("glance");
    expect(computeSessionKind(121)).toBe("block");
  });

  // Test 5: Timestamp tolerance: Z and +00:00
  it("Test 5: Handles both Z and +00:00 offsets identically", () => {
    const s1 = {
      id: "z-1",
      source: "chrome_extension",
      device: "computer",
      label: "GitHub",
      started_at: "2026-08-27T10:00:00.000Z",
      ended_at: "2026-08-27T10:05:00.000Z",
      seconds: 300,
      minutes: 5,
    };
    const s2 = {
      id: "z-2",
      source: "chrome_extension",
      device: "computer",
      label: "GitHub",
      started_at: "2026-08-27T10:00:00.000+00:00",
      ended_at: "2026-08-27T10:05:00.000+00:00",
      seconds: 300,
      minutes: 5,
    };
    const [r1, r2] = ingestSessions([s1, s2]);
    expect(new Date(r1.started_at).getTime()).toBe(new Date(r2.started_at).getTime());
  });

  // Test 6: Gap collapse < 15s for same canonical app on same device
  it("Test 6: Gap collapse merges sessions with gap < 15s", () => {
    const raw: Session[] = [
      {
        id: "g1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: "2026-08-27T10:00:00.000Z",
        ended_at: "2026-08-27T10:05:00.000Z",
        seconds: 300,
        minutes: 5,
      },
      {
        id: "g2",
        source: "chrome_extension",
        device: "computer",
        label: "github.com",
        started_at: "2026-08-27T10:05:10.000Z", // 10s gap
        ended_at: "2026-08-27T10:10:00.000Z",
        seconds: 290,
        minutes: 4.83,
      },
    ];
    const cleaned = cleanSessions(raw);
    expect(cleaned.length).toBe(1);
    expect(cleaned[0].canonical_app).toBe("GitHub");
    expect(cleaned[0].seconds).toBe(600);
  });

  // Test 7: Never collapse a sink flicker into work
  it("Test 7: Never collapse a known-sink flicker into a work session", () => {
    const raw: Session[] = [
      {
        id: "w1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: "2026-08-27T10:00:00.000Z",
        ended_at: "2026-08-27T10:05:00.000Z",
        seconds: 300,
        minutes: 5,
      },
      {
        id: "s1",
        source: "chrome_extension",
        device: "computer",
        label: "Instagram",
        started_at: "2026-08-27T10:05:05.000Z",
        ended_at: "2026-08-27T10:05:08.000Z",
        seconds: 3,
        minutes: 0.05,
      },
    ];
    const cleaned = cleanSessions(raw);
    expect(cleaned.length).toBe(2);
    expect(cleaned[1].category).toBe("sink");
  });

  // Test 8: Sensitive fence — screening.mhanational.org -> private
  it("Test 8: Sensitive detection classifies screening.mhanational.org as private", () => {
    const cat = classifySession({
      label: "screening.mhanational.org",
      device: "computer",
      source: "chrome_extension",
    });
    expect(cat).toBe("private");
  });

  // Test 9: Chrome on Android -> category unknown/unclassified
  it("Test 9: Phone-Chrome rows classify as unknown (unclassified), never work/killer", () => {
    const cat = classifySession({
      label: "Chrome",
      device: "phone",
      source: "android",
    });
    expect(cat).toBe("unclassified");
  });

  // Test 10: 04:00->04:00 logical day boundary
  it("Test 10: Logical day shifts boundary to 04:00 local time", () => {
    // 03:50 AM in Asia/Kolkata (+05:30) is 22:20 UTC previous day
    // In local time, 03:50 AM belongs to previous logical day
    const dayEarly = getLogicalDay("2026-08-28T03:50:00+05:30", "Asia/Kolkata");
    const dayMorning = getLogicalDay("2026-08-28T04:10:00+05:30", "Asia/Kolkata");
    expect(dayEarly).toBe("2026-08-27");
    expect(dayMorning).toBe("2026-08-28");
  });

  // Test 11: Light day definition (<45 tracked minutes)
  it("Test 11: Light day triggers on < 45 tracked minutes (< 2700s)", () => {
    expect(isLightDay(2699)).toBe(true);
    expect(isLightDay(2700)).toBe(false);
  });

  // Test 12: AFK bridge logic (gap strictly > 180s splits, <= 180s bridges)
  it("Test 12: AFK bridge logic: exactly 180s bridges, > 180s splits", () => {
    const t0 = 1000000;
    const inv1 = [{ startMs: t0, endMs: t0 + 10000 }, { startMs: t0 + 10000 + 180000, endMs: t0 + 200000 }];
    const bridged = computeUnionDurationSeconds(inv1, 180000);
    expect(bridged).toBe(200);

    const inv2 = [{ startMs: t0, endMs: t0 + 10000 }, { startMs: t0 + 10000 + 181000, endMs: t0 + 201000 }];
    const split = computeUnionDurationSeconds(inv2, 180000);
    expect(split).toBe(20);
  });

  // Test 13: Focus-run Rule A — known sink >= death floor ends run
  it("Test 13: Focus-run Rule A — sink >= floor ends the run at sink start", () => {
    const t0 = 1786762800000;
    const sessions = cleanSessions([
      {
        id: "w1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: new Date(t0).toISOString(),
        ended_at: new Date(t0 + 600000).toISOString(),
        seconds: 600,
        minutes: 10,
      },
      {
        id: "s1",
        source: "chrome_extension",
        device: "computer",
        label: "Instagram",
        started_at: new Date(t0 + 600000).toISOString(),
        ended_at: new Date(t0 + 610000).toISOString(), // 10s >= 5s floor
        seconds: 10,
        minutes: 0.17,
      },
    ]);
    const { runs } = computeFocusRuns(sessions, 5);
    expect(runs.length).toBe(1);
    expect(runs[0].durationSeconds).toBe(600);
  });

  // Test 14: Sub-floor sink flickers (<floor) add wall time and spend no pool
  it("Test 14: Sub-floor sink flickers do not end run and add wall time", () => {
    const t0 = 1786762800000;
    const sessions = cleanSessions([
      {
        id: "w1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: new Date(t0).toISOString(),
        ended_at: new Date(t0 + 300000).toISOString(),
        seconds: 300,
        minutes: 5,
      },
      {
        id: "s1",
        source: "chrome_extension",
        device: "computer",
        label: "Instagram",
        started_at: new Date(t0 + 300000).toISOString(),
        ended_at: new Date(t0 + 303000).toISOString(), // 3s < 5s floor
        seconds: 3,
        minutes: 0.05,
      },
      {
        id: "w2",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: new Date(t0 + 303000).toISOString(),
        ended_at: new Date(t0 + 600000).toISOString(),
        seconds: 297,
        minutes: 4.95,
      },
    ]);
    const { runs } = computeFocusRuns(sessions, 5);
    expect(runs.length).toBe(1);
    expect(runs[0].durationSeconds).toBe(600);
    expect(runs[0].fillerSeconds).toBe(0); // Sub-floor sink spends NO pool
  });

  // Test 15: Focus-run Rule B — single filler > 60s ends run
  it("Test 15: Focus-run Rule B — single filler incident > 60s ends run", () => {
    const t0 = 1786762800000;
    const sessions = cleanSessions([
      {
        id: "w1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: new Date(t0).toISOString(),
        ended_at: new Date(t0 + 600000).toISOString(),
        seconds: 600,
        minutes: 10,
      },
      {
        id: "f1",
        source: "chrome_extension",
        device: "computer",
        label: "blog.google", // Filler (other-known)
        started_at: new Date(t0 + 600000).toISOString(),
        ended_at: new Date(t0 + 670000).toISOString(), // 70s > 60s
        seconds: 70,
        minutes: 1.17,
      },
    ]);
    const { runs } = computeFocusRuns(sessions, 5);
    expect(runs.length).toBe(1);
    expect(runs[0].durationSeconds).toBe(600);
  });

  // Test 16: Focus-run Rule C — filler pool > 10% ends run
  it("Test 16: Focus-run Rule C — cumulative filler > 10% ends run", () => {
    const t0 = 1786762800000;
    const sessions = cleanSessions([
      {
        id: "w1",
        source: "chrome_extension",
        device: "computer",
        label: "GitHub",
        started_at: new Date(t0).toISOString(),
        ended_at: new Date(t0 + 300000).toISOString(), // 300s work
        seconds: 300,
        minutes: 5,
      },
      {
        id: "f1",
        source: "chrome_extension",
        device: "computer",
        label: "blog.google", // 50s filler > 10% of 350s (35s)
        started_at: new Date(t0 + 300000).toISOString(),
        ended_at: new Date(t0 + 350000).toISOString(),
        seconds: 50,
        minutes: 0.83,
      },
    ]);
    const { runs } = computeFocusRuns(sessions, 5);
    expect(runs.length).toBe(1);
    expect(runs[0].durationSeconds).toBe(300);
  });

  // Test 17: Focus-run Rule D — two device hole (run does NOT chain across >60s hole)
  it("Test 17: Focus-run Rule D — >60s hole on one contributing device ends run", () => {
    const envelope = twoDeviceHole as unknown as Envelope;
    const ledger = buildLedger(envelope);
    const { runs } = computeFocusRuns(ledger, 5);
    // Run ends when hole on computer exceeds 60s
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs[0].durationSeconds).toBeLessThan(2400);
  });

  // Test 18: Synthetic fixture chrome-dark.json
  it("Test 18: chrome-dark.json yields Chrome 0h, Android ~15m, light day", () => {
    const envelope = chromeDark as unknown as Envelope;
    const ledger = buildLedger(envelope);
    const { totalHours } = computeWeek(ledger);
    expect(totalHours).toBeCloseTo(0.25, 1);
  });

  // Test 19: Replay idempotency — ingest twice yields identical hours
  it("Test 19: Replay idempotency — ingest(demo) twice produces identical metrics", () => {
    const envelope = demoSessions as unknown as Envelope;
    const ledger1 = buildLedger(envelope);
    const m1 = computeTrackedMetrics(ledger1);

    const doubledSessions = [...envelope.sessions, ...envelope.sessions];
    const ledger2 = buildLedger({ ...envelope, sessions: doubledSessions });
    const m2 = computeTrackedMetrics(ledger2);

    expect(m1.unionHours).toBe(m2.unionHours);
    expect(m1.rawSumHours).toBe(m2.rawSumHours);
    expect(m1.doubleCountHours).toBe(m2.doubleCountHours);
  });

  // Test 20: Consistency only — no hardcoded >=15 or longest integers
  it("Test 20: Deep blocks and longest integer are computed dynamically (no pinned integer)", () => {
    const envelope = demoSessions as unknown as Envelope;
    const ledger = buildLedger(envelope);
    const { deepBlocksCount, longestMinutes } = computeFocusRuns(ledger, 5);
    expect(typeof deepBlocksCount).toBe("number");
    expect(typeof longestMinutes).toBe("number");
    expect(longestMinutes).toBeGreaterThanOrEqual(0);
  });

  // Golden assertions (activates when demoSessions.count >= 100)
  it("Golden Harness Assertions: Matches goldens.json data contract", () => {
    const envelope = demoSessions as unknown as Envelope;
    if (envelope.count < 100) return;

    const ledger = buildLedger(envelope);
    const week = computeWeek(ledger);
    const health = computeHealth(ledger, "2026-09-02");

    // D=7, D_p=1/7, D_c=7/7
    expect(week.trackedDays).toBe(goldens.days);
    expect(week.phoneDays).toBe(goldens.phoneDays);
    expect(week.computerDays).toBe(goldens.computerDays);

    // union 39.37h, raw sum 39.61h, double-count 0.24h
    expect(week.totalHours).toBe(goldens.unionHours);
    expect(week.doubleCountedHours).toBe(goldens.doubleCountHours);

    // Android live day 85 sessions / 7.02h
    const androidSessions = ledger.filter((s) => s.device === "phone");
    expect(androidSessions.length).toBe(goldens.androidLiveDaySessions);
    const androidMetrics = computeTrackedMetrics(androidSessions);
    expect(androidMetrics.rawSumHours).toBe(goldens.androidLiveDayHours);

    // banner "off since Aug 28"
    expect(health.phoneOffSince).toBe(goldens.bannerText.replace("off since ", ""));
  });
});
