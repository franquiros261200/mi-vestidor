import { FashionItem, OutfitCombo, EngineContext, CATEGORY_TO_TYPE } from "./types";
import { scoreOutfit } from "./scoring";

// ── Generate outfits with variety and randomization ──

export function generateOutfits(
  allItems: FashionItem[],
  context: EngineContext
): OutfitCombo[] {
  const minScore = context.minScore ?? 65;
  const maxResults = context.maxResults ?? 10;

  const available = allItems.filter((i) => !i.inLaundry);

  // Group by type — use prendaType if set, otherwise fallback
  const byType: Record<string, FashionItem[]> = {
    superior: [],
    inferior: [],
    calzado: [],
    abrigo: [],
    accesorio: [],
  };

  available.forEach((item) => {
    const type = item.prendaType || CATEGORY_TO_TYPE[item.category] || "accesorio";
    if (byType[type]) byType[type].push(item);
  });

  if (byType.superior.length === 0 || byType.inferior.length === 0) {
    return [];
  }

  // Shuffle each type for variety across calls
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const tops = shuffle(byType.superior);
  const bottoms = shuffle(byType.inferior);
  const shoes = byType.calzado.length > 0 ? shuffle(byType.calzado) : [null];
  const abrigos = context.weather === "frio" || context.weather === "lluvia"
    ? (byType.abrigo.length > 0 ? [...shuffle(byType.abrigo), null] : [null])
    : [null];

  const combos: OutfitCombo[] = [];
  const maxCombos = 500;
  let evaluated = 0;

  for (const top of tops) {
    for (const bottom of bottoms) {
      // Skip if vestido/enterito (they're complete outfits by themselves)
      if (["vestido", "enterito"].includes(bottom.category)) continue;

      for (const shoe of shoes) {
        for (const abrigo of abrigos) {
          if (evaluated >= maxCombos) break;
          evaluated++;

          const items = [top, bottom, shoe, abrigo].filter(Boolean) as FashionItem[];
          const breakdown = scoreOutfit(items, context);

          if (breakdown.total >= minScore) {
            combos.push({ items, score: breakdown.total, breakdown });
          }
        }
      }
    }
  }

  // Sort by score
  combos.sort((a, b) => b.score - a.score);

  // Diversify — no dos outfits pueden compartir más del 50% de prendas
  const diversified = diversifyResults(combos, maxResults);

  // Add controlled randomness — after picking top by score, shuffle a bit
  // so the same query doesn't always return outfits in the exact same order
  return addVariety(diversified, maxResults);
}

// ── Diversification: avoid clones ─────────────────────

function diversifyResults(combos: OutfitCombo[], max: number): OutfitCombo[] {
  if (combos.length <= max) return combos;

  const selected: OutfitCombo[] = [];
  const candidates = [...combos];

  while (selected.length < max && candidates.length > 0) {
    const next = candidates.shift();
    if (!next) break;

    const tooSimilar = selected.some((sel) => {
      const shared = next.items.filter((i) =>
        sel.items.some((s) => s.id === i.id)
      );
      return shared.length / next.items.length > 0.5;
    });

    if (!tooSimilar) selected.push(next);
  }

  // If we didn't get enough diverse ones, fill with remaining top-scored
  if (selected.length < max) {
    for (const combo of combos) {
      if (selected.length >= max) break;
      if (!selected.includes(combo)) selected.push(combo);
    }
  }

  return selected;
}

// ── Variety: add controlled randomness ────────────────

function addVariety(combos: OutfitCombo[], max: number): OutfitCombo[] {
  if (combos.length <= 3) return combos;

  // Keep top 2 in order, then shuffle the rest
  const top = combos.slice(0, 2);
  const rest = combos.slice(2);
  
  // Weighted shuffle: high scores stay near top but with variance
  const shuffledRest = rest
    .map((c) => ({ combo: c, weight: c.score + Math.random() * 8 }))
    .sort((a, b) => b.weight - a.weight)
    .map((x) => x.combo);

  return [...top, ...shuffledRest].slice(0, max);
}
