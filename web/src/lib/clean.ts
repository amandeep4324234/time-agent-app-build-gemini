import { Category, EnrichedSession, Session } from "./types";
import { classifySession } from "./classify";

export const ALIAS_MAP: Record<string, string> = {
  "instagram.com": "Instagram",
  "ig": "Instagram",
  "Instagram": "Instagram",
  "youtube.com": "YouTube",
  "YouTube": "YouTube",
  "discord.com": "Discord",
  "Discord": "Discord",
  "reddit.com": "Reddit",
  "Reddit": "Reddit",
  "grok.com": "Grok",
  "assets.grok.com": "Grok",
  "Grok": "Grok",
  "chatgpt.com": "ChatGPT",
  "ChatGPT": "ChatGPT",
  "github.com": "GitHub",
  "GitHub": "GitHub",
  "lichess.org": "Lichess",
  "Lichess": "Lichess",
  "chess.com": "Chess.com",
};

export function getCanonicalApp(label: string): string {
  if (ALIAS_MAP[label]) return ALIAS_MAP[label];
  const trimmed = label.trim();
  if (ALIAS_MAP[trimmed]) return ALIAS_MAP[trimmed];
  return trimmed;
}

export function computeSessionKind(seconds: number): "flicker" | "glance" | "block" {
  if (seconds < 5) return "flicker";
  if (seconds <= 120) return "glance";
  return "block";
}

export function isSystemSession(label: string): boolean {
  const norm = label.toLowerCase();
  return (
    norm === "system ui kits" ||
    norm === "google play store" ||
    norm.includes("systemui") ||
    norm.includes("com.google.android.gms")
  );
}

/**
 * Enriches and cleans sessions:
 * 1. Alias merge -> canonical_app
 * 2. Recompute session_kind (flicker <5s, glance 5-120s, block >=120s)
 * 3. System rows -> category system
 * 4. Classify category
 * 5. Gap collapse (<15s, same canonical_app, same device, never sink flickers into work)
 */
export function cleanSessions(
  rawSessions: Session[],
  userPins?: { work?: string[]; killers?: string[] },
  userOverrides?: Record<string, Category>
): EnrichedSession[] {
  // Sort in ascending order by start time
  const sorted = [...rawSessions].sort((a, b) => {
    return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
  });

  const enriched: EnrichedSession[] = sorted.map((s) => {
    const startMs = new Date(s.started_at).getTime();
    const endMs = s.ended_at ? new Date(s.ended_at).getTime() : startMs + s.seconds * 1000;
    const kind = computeSessionKind(s.seconds);
    const canonical = getCanonicalApp(s.label);
    let cat = classifySession(s, userPins, userOverrides);

    if (isSystemSession(s.label)) {
      cat = "system";
    }

    return {
      ...s,
      canonical_app: canonical,
      category: cat,
      session_kind: kind,
      started_at_ms: startMs,
      ended_at_ms: endMs,
    };
  });

  // Gap collapse pass:
  // Same canonical_app, same device, gap < 15s -> merge.
  // Never collapse a known-sink flicker into a neighboring work session.
  const collapsed: EnrichedSession[] = [];
  for (let i = 0; i < enriched.length; i++) {
    const current = enriched[i];
    if (collapsed.length === 0) {
      collapsed.push({ ...current });
      continue;
    }

    const prev = collapsed[collapsed.length - 1];
    const gapMs = current.started_at_ms - prev.ended_at_ms;
    const gapSeconds = gapMs / 1000;

    const sameApp = prev.canonical_app === current.canonical_app;
    const sameDevice = prev.device === current.device;

    const isSinkFlicker = current.category === "sink" && current.session_kind === "flicker";
    const isPrevWork = prev.category === "work";

    if (sameApp && sameDevice && gapSeconds >= 0 && gapSeconds < 15 && !(isSinkFlicker && isPrevWork)) {
      // Merge into prev
      prev.ended_at_ms = Math.max(prev.ended_at_ms, current.ended_at_ms);
      prev.ended_at = new Date(prev.ended_at_ms).toISOString();
      prev.seconds = Math.round((prev.ended_at_ms - prev.started_at_ms) / 1000);
      prev.minutes = parseFloat((prev.seconds / 60).toFixed(2));
      prev.session_kind = computeSessionKind(prev.seconds);
    } else {
      collapsed.push({ ...current });
    }
  }

  return collapsed;
}
