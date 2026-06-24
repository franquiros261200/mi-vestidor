import { FashionItem, OutfitCombo, EngineContext, CATEGORY_TO_TYPE } from "./types";
import { scoreOutfit } from "./scoring";

// ── Generate outfits ──────────────────────────────────

export function generateOutfits(
  allItems: FashionItem[],
  context: EngineContext
): OutfitCombo[] {
  const minScore = context.minScore ?? 70;
  const maxResults = context.maxResults ?? 10;

  // Filter available items
  const available = allItems.filter((i) => !i.inLaundry);

  // Group by type
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

  // Need at least top + bottom + shoes for a valid outfit
  if (byType.superior.length === 0 || byType.inferior.length === 0) {
    return [];
  }

  const combos: OutfitCombo[] = [];
  const maxCombos = 500; // cap to avoid explosion
  let evaluated = 0;

  // Generate combinations: top × bottom × shoes (× optional abrigo)
  const shoes = byType.calzado.length > 0 ? byType.calzado : [null];
  const abrigos = context.weather === "frio" || context.weather === "lluvia"
    ? (byType.abrigo.length > 0 ? [...byType.abrigo, null] : [null])
    : [null];

  for (const top of byType.superior) {
    for (const bottom of byType.inferior) {
      for (const shoe of shoes) {
        for (const abrigo of abrigos) {
          if (evaluated >= maxCombos) break;
          evaluated++;

          const items = [top, bottom, shoe, abrigo].filter(Boolean) as FashionItem[];

          // Skip if vestido/enterito + top (redundant)
          if (["vestido", "enterito"].includes(bottom.category) && top) continue;

          const breakdown = scoreOutfit(items, context);

          if (breakdown.total >= minScore) {
            combos.push({ items, score: breakdown.total, breakdown });
          }
        }
      }
    }
  }

  // Sort by score descending
  combos.sort((a, b) => b.score - a.score);

  // Diversify: avoid too many similar outfits
  const diversified = diversifyResults(combos, maxResults);

  return diversified;
}

// ── Diversification ───────────────────────────────────
// Avoid returning 10 outfits that only differ by one item

function diversifyResults(combos: OutfitCombo[], max: number): OutfitCombo[] {
  if (combos.length <= max) return combos;

  const selected: OutfitCombo[] = [combos[0]]; // always include best

  for (const combo of combos.slice(1)) {
    if (selected.length >= max) break;

    // Check similarity with already selected
    const tooSimilar = selected.some((sel) => {
      const sharedItems = combo.items.filter((i) =>
        sel.items.some((s) => s.id === i.id)
      );
      // If 80%+ items are the same, skip
      return sharedItems.length / combo.items.length > 0.7;
    });

    if (!tooSimilar) {
      selected.push(combo);
    }
  }

  // If we didn't get enough diverse ones, fill with remaining
  if (selected.length < max) {
    for (const combo of combos) {
      if (selected.length >= max) break;
      if (!selected.includes(combo)) selected.push(combo);
    }
  }

  return selected;
}

// ── Quick recommendation (for Random/Clima) ───────────

export function quickRecommend(
  allItems: FashionItem[],
  context: EngineContext
): OutfitCombo | null {
  const results = generateOutfits(allItems, {
    ...context,
    maxResults: 5,
    minScore: 60, // lower threshold for single recommendation
  });

  if (results.length === 0) return null;

  // Pick randomly from top 3 for variety
  const topN = results.slice(0, Math.min(3, results.length));
  return topN[Math.floor(Math.random() * topN.length)];
}
