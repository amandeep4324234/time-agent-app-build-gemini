import { Category, Session } from "./types";
import seedMapData from "../../data/seed-map.json";

export const SEED_WORK = [
  "Grok",
  "ChatGPT",
  "GitHub",
  "localhost",
  "AWS",
  "Lovable",
  "gemini",
  "aistudio",
  "qwen",
  "agentrouter",
  "vercel",
  "apify",
  "21st.dev"
] as const;

export const SEED_KILLERS = [
  "Instagram",
  "YouTube",
  "Discord",
  "Reddit"
] as const;

const typedSeedMap = seedMapData as Record<string, string>;

/**
 * Normalizes label/domain for classification matching.
 */
export function normalizeLabel(label: string): string {
  return label.trim();
}

/**
 * Sensitive detection = the seed map ONLY.
 * Any label whose mapped category is `private` in the seed map is private.
 * User override cannot remove seed-map private.
 */
export function isSensitiveInSeedMap(label: string): boolean {
  const norm = normalizeLabel(label);
  return typedSeedMap[norm] === "private" || norm === "screening.mhanational.org";
}

/**
 * Determines whether a label is chess/games.
 */
export function isChessOrGames(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes("chess") ||
    lower.includes("lichess") ||
    lower === "games"
  );
}

/**
 * Resolves category for a session with precedence:
 * user_override > user_pins > seed map > unknown.
 * Phone Chrome rows -> unknown.
 */
export function classifySession(
  session: Pick<Session, "label" | "device" | "source">,
  userPins?: { work?: string[]; killers?: string[] },
  userOverrides?: Record<string, Category>
): Category {
  const label = session.label;

  // Sensitive fence check first (seed map private is non-removable by user)
  if (isSensitiveInSeedMap(label)) {
    return "private";
  }

  // User override
  if (userOverrides && userOverrides[label]) {
    const override = userOverrides[label];
    if (["work", "sink", "games", "other-known"].includes(override)) {
      return override;
    }
  }

  // User pins
  if (userPins) {
    if (userPins.work && userPins.work.includes(label)) {
      return "work";
    }
    if (userPins.killers && userPins.killers.includes(label)) {
      return "sink";
    }
  }

  // Phone Chrome rows -> unknown
  if (session.device === "phone" && (label === "Chrome" || label.toLowerCase().includes("chrome"))) {
    return "unclassified";
  }

  // Default seeds check
  for (const w of SEED_WORK) {
    if (label.toLowerCase() === w.toLowerCase() || label.toLowerCase().includes(w.toLowerCase())) {
      return "work";
    }
  }

  for (const k of SEED_KILLERS) {
    if (label.toLowerCase() === k.toLowerCase() || label.toLowerCase().includes(k.toLowerCase())) {
      return "sink";
    }
  }

  // Chess/games default
  if (isChessOrGames(label)) {
    return "games";
  }

  // Seed map lookup
  if (typedSeedMap[label]) {
    const cat = typedSeedMap[label];
    if (cat === "private") return "private";
    if (cat === "work") return "work";
    if (cat === "sink") return "sink";
    if (cat === "games") return "games";
    if (cat === "system") return "system";
    if (cat === "other-known") return "other-known";
  }

  // Fallback to unknown -> unclassified
  return "unclassified";
}

/**
 * Tracked-time denominator:
 * Sum of non-flicker session seconds excluding system and private.
 */
export function isTrackedDenominator(session: {
  category: Category;
  session_kind: "flicker" | "glance" | "block";
}): boolean {
  if (session.session_kind === "flicker") return false;
  if (session.category === "system" || session.category === "private") return false;
  return true;
}
