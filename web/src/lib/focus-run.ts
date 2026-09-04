import { EnrichedSession, FocusRun } from "./types";

/**
 * Focus-run (one rule) — verbatim implementation of Section 4.5.
 *
 * A known sink >= death floor (default 5s, user 3/5/10) ends the run.
 * Everything else that is not work is filler (gap with no row, system, unknown,
 * browser_generic, games, other non-work): it may sit inside the run only while
 * each filler incident is <=60s and all filler <=10% of the finished run.
 * Longer filler ends the run.
 * The run also requires every contributing device to be work, filler, or a <=60s gap
 * at that instant. A >60s hole on one device ends the run even if the other device is still busy.
 * Run length = wall-clock of that interval. Sub-floor sink flickers do not end the run;
 * they still add wall time; they do not spend the 10% pool.
 */
export function computeFocusRuns(
  sessions: EnrichedSession[],
  deathFloorSeconds = 5
): { runs: FocusRun[]; deepBlocksCount: number; longestMinutes: number } {
  const sorted = [...sessions].sort((a, b) => a.started_at_ms - b.started_at_ms);
  const runs: FocusRun[] = [];

  let i = 0;
  while (i < sorted.length) {
    if (sorted[i].category !== "work") {
      i++;
      continue;
    }

    // A run STARTS only at a work interval
    const runStart = sorted[i].started_at_ms;
    let runEnd = sorted[i].ended_at_ms;
    let fillerMs = 0;
    const contributingDevices = new Set<string>([sorted[i].device]);
    const lastDeviceActivity: Record<string, number> = {
      [sorted[i].device]: sorted[i].ended_at_ms,
    };

    let j = i + 1;
    let runTerminatedAt: number | null = null;

    while (j < sorted.length) {
      const s = sorted[j];

      // If the session starts after current runEnd + 60s, a gap > 60s occurred
      const overallGapSeconds = (s.started_at_ms - runEnd) / 1000;
      if (overallGapSeconds > 60) {
        runTerminatedAt = runEnd;
        break;
      }

      // Check per-device hole rule (Rule D):
      // A >60s hole on any contributing device ends the run
      let deviceHoleEnd: number | null = null;
      for (const dev of contributingDevices) {
        const lastDevEnd = lastDeviceActivity[dev];
        if (s.started_at_ms - lastDevEnd > 60_000) {
          deviceHoleEnd = lastDevEnd + 60_000;
          break;
        }
      }
      if (deviceHoleEnd !== null && deviceHoleEnd < s.started_at_ms) {
        runTerminatedAt = deviceHoleEnd;
        break;
      }

      contributingDevices.add(s.device);

      if (s.category === "work") {
        // Wall-clock head is monotonic — never moves backward on a contained overlap
        runEnd = Math.max(runEnd, s.ended_at_ms);
        lastDeviceActivity[s.device] = Math.max(
          lastDeviceActivity[s.device] || 0,
          s.ended_at_ms
        );
        j++;
      } else if (s.category === "sink") {
        if (s.seconds >= deathFloorSeconds) {
          // Rule A: sink >= floor ends the run at sink start
          runTerminatedAt = s.started_at_ms;
          break;
        } else {
          // Sub-floor sink flicker: adds wall time, spends NO pool
          runEnd = Math.max(runEnd, s.ended_at_ms);
          lastDeviceActivity[s.device] = Math.max(
            lastDeviceActivity[s.device] || 0,
            s.ended_at_ms
          );
          j++;
        }
      } else {
        // Filler (system, unknown, games, other non-work)
        const gapMs = Math.max(0, s.started_at_ms - runEnd);
        if (gapMs > 60_000) {
          runTerminatedAt = runEnd;
          break;
        }

        if (s.seconds > 60) {
          // Rule B: single filler incident > 60s ends the run
          runTerminatedAt = s.started_at_ms;
          break;
        }

        const sessionDurationMs = s.ended_at_ms - s.started_at_ms;
        const candidatePoolMs = fillerMs + gapMs + sessionDurationMs;
        const candidateRunLengthMs = s.ended_at_ms - runStart;

        // Rule C: candidatePool > 0.10 * (s.ended_at - runStart)
        if (candidatePoolMs > 0.1 * candidateRunLengthMs) {
          runTerminatedAt = s.started_at_ms;
          break;
        }

        fillerMs = candidatePoolMs;
        runEnd = Math.max(runEnd, s.ended_at_ms);
        lastDeviceActivity[s.device] = Math.max(
          lastDeviceActivity[s.device] || 0,
          s.ended_at_ms
        );
        j++;
      }
    }

    const finalEnd = runTerminatedAt !== null ? runTerminatedAt : runEnd;
    const durationSeconds = Math.max(0, Math.round((finalEnd - runStart) / 1000));

    if (durationSeconds > 0) {
      runs.push({
        startMs: runStart,
        endMs: finalEnd,
        durationSeconds,
        fillerSeconds: Math.round(fillerMs / 1000),
      });
    }

    // Advance i past this run
    let nextI = i + 1;
    if (runTerminatedAt !== null) {
      // Resume scanning at first session starting at or after finalEnd
      while (nextI < sorted.length && sorted[nextI].started_at_ms < finalEnd) {
        nextI++;
      }
    } else {
      nextI = Math.max(i + 1, j);
    }
    i = Math.max(i + 1, nextI);
  }

  const deepBlocks = runs.filter((r) => r.durationSeconds >= 15 * 60);
  const longestSeconds = runs.reduce((max, r) => Math.max(max, r.durationSeconds), 0);
  const longestMinutes = Math.round(longestSeconds / 60);

  return {
    runs,
    deepBlocksCount: deepBlocks.length,
    longestMinutes,
  };
}
