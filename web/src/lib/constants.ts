/**
 * Design Tokens and Feature Configuration
 * Authority: TIMEFRAME-UI-REDESIGN.md
 */

// Feature Dormancy Policy (§2.1)
export const CREATURE_ENABLED = false;

// Visual Tokens (§4.1)
export const TOKENS = {
  bg: "#0D1117",
  surface: "#141A22",
  surfaceHover: "#1D2530",
  surfaceOverlay: "#202A36",
  border: "#303B49",
  text: "#EDF1F5",
  textSecondary: "#B0BBC9",
  textMuted: "#94A1B2",
  focus: "#E4B45F",
  focusTint: "#30291D",
  sink: "#F28D87",
  sinkTint: "#342224",
  games: "#B3BBC7",
  other: "#8795A8",
  unclassified: "#627086",
  selection: "#E7EEF7",
  radiusPanel: "10px",
  radiusControl: "6px",
  radiusChart: "3px",
  durationFast: "120ms",
  durationNormal: "160ms",
  durationLayout: "200ms",
  ease: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

// Midnight Studio Design Tokens (TIMEFRAME-UI-REDESIGN.md v4.1 §2.1)
export const MIDNIGHT_TOKENS = {
  background: "#0B0E14",
  sidebar: "#0E121B",
  card: "#141A25",
  cardRaised: "#1A2230",
  cardHover: "#1F2939",
  border: "#2B374B",
  borderStrong: "#53637D",
  text: "#F2F5FB",
  textSecondary: "#B8C4D8",
  textMuted: "#96A5BD",
  focus: "#AAA9FF",
  focusEdge: "#D0CEFF",
  focusSecondary: "#7CDCE5",
  sink: "#EE9DAA",
  games: "#D9BE87",
  other: "#92A6C1",
  unclassified: "#64748B",
  selection: "#E3EAFF",
  success: "#90D2BC",
  radiusCard: "18px",
  radiusControl: "10px",
  radiusSegment: "6px",
  shadowCard: "0 10px 28px rgba(0,0,0,.16)",
  motionFast: "120ms",
  motionNormal: "180ms",
  motionLayout: "240ms",
  ease: "cubic-bezier(.2,.8,.2,1)",
} as const;

// Heatmap neutral intensity steps (§12)
export const HEATMAP_STEPS = {
  under1h: "#48576B",
  h1to3: "#65788F",
  h3to6: "#879BB2",
  over6h: "#B0C0D1",
  zero: "#1D2530",
  noData: "transparent",
} as const;
