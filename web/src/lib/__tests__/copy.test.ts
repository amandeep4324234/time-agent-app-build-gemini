import { describe, it, expect } from "vitest";
import { BANNED_PHRASES, COPY } from "../copy";
import { computeDay } from "../metrics";
import { buildWeekCardModel, computeWeek } from "../week";
import { buildLedger } from "../ingest";
import { Envelope } from "../types";
import demoSessions from "../../../data/demo-sessions.json";

function extractAllStrings(obj: unknown): string[] {
  const strings: string[] = [];
  function recurse(val: unknown) {
    if (typeof val === "string") {
      strings.push(val);
    } else if (typeof val === "function") {
      try {
        const res = (val as (...args: any[]) => any)("test", 1, 1, 1, "0.00");
        if (typeof res === "string") strings.push(res);
      } catch {
        // ignore
      }
    } else if (val && typeof val === "object") {
      for (const k of Object.keys(val)) {
        recurse((val as Record<string, unknown>)[k]);
      }
    }
  }
  recurse(obj);
  return strings;
}

describe("Copy Rule Tests & Banned Phrase Sweep (Tests 21–25)", () => {
  // Test 21: Banned-phrase sweep
  it("Test 21: Shipped copy contains 0 occurrences of banned phrases", () => {
    const allStrings = extractAllStrings(COPY);
    for (const str of allStrings) {
      const lower = str.toLowerCase();
      for (const banned of BANNED_PHRASES) {
        expect(lower.includes(banned.toLowerCase()), `String contains banned phrase '${banned}': "${str}"`).toBe(false);
      }
    }
  });

  // Test 22: Required phrases present
  it("Test 22: Required phrases 'focus-set time' and '% of tracked time' are present", () => {
    const allStrings = extractAllStrings(COPY).join(" ");
    expect(allStrings.includes("focus-set time") || allStrings.includes("Focus-set time")).toBe(true);
    expect(allStrings.includes("% of tracked time")).toBe(true);
  });

  // Test 23: Footer template matches verbatim
  it("Test 23: Footer template matches verbatim specification", () => {
    const formatted = COPY.footer.format(7, 1, 7, 19, "0.24");
    expect(formatted).toBe("Tracked 7 days · phone up 1/7 · computer up 7/7 · unclassified 19% · double-counted 0.24h");
  });

  // Test 24: Week-card never leaks sensitive / mental health URLs
  it("Test 24: Week-card output structurally fences private domains", () => {
    const ledger = buildLedger(demoSessions as unknown as Envelope);
    const week = computeWeek(ledger);
    const card = buildWeekCardModel(week, "merged export", false);

    expect(card.footer).not.toContain("screening.mhanational.org");
    expect(card.label).not.toContain("screening.mhanational.org");
    expect(card.footer).not.toContain("heartitout.in");
  });

  // Test 25: Closed metrics key set
  it("Test 25: Metrics key set is strictly closed to the seven numbers + date + lightDay + lab", () => {
    const ledger = buildLedger(demoSessions as unknown as Envelope);
    const day = computeDay("2026-08-27", ledger);

    const allowedKeys = new Set([
      "date",
      "focusHours",
      "sinkHours",
      "blocksCount",
      "longestMinutes",
      "lightDay",
      "mix",
      "topSinks",
      "sources",
      "heatmap",
      "lab",
    ]);

    const actualKeys = Object.keys(day);
    for (const k of actualKeys) {
      expect(allowedKeys.has(k), `Unexpected key '${k}' in DayMetrics`).toBe(true);
    }
    expect(actualKeys.length).toBe(allowedKeys.size);
  });
});
