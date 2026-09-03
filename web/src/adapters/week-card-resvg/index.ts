import { WeekCardModel } from "../../lib/types";

/**
 * Server-side week-card SVG generator.
 * Creates clean 1080x1350 SVG artifact according to Section 6.8 C22.
 */
export function generateWeekCardSvg(card: WeekCardModel): string {
  const watermark = card.watermark
    ? `<text x="984" y="1254" font-family="'JetBrains Mono', monospace" font-size="24" fill="#5F6779" text-anchor="end">Timeframe</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0A0C10" />
  <rect x="48" y="48" width="984" height="1254" fill="none" stroke="#232833" stroke-width="2" rx="16" />

  <!-- Device Label -->
  <text x="96" y="140" font-family="Inter, sans-serif" font-size="28" font-weight="600" fill="#B7BECC" letter-spacing="0.02em">${card.label}</text>

  <!-- Hero Total Focus -->
  <text x="96" y="270" font-family="'Instrument Serif', serif" font-size="96" fill="#F4F6FA">${card.focusHours.toFixed(1)}h</text>
  <text x="96" y="320" font-family="Inter, sans-serif" font-size="24" fill="#9AA3B5">focus-set time this week</text>

  <!-- Stat Rows -->
  <g transform="translate(96, 440)">
    <text x="0" y="0" font-family="Inter, sans-serif" font-size="24" fill="#9AA3B5">Focus-set time</text>
    <text x="0" y="45" font-family="'JetBrains Mono', monospace" font-size="48" font-weight="500" fill="#F4F6FA">${card.focusHours.toFixed(2)}h</text>

    <text x="0" y="130" font-family="Inter, sans-serif" font-size="24" fill="#9AA3B5">Sink</text>
    <text x="0" y="175" font-family="'JetBrains Mono', monospace" font-size="48" font-weight="500" fill="#F4F6FA">${card.sinkHours.toFixed(2)}h</text>

    <text x="0" y="260" font-family="Inter, sans-serif" font-size="24" fill="#9AA3B5">Blocks ≥15 min</text>
    <text x="0" y="305" font-family="'JetBrains Mono', monospace" font-size="48" font-weight="500" fill="#F4F6FA">${card.blocksCount}</text>

    <text x="0" y="390" font-family="Inter, sans-serif" font-size="24" fill="#9AA3B5">Longest</text>
    <text x="0" y="435" font-family="'JetBrains Mono', monospace" font-size="48" font-weight="500" fill="#F4F6FA">${card.longestMinutes} min</text>
  </g>

  <!-- Footer (Pinned verbatim) -->
  <text x="96" y="1220" font-family="'JetBrains Mono', monospace" font-size="24" fill="#B7BECC">${card.footer}</text>

  <!-- Watermark -->
  ${watermark}
</svg>`;
}
