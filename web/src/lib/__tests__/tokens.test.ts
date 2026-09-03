import { describe, it, expect } from "vitest";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Design System Tokens & Contrast Tests (§6.1, §6.9)", () => {
  const surfaceDark = "#14171F"; // surface/raised
  const surfaceLight = "#FFFFFF";

  it("Text primary passes AAA (>= 7:1) on surface/raised", () => {
    const ratioDark = contrastRatio("#F4F6FA", surfaceDark);
    const ratioLight = contrastRatio("#131722", surfaceLight);
    expect(ratioDark).toBeGreaterThanOrEqual(7.0);
    expect(ratioLight).toBeGreaterThanOrEqual(7.0);
  });

  it("Text secondary passes AAA (>= 7:1) on surface/raised", () => {
    const ratioDark = contrastRatio("#D9DEE8", surfaceDark);
    const ratioLight = contrastRatio("#3A4152", surfaceLight);
    expect(ratioDark).toBeGreaterThanOrEqual(7.0);
    expect(ratioLight).toBeGreaterThanOrEqual(7.0);
  });

  it("Category colors pass AA (>= 4.5:1) on surface/raised", () => {
    expect(contrastRatio("#4ADE80", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/focus
    expect(contrastRatio("#F87171", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/sink
    expect(contrastRatio("#FBBF24", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/games
    expect(contrastRatio("#60A5FA", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/other
    expect(contrastRatio("#94A3B8", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/unclassified
    expect(contrastRatio("#A78BFA", surfaceDark)).toBeGreaterThanOrEqual(4.5); // cat/private
    expect(contrastRatio("#22D3EE", surfaceDark)).toBeGreaterThanOrEqual(4.5); // accent/creature
  });
});
