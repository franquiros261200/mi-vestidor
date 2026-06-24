// ── Color Theory for Fashion ──────────────────────────

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// Hex → HSL conversion
function hexToHSL(hex: string): HSL {
  hex = hex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Check if color is neutral (black, white, gray, beige, navy)
function isNeutral(hsl: HSL): boolean {
  if (hsl.s < 15) return true; // grays
  if (hsl.l < 12) return true; // black
  if (hsl.l > 90) return true; // white
  // Navy blue
  if (hsl.h >= 200 && hsl.h <= 240 && hsl.s < 50 && hsl.l < 30) return true;
  // Beige/khaki
  if (hsl.h >= 30 && hsl.h <= 50 && hsl.s < 40 && hsl.l > 60) return true;
  return false;
}

// Hue distance (circular)
function hueDist(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2);
  return Math.min(d, 360 - d);
}

// ── Harmony detection ─────────────────────────────────

type HarmonyType =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "triadic"
  | "neutral_base"
  | "neutral_accent"
  | "all_neutral"
  | "clash";

function detectHarmony(colors: string[]): { type: HarmonyType; score: number } {
  const hsls = colors.map(hexToHSL);
  const neutrals = hsls.filter(isNeutral);
  const chromatic = hsls.filter((c) => !isNeutral(c));

  // All neutrals → safe and clean
  if (chromatic.length === 0) {
    return { type: "all_neutral", score: 20 };
  }

  // Neutrals + 1 accent color → classic move
  if (chromatic.length === 1 && neutrals.length >= 1) {
    return { type: "neutral_accent", score: 24 };
  }

  // All chromatic or mix
  const hues = chromatic.map((c) => c.h);

  // Monochromatic: all hues within 15°
  if (hues.length >= 2) {
    const maxDist = Math.max(...hues.map((h, i) =>
      hues.slice(i + 1).map((h2) => hueDist(h, h2))
    ).flat());

    if (maxDist < 15) return { type: "monochromatic", score: 23 };
    if (maxDist < 40) return { type: "analogous", score: 22 };
    if (maxDist > 150 && maxDist < 210) return { type: "complementary", score: 20 };
  }

  // Neutral base + chromatic colors
  if (neutrals.length >= chromatic.length) {
    return { type: "neutral_base", score: 19 };
  }

  // Multiple chromatic without clear harmony
  if (chromatic.length >= 3) {
    const dists = [];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        dists.push(hueDist(hues[i], hues[j]));
      }
    }
    const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;

    // Triadic-ish
    if (avgDist > 100 && avgDist < 140) return { type: "triadic", score: 17 };
  }

  // Clash
  return { type: "clash", score: 8 };
}

// ── Main scoring function ─────────────────────────────

export function scoreColorHarmony(hexColors: string[][]): {
  score: number; // 0-25
  harmony: HarmonyType;
  details: string;
} {
  // Flatten all colors from all items, deduplicate
  const allColors = Array.from(new Set(hexColors.flat().filter((c) => c && c.startsWith("#"))));

  if (allColors.length === 0) {
    return { score: 15, harmony: "all_neutral", details: "Sin colores definidos" };
  }

  if (allColors.length === 1) {
    return { score: 22, harmony: "monochromatic", details: "Color único" };
  }

  const { type, score } = detectHarmony(allColors);

  const detailMap: Record<HarmonyType, string> = {
    monochromatic: "Paleta monocromática — misma familia de color, muy cohesivo",
    analogous: "Colores análogos — tonos cercanos, armonía natural",
    complementary: "Complementarios suaves — contraste equilibrado",
    triadic: "Paleta triádica — combinación dinámica pero puede ser arriesgada",
    neutral_accent: "Neutros + color protagonista — combinación clásica y versátil",
    neutral_base: "Base neutra con toques de color — seguro y elegante",
    all_neutral: "Todo neutro — limpio y minimalista",
    clash: "Choque de colores — combinación visualmente agresiva",
  };

  return { score, harmony: type, details: detailMap[type] };
}

export { hexToHSL, isNeutral, type HarmonyType };
