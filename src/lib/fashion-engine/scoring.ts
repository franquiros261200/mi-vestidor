import { FashionItem, OutfitCombo, ScoreBreakdown, EngineContext, CATEGORY_TO_TYPE } from "./types";
import { scoreColorHarmony } from "./color-theory";
import { scoreStyleCompatibility, scoreFormalityBalance, scoreSilhouetteBalance } from "./style-matrix";

// ── Occasion mapping ──────────────────────────────────

const OCCASION_FORMALITY: Record<string, [number, number]> = {
  // [min, max] formality range
  facultad: [1, 3],
  trabajo: [3, 5],
  boliche: [1, 4],
  cita: [3, 5],
  formal: [4, 5],
  gym: [1, 1],
  casual: [1, 3],
  playa: [1, 1],
  deporte: [1, 2],
  salida: [2, 4],
};

const OCCASION_STYLES: Record<string, string[]> = {
  facultad: ["casual", "streetwear", "smart_casual", "minimalista"],
  trabajo: ["formal", "smart_casual", "elegante", "minimalista"],
  boliche: ["streetwear", "elegante", "smart_casual", "casual"],
  cita: ["smart_casual", "elegante", "minimalista"],
  formal: ["formal", "elegante"],
  gym: ["deportivo"],
  casual: ["casual", "streetwear", "smart_casual", "minimalista"],
  playa: ["casual", "deportivo"],
  deporte: ["deportivo", "casual"],
  salida: ["smart_casual", "elegante", "streetwear", "casual"],
};

// ── Weather mapping ───────────────────────────────────

const WEATHER_SEASONS: Record<string, string[]> = {
  calor: ["verano", "todo_el_año"],
  templado: ["entretiempo", "todo_el_año"],
  frio: ["invierno", "entretiempo", "todo_el_año"],
  lluvia: ["invierno", "entretiempo", "todo_el_año"],
};

const WEATHER_BLOCKED_CATEGORIES: Record<string, string[]> = {
  calor: ["campera", "buzo", "sweater", "bufanda", "botas"],
  frio: ["short", "sandalias", "traje_de_baño"],
  lluvia: ["sandalias", "traje_de_baño"],
};

// ── Core scoring function ─────────────────────────────

export function scoreOutfit(items: FashionItem[], context: EngineContext): ScoreBreakdown {
  const penalties: string[] = [];
  const bonuses: string[] = [];

  // 1. COLOR HARMONY (0-25)
  const colorResult = scoreColorHarmony(items.map((i) => i.colors));
  const colorHarmony = colorResult.score;
  if (colorResult.harmony === "clash") penalties.push("Choque de colores");
  if (colorResult.harmony === "neutral_accent") bonuses.push("Combo neutro + acento");

  // 2. STYLE COMPATIBILITY (0-25)
  const styleResult = scoreStyleCompatibility(items.map((i) => i.style));
  const formalityResult = scoreFormalityBalance(items.map((i) => i.formality));
  // Combine: 60% style compat, 40% formality
  const styleCompat = Math.round(styleResult.score * 0.6 + formalityResult.score * 0.4 * 2.5);
  if (formalityResult.score <= 2) penalties.push(formalityResult.details);
  if (styleResult.score >= 22) bonuses.push(styleResult.details);

  // 3. OCCASION FIT (0-20)
  let occasionFit = 15; // default neutral
  if (context.occasion) {
    const fRange = OCCASION_FORMALITY[context.occasion];
    const goodStyles = OCCASION_STYLES[context.occasion] || [];
    const avgFormality = items.reduce((s, i) => s + i.formality, 0) / items.length;

    let formalityFit = 0;
    if (fRange) {
      if (avgFormality >= fRange[0] && avgFormality <= fRange[1]) formalityFit = 10;
      else if (avgFormality >= fRange[0] - 0.5 && avgFormality <= fRange[1] + 0.5) formalityFit = 7;
      else formalityFit = 3;
    }

    const styleFit = items.filter((i) => i.style && goodStyles.includes(i.style)).length;
    const styleScore = items.length > 0 ? Math.round((styleFit / items.length) * 10) : 5;

    occasionFit = formalityFit + styleScore;
    if (occasionFit >= 18) bonuses.push(`Perfecto para ${context.occasion}`);
    if (occasionFit <= 8) penalties.push(`Poco adecuado para ${context.occasion}`);
  }

  // 4. WEATHER FIT (0-15)
  let weatherFit = 12; // default neutral
  if (context.weather) {
    const validSeasons = WEATHER_SEASONS[context.weather] || [];
    const blocked = WEATHER_BLOCKED_CATEGORIES[context.weather] || [];

    const blockedItems = items.filter((i) => blocked.includes(i.category));
    if (blockedItems.length > 0) {
      weatherFit -= blockedItems.length * 4;
      penalties.push(`Prenda inadecuada para clima ${context.weather}`);
    }

    const seasonMatches = items.filter((i) =>
      i.seasons.length === 0 || i.seasons.some((s) => validSeasons.includes(s))
    ).length;
    const seasonRatio = items.length > 0 ? seasonMatches / items.length : 1;
    weatherFit = Math.max(0, Math.min(15, Math.round(weatherFit * seasonRatio)));

    if (weatherFit >= 13) bonuses.push("Ideal para el clima");
  }

  // 5. VISUAL BALANCE (0-15)
  const silResult = scoreSilhouetteBalance(items.map((i) => i.silhouette));
  let visualBalance = silResult.score * 2; // 0-10

  // Variety bonus: using different types is good
  const types = new Set(items.map((i) => i.prendaType || CATEGORY_TO_TYPE[i.category]));
  if (types.has("superior") && types.has("inferior") && types.has("calzado")) {
    visualBalance += 5;
    bonuses.push("Outfit completo (arriba + abajo + calzado)");
  } else if (types.has("superior") && types.has("inferior")) {
    visualBalance += 3;
  }

  visualBalance = Math.min(15, visualBalance);

  // ── Penalties ──
  // Same item worn too much
  const overused = items.filter((i) => i.timesWorn > 20);
  if (overused.length > 0) {
    penalties.push("Incluye prendas muy usadas — dale variedad");
  }

  const total = Math.max(0, Math.min(100,
    colorHarmony + styleCompat + occasionFit + weatherFit + visualBalance
  ));

  return {
    colorHarmony,
    styleCompat,
    occasionFit,
    weatherFit,
    visualBalance,
    total,
    penalties,
    bonuses,
  };
}
