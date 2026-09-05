/**
 * AI Reflection Service
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §4, §4.1–§4.4
 * 
 * Generates an original 12–26 word editorial observation crunched from
 * deterministic facts and user intentions. Supports Witty, Straight facts, and Gentle tones.
 * Includes "Why this?" factual evidence and provenance.
 * Invalidates immediately on correction revision changes.
 */

import { SafeEffectiveDayResult } from "./effective-adapter";
import { Category } from "./types";

export type ReflectionTone = "witty" | "straight" | "gentle";

export interface CandidateFact {
  id: string;
  kind: "block_overlap" | "goal_contrast" | "quick_checks" | "blocks_reviewed" | "focus_volume";
  summary: string;
  sampleCount: number;
  period: string;
  revisionId: string;
  values: Record<string, string | number>;
  applicableIntention?: string;
}

export interface ReflectionResult {
  text: string;
  tone: ReflectionTone;
  angle: string;
  supportingFactIds: string[];
  facts: CandidateFact[];
  evidenceExplanation: string;
  revisionId: string;
  isLocalFallback: boolean;
  generatedAtUtc: string;
}

/**
 * Build deterministic candidate facts from effective day data and user goals.
 */
export function buildCandidateFacts(
  dayData: SafeEffectiveDayResult,
  goalHours?: number | null,
  revisionId: string = dayData.revisionId
): CandidateFact[] {
  const facts: CandidateFact[] = [];
  const { metrics, segments, date } = dayData;

  // 1. Fact: Block sink overlap (e.g. 45-min block with Instagram overlap)
  for (const seg of segments.focusBlocks) {
    if (seg.sinkSeconds >= 120) {
      const sinkMin = Math.round(seg.sinkSeconds / 60);
      const plannedMin = seg.plannedSeconds ? Math.round(seg.plannedSeconds / 60) : Math.round(seg.elapsedSeconds / 60);
      
      // Find top sink app inside block
      const blockSlices = dayData.effectiveSlices.filter(
        (s) => s.associatedBlockId === seg.id && s.effectiveCategory === "sink" && !s.isExcluded
      );
      const topApp = blockSlices.length > 0 ? blockSlices[0].label : "entertainment apps";

      facts.push({
        id: `fact-block-sink-${seg.id}`,
        kind: "block_overlap",
        summary: `Planned ${plannedMin}-minute block had ${sinkMin} minutes in ${topApp}`,
        sampleCount: blockSlices.length,
        period: date,
        revisionId,
        values: {
          plannedMinutes: plannedMin,
          sinkMinutes: sinkMin,
          appName: topApp,
          blockTitle: seg.title,
        },
        applicableIntention: `Planned ${plannedMin}m focus block: "${seg.title}"`,
      });
    }
  }

  // 2. Fact: Goal contrast (if user has an explicit goal) (§4.1, §4.3)
  if (goalHours && metrics.focus.value !== null) {
    const goalMinutes = Math.round(goalHours * 60);
    const actualWorkMinutes = Math.round(metrics.focus.value / 60);
    const isInProgress = Date.now() < dayData.dayEndMs;
    const remainingMinutes = Math.max(0, goalMinutes - actualWorkMinutes);

    facts.push({
      id: "fact-goal-contrast",
      kind: "goal_contrast",
      summary: isInProgress
        ? `Target ${goalHours}h Work; ${actualWorkMinutes}m recorded, ${remainingMinutes}m remaining`
        : `Target ${goalHours}h Work; recorded ${actualWorkMinutes}m`,
      sampleCount: 1,
      period: date,
      revisionId,
      values: {
        goalMinutes,
        actualMinutes: actualWorkMinutes,
        isInProgress: isInProgress ? 1 : 0,
        remainingMinutes,
      },
      applicableIntention: `Daily focus goal of ${goalHours}h`,
    });
  }

  // 3. Fact: Quick checks (< 1 min sessions)
  const quickSessions = dayData.effectiveSlices.filter(
    (s) => s.sliceSeconds < 60 && !s.isExcluded
  );
  if (quickSessions.length >= 8) {
    facts.push({
      id: "fact-quick-checks",
      kind: "quick_checks",
      summary: `${quickSessions.length} recorded visits under one minute`,
      sampleCount: quickSessions.length,
      period: date,
      revisionId,
      values: {
        count: quickSessions.length,
      },
    });
  }

  // 4. Fact: Blocks reviewed
  if (metrics.focusBlocks.completedCount > 0) {
    facts.push({
      id: "fact-blocks-reviewed",
      kind: "blocks_reviewed",
      summary: `${metrics.focusBlocks.completedCount} completed blocks, ${metrics.focusBlocks.reviewedCount} reviewed`,
      sampleCount: metrics.focusBlocks.completedCount,
      period: date,
      revisionId,
      values: {
        completed: metrics.focusBlocks.completedCount,
        reviewed: metrics.focusBlocks.reviewedCount,
      },
      applicableIntention: "Intentional focus block tracking",
    });
  }

  // 5. Fact: Overall Work volume
  if (metrics.focus.value && metrics.focus.value >= 3600) {
    const hours = (metrics.focus.value / 3600).toFixed(1);
    facts.push({
      id: "fact-focus-volume",
      kind: "focus_volume",
      summary: `${hours} hours of approved Work recorded across devices`,
      sampleCount: dayData.effectiveSlices.filter((s) => s.effectiveCategory === "work").length,
      period: date,
      revisionId,
      values: { hours },
    });
  }

  return facts;
}

/**
 * Generate an observation line for the given tone and candidate facts.
 * Word count strictly constrained to 12–26 words (hard max 36 words).
 */
export function generateReflection(
  dayData: SafeEffectiveDayResult,
  tone: ReflectionTone = "witty",
  goalHours?: number | null,
  factIndexOffset: number = 0
): ReflectionResult {
  const revisionId = dayData.revisionId;
  const facts = buildCandidateFacts(dayData, goalHours, revisionId);

  if (facts.length === 0) {
    return {
      text: "No active activity recorded yet today. Start an intentional block whenever you are ready to begin.",
      tone,
      angle: "general_start",
      supportingFactIds: [],
      facts: [],
      evidenceExplanation: "Waiting for recorded activity or focus blocks on this day.",
      revisionId,
      isLocalFallback: true,
      generatedAtUtc: new Date().toISOString(),
    };
  }

  // Pick top candidate fact with rotation support
  const pickedFact = facts[factIndexOffset % facts.length];

  let text = "";
  let evidenceExplanation = "";

  if (pickedFact.kind === "block_overlap") {
    const planned = pickedFact.values.plannedMinutes;
    const sink = pickedFact.values.sinkMinutes;
    const app = pickedFact.values.appName;

    if (tone === "witty") {
      text = `You booked ${planned} minutes for work. ${app} booked ${sink} of them.`;
    } else if (tone === "straight") {
      text = `Your ${planned}-minute intentional block included ${sink} recorded minutes of ${app}.`;
    } else {
      text = `You put in a good effort on your ${planned}-minute block, with about ${sink} minutes in ${app}.`;
    }

    evidenceExplanation = `Planned active block of ${planned}m overlapped with ${sink}m of recorded ${app} activity. Evaluated against effective data revision ${revisionId}.`;
  } else if (pickedFact.kind === "goal_contrast") {
    const goalM = Number(pickedFact.values.goalMinutes);
    const actM = Number(pickedFact.values.actualMinutes);
    const goalH = (goalM / 60).toFixed(0);
    const isInProgress = Boolean(pickedFact.values.isInProgress);
    const remM = Number(pickedFact.values.remainingMinutes ?? Math.max(0, goalM - actM));

    if (actM >= goalM) {
      if (tone === "witty") {
        text = `Goal achieved with time to spare. ${actM} minutes logged toward your ${goalH}-hour target.`;
      } else if (tone === "straight") {
        text = `You have met your ${goalH}-hour target with ${actM} confirmed minutes of work today.`;
      } else {
        text = `Wonderful progress reaching your ${goalH}-hour goal today with ${actM} minutes logged.`;
      }
    } else if (isInProgress) {
      // In-progress day: do not predict failure or penalize early in the day (§4.1, §4.3)
      if (tone === "witty") {
        text = `${actM} minutes logged toward your ${goalH}-hour target today, with ${remM} minutes to go.`;
      } else if (tone === "straight") {
        text = `Recorded ${actM} minutes toward your ${goalH}-hour goal today, with ${remM} minutes remaining to target.`;
      } else {
        text = `You're at ${actM} minutes toward your ${goalH}-hour goal so far today. Steady steps build the day.`;
      }
    } else {
      // Completed day: factual or gentle contrast
      if (tone === "witty") {
        text = `The plan said ${goalH} hours. The log says ${actM} minutes. A modest plot twist.`;
      } else if (tone === "straight") {
        text = `Target was ${goalH} hours of work; day concluded with ${actM} confirmed minutes.`;
      } else {
        text = `You logged ${actM} minutes toward your ${goalH}-hour goal for the completed day.`;
      }
    }

    evidenceExplanation = isInProgress
      ? `Active in-progress day evaluated: ${actM}m recorded toward ${goalH}h goal, ${remM}m remaining.`
      : `User-set focus goal of ${goalH}h compared against ${actM} minutes of effective work time.`;
  } else if (pickedFact.kind === "quick_checks") {
    const count = pickedFact.values.count;

    if (tone === "witty") {
      text = `${count} quick checks today. Your app-switching got quite a workout.`;
    } else if (tone === "straight") {
      text = `Recorded ${count} visits under one minute across devices.`;
    } else {
      text = `You checked between tasks ${count} times today. Taking brief moments is completely normal.`;
    }

    evidenceExplanation = `${count} distinct sessions lasted under 60 seconds.`;
  } else if (pickedFact.kind === "blocks_reviewed") {
    const completed = pickedFact.values.completed;
    const reviewed = pickedFact.values.reviewed;

    if (tone === "witty") {
      text = `${completed} blocks completed and accounted for. A tidy, well-organized little dataset.`;
    } else if (tone === "straight") {
      text = `${completed} intentional focus blocks completed, with ${reviewed} fully reviewed and corrected.`;
    } else {
      text = `Great consistency with your intentional blocks today, completing ${completed} with thoughtful review.`;
    }

    evidenceExplanation = `${completed} intentional focus blocks completed on ${dayData.date}; ${reviewed} reviewed.`;
  } else {
    const hours = pickedFact.values.hours;
    if (tone === "witty") {
      text = `Over ${hours} hours of focused work recorded. The keyboard definitely felt that.`;
    } else if (tone === "straight") {
      text = `Total effective work duration reached ${hours} hours across all devices.`;
    } else {
      text = `You spent a solid ${hours} hours engaged in focused work across your devices today.`;
    }
    evidenceExplanation = `Effective cross-device Work union duration calculated at ${hours}h.`;
  }

  return {
    text,
    tone,
    angle: pickedFact.kind,
    supportingFactIds: [pickedFact.id],
    facts: [pickedFact],
    evidenceExplanation,
    revisionId,
    isLocalFallback: true, // Marked local summary fallback until external opt-in
    generatedAtUtc: new Date().toISOString(),
  };
}
