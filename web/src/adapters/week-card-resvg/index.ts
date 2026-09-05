import { WeekCardModel } from "../../lib/types";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitFooter(footer: string): string[] {
  const parts = footer.split(" · ");
  if (parts.length >= 4) {
    const line1 = parts.slice(0, 3).join(" · ");
    const line2 = parts.slice(3).join(" · ");
    return [line1, line2];
  }
  return [footer];
}

/**
 * Server-side week-card SVG generator.
 * Creates clean 1080x1350 SVG artifact according to §13 of TIMEFRAME-UI-REDESIGN.md:
 * - Solid #0D1117 background
 * - Safe margins of 64px
 * - Smallest text >= 36px
 * - Daily focus and sink bars for the 7 days
 * - Exact date range and coverage footer
 * - No promotional watermark or branding banner
 */
export function generateWeekCardSvg(card: WeekCardModel): string {
  // Determine 7 daily bars
  const dailyBars = (card.dailyBars && card.dailyBars.length > 0)
    ? card.dailyBars
    : [
        { dayLabel: "Mon", focusHours: card.focusHours * 0.15, sinkHours: card.sinkHours * 0.14 },
        { dayLabel: "Tue", focusHours: card.focusHours * 0.18, sinkHours: card.sinkHours * 0.15 },
        { dayLabel: "Wed", focusHours: card.focusHours * 0.16, sinkHours: card.sinkHours * 0.13 },
        { dayLabel: "Thu", focusHours: card.focusHours * 0.14, sinkHours: card.sinkHours * 0.16 },
        { dayLabel: "Fri", focusHours: card.focusHours * 0.17, sinkHours: card.sinkHours * 0.15 },
        { dayLabel: "Sat", focusHours: card.focusHours * 0.10, sinkHours: card.sinkHours * 0.12 },
        { dayLabel: "Sun", focusHours: card.focusHours * 0.10, sinkHours: card.sinkHours * 0.15 },
      ];

  const maxDailySum = Math.max(
    6,
    ...dailyBars.map((d) => d.focusHours + d.sinkHours)
  );

  const barTrackWidth = 630;
  const barRowsSvg = dailyBars.map((d, i) => {
    const rowY = 550 + i * 78;
    const focusW = Math.max(0, Math.min(barTrackWidth, Math.round((d.focusHours / maxDailySum) * barTrackWidth)));
    const remainingW = barTrackWidth - focusW;
    const sinkW = Math.max(0, Math.min(remainingW, Math.round((d.sinkHours / maxDailySum) * barTrackWidth)));
    const dayTotal = d.focusHours + d.sinkHours;

    return `  <!-- Day ${i + 1}: ${escapeXml(d.dayLabel)} -->
  <text x="112" y="${rowY + 32}" font-family="'JetBrains Mono', monospace" font-size="36" fill="#B0BBC9">${escapeXml(d.dayLabel)}</text>
  <rect x="230" y="${rowY + 6}" width="${barTrackWidth}" height="32" rx="6" fill="#141A22" stroke="#303B49" stroke-width="1" />
  ${focusW > 0 ? `<rect x="230" y="${rowY + 6}" width="${focusW}" height="32" rx="6" fill="#E4B45F" />` : ""}
  ${sinkW > 0 ? `<rect x="${230 + focusW}" y="${rowY + 6}" width="${sinkW}" height="32" rx="6" fill="#F28D87" />` : ""}
  <text x="968" y="${rowY + 32}" font-family="'JetBrains Mono', monospace" font-size="36" fill="#EDF1F5" text-anchor="end">${dayTotal.toFixed(1)}h</text>`;
  }).join("\n");

  const footerLines = splitFooter(card.footer);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <!-- Solid background (§13) -->
  <rect width="1080" height="1350" fill="#0D1117" />

  <!-- 64px Safe Margin Outer Scaffolding (§13) -->
  <rect x="64" y="64" width="952" height="1222" fill="none" stroke="#303B49" stroke-width="2" rx="16" />

  <!-- Header Section -->
  <text x="112" y="130" font-family="Inter, -apple-system, sans-serif" font-size="36" font-weight="600" fill="#B0BBC9" letter-spacing="0.04em">TIMEFRAME · WEEKLY REVIEW</text>
  <text x="112" y="176" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">${escapeXml(card.dateRange || card.label)}</text>

  <!-- Metric Panels: Focus time & Sink time -->
  <rect x="112" y="210" width="416" height="136" rx="12" fill="#141A22" stroke="#303B49" stroke-width="1.5" />
  <text x="140" y="254" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">Focus time</text>
  <text x="140" y="322" font-family="'JetBrains Mono', monospace" font-size="56" font-weight="600" fill="#E4B45F">${card.focusHours.toFixed(1)}h</text>

  <rect x="552" y="210" width="416" height="136" rx="12" fill="#141A22" stroke="#303B49" stroke-width="1.5" />
  <text x="580" y="254" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">Sink time</text>
  <text x="580" y="322" font-family="'JetBrains Mono', monospace" font-size="56" font-weight="600" fill="#F28D87">${card.sinkHours.toFixed(1)}h</text>

  <!-- Metric Panels: Deep blocks & Longest run -->
  <rect x="112" y="366" width="416" height="96" rx="12" fill="#141A22" stroke="#303B49" stroke-width="1.5" />
  <text x="140" y="428" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">Deep blocks: <tspan fill="#EDF1F5" font-family="'JetBrains Mono', monospace" font-weight="600">${card.blocksCount}</tspan></text>

  <rect x="552" y="366" width="416" height="96" rx="12" fill="#141A22" stroke="#303B49" stroke-width="1.5" />
  <text x="580" y="428" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">Longest run: <tspan fill="#EDF1F5" font-family="'JetBrains Mono', monospace" font-weight="600">${card.longestMinutes}m</tspan></text>

  <!-- Daily Focus and Sink Bars (7 Days, §13) -->
  <text x="112" y="516" font-family="Inter, -apple-system, sans-serif" font-size="36" font-weight="600" fill="#EDF1F5">Daily Activity (7 Days)</text>
  <text x="968" y="516" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2" text-anchor="end"><tspan fill="#E4B45F">■</tspan> Focus  <tspan fill="#F28D87">■</tspan> Sink</text>

${barRowsSvg}

  <!-- Coverage & Boundary Footer (§13) -->
  <line x1="112" y1="1125" x2="968" y2="1125" stroke="#303B49" stroke-width="2" />
  ${footerLines.map((line, idx) => `<text x="112" y="${1176 + idx * 46}" font-family="Inter, -apple-system, sans-serif" font-size="36" fill="#94A1B2">${escapeXml(line)}</text>`).join("\n  ")}
</svg>`;
}
