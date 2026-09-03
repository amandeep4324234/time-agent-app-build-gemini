import { EnrichedSession, MixDistribution } from "./types";
import { isTrackedDenominator } from "./classify";

/**
 * Computes category shares of tracked time and confession badges:
 * work / sink / games / other-known / unclassified.
 * System and private are excluded from the denominator.
 */
export function computeMix(
  sessions: EnrichedSession[],
  isSustainedUnclassified = false
): MixDistribution {
  let workSec = 0;
  let sinkSec = 0;
  let gamesSec = 0;
  let otherSec = 0;
  let unclassifiedSec = 0;
  let privateSec = 0;

  for (const s of sessions) {
    if (s.category === "private") {
      privateSec += s.seconds;
      continue;
    }

    if (!isTrackedDenominator(s)) {
      continue;
    }

    switch (s.category) {
      case "work":
        workSec += s.seconds;
        break;
      case "sink":
        sinkSec += s.seconds;
        break;
      case "games":
        gamesSec += s.seconds;
        break;
      case "other-known":
        otherSec += s.seconds;
        break;
      case "unclassified":
      default:
        unclassifiedSec += s.seconds;
        break;
    }
  }

  const denominatorSec = workSec + sinkSec + gamesSec + otherSec + unclassifiedSec;

  const work = denominatorSec > 0 ? parseFloat((workSec / denominatorSec).toFixed(4)) : 0;
  const sink = denominatorSec > 0 ? parseFloat((sinkSec / denominatorSec).toFixed(4)) : 0;
  const games = denominatorSec > 0 ? parseFloat((gamesSec / denominatorSec).toFixed(4)) : 0;
  const other = denominatorSec > 0 ? parseFloat((otherSec / denominatorSec).toFixed(4)) : 0;
  const unclassified = denominatorSec > 0 ? parseFloat((unclassifiedSec / denominatorSec).toFixed(4)) : 0;

  const unclassifiedPercent = denominatorSec > 0 ? Math.round((unclassifiedSec / denominatorSec) * 100) : 0;
  const privateHours = parseFloat((privateSec / 3600).toFixed(2));
  const gamesHeavy = games >= 0.3;
  const totalHours = parseFloat((denominatorSec / 3600).toFixed(2));

  const workPercent = Math.round(work * 100);
  const sinkPercent = Math.round(sink * 100);
  const gamesPercent = Math.round(games * 100);
  const otherPercent = Math.round(other * 100);

  return {
    work,
    sink,
    games,
    other,
    unclassified,
    privateHours,
    unclassifiedPercent,
    isSustainedUnclassified,
    sustainedUnclassifiedAction: isSustainedUnclassified,
    gamesHeavy,
    totalHours,
    shares: {
      workPercent,
      sinkPercent,
      gamesPercent,
      otherPercent,
      unclassifiedPercent,
    },
  };
}
