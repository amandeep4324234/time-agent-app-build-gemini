export type Category = 
  | "work" 
  | "sink" 
  | "games" 
  | "other-known" 
  | "unclassified" 
  | "private" 
  | "system";

export interface Session {
  id: string;
  source: "chrome_extension" | "android";
  device: "computer" | "phone";
  label: string;
  started_at: string;
  ended_at: string | null;
  seconds: number;
  minutes: number;
  timezone?: string;
  session_kind?: "flicker" | "glance" | "block" | null;
}

export interface Envelope {
  schema: string;
  exported_at: string;
  count: number;
  sessions: Session[];
}

export interface EnrichedSession extends Session {
  canonical_app: string;
  category: Category;
  session_kind: "flicker" | "glance" | "block";
  user_override?: Category | null;
  started_at_ms: number;
  ended_at_ms: number;
}

export interface Entitlement {
  aid: string | null;
  tier: "free" | "pro";
  plan: "monthly" | "annual" | "skin" | null;
  src: string | null;
  ref: string | null;
  skin: "classic" | null;
  valid_until: string | null;
  jti: string | null;
}

export interface Grant {
  aid: string;
  tier: "free" | "pro";
  plan: "monthly" | "annual" | "skin";
  src: string;
  ref: string;
  skin: "classic" | null;
  valid_until: string | null;
  jti: string;
}

export interface WeekCardModel {
  label: string;
  focusSharePercent: number;
  focusHours: number;
  sinkHours: number;
  blocksCount: number;
  longestMinutes: number;
  footer: string;
  clean: boolean;
  watermark: boolean;
}

export interface LogEntry {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
}

export interface EncryptedSyncRow {
  pair_id: string;
  seq: number;
  nonce: string;
  ciphertext: string;
  updated_at: string;
  expires_at: string;
}

export interface FocusRun {
  startMs: number;
  endMs: number;
  durationSeconds: number;
  fillerSeconds: number;
  ended_by?: "sink" | "hole" | "day-end" | "open";
  killerApp?: string;
  apps?: string[];
}

export interface TopSinkItem {
  label: string;
  name: string;
  unionHours: number;
  hours: number;
  visitCount: number;
  count: number;
  medianMinutes: number;
  isPrivate?: boolean;
}

export interface MixDistribution {
  work: number;
  sink: number;
  games: number;
  other: number;
  unclassified: number;
  privateHours: number;
  unclassifiedPercent: number;
  isSustainedUnclassified: boolean;
  gamesHeavy: boolean;
  totalHours: number;
  shares: {
    workPercent: number;
    sinkPercent: number;
    gamesPercent: number;
    otherPercent: number;
    unclassifiedPercent: number;
  };
  sustainedUnclassifiedAction?: boolean;
}

export interface SourceHoursSummary {
  phoneHours: number | null;
  computerHours: number | null;
  phoneDark?: boolean;
  phoneOffSince?: string | null;
  computerDark?: boolean;
  computerOffSince?: string | null;
  phoneLastWriteAge?: string | null;
  computerLastWriteAge?: string | null;
  lastWritePhone?: string | null;
  lastWriteComputer?: string | null;
}

export interface DayMetrics {
  date: string;
  focusHours: number;
  sinkHours: number;
  blocksCount: number;
  longestMinutes: number;
  lightDay: boolean;
  mix: MixDistribution;
  topSinks: TopSinkItem[];
  sources: SourceHoursSummary;
  heatmap: number[][];
  lab?: {
    rawSumHours: number;
    unionHours: number;
    doubleCountHours: number;
    runCount: number;
  };
}

export interface WeekMetrics {
  totalHours: number;
  focusHours: number;
  sinkHours: number;
  blocksCount: number;
  longestMinutes: number;
  trackedDays: number;
  phoneDays: number;
  computerDays: number;
  unclassifiedPercent: number;
  doubleCountedHours: number;
  footer: string;
}
