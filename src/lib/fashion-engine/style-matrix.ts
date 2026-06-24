// ── Style Compatibility Matrix ─────────────────────────
// Score 0-10 for each style pair (symmetric)

const STYLE_MATRIX: Record<string, Record<string, number>> = {
  casual: {
    casual: 10, formal: 2, streetwear: 7, deportivo: 5,
    elegante: 4, smart_casual: 8, minimalista: 8,
  },
  formal: {
    casual: 2, formal: 10, streetwear: 1, deportivo: 0,
    elegante: 9, smart_casual: 7, minimalista: 8,
  },
  streetwear: {
    casual: 7, formal: 1, streetwear: 10, deportivo: 6,
    elegante: 2, smart_casual: 5, minimalista: 4,
  },
  deportivo: {
    casual: 5, formal: 0, streetwear: 6, deportivo: 10,
    elegante: 0, smart_casual: 2, minimalista: 3,
  },
  elegante: {
    casual: 4, formal: 9, streetwear: 2, deportivo: 0,
    elegante: 10, smart_casual: 8, minimalista: 9,
  },
  smart_casual: {
    casual: 8, formal: 7, streetwear: 5, deportivo: 2,
    elegante: 8, smart_casual: 10, minimalista: 9,
  },
  minimalista: {
    casual: 8, formal: 8, streetwear: 4, deportivo: 3,
    elegante: 9, smart_casual: 9, minimalista: 10,
  },
};

export function scoreStyleCompatibility(styles: (string | null)[]): {
  score: number; // 0-25
  details: string;
} {
  const validStyles = styles.filter(Boolean) as string[];

  if (validStyles.length < 2) {
    return { score: 20, details: "Pocas prendas con estilo definido" };
  }

  // Score all pairs
  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < validStyles.length; i++) {
    for (let j = i + 1; j < validStyles.length; j++) {
      const a = validStyles[i];
      const b = validStyles[j];
      const pairScore = STYLE_MATRIX[a]?.[b] ?? STYLE_MATRIX[b]?.[a] ?? 5;
      totalScore += pairScore;
      pairs++;
    }
  }

  const avg = pairs > 0 ? totalScore / pairs : 5;
  const normalized = Math.round((avg / 10) * 25);

  // Determine description
  let details = "";
  if (avg >= 8) details = "Estilos muy compatibles — outfit cohesivo";
  else if (avg >= 6) details = "Buena mezcla de estilos — funciona bien";
  else if (avg >= 4) details = "Mezcla arriesgada — puede funcionar con confianza";
  else details = "Estilos incompatibles — combinación disonante";

  return { score: normalized, details };
}

// ── Formality compatibility ───────────────────────────

export function scoreFormalityBalance(formalities: number[]): {
  score: number;
  details: string;
} {
  if (formalities.length < 2) return { score: 10, details: "Pocas prendas" };

  const min = Math.min(...formalities);
  const max = Math.max(...formalities);
  const range = max - min;

  // Range 0-1: perfect harmony, 2: good, 3: stretch, 4: clash
  if (range <= 1) return { score: 10, details: "Formalidad perfectamente equilibrada" };
  if (range <= 2) return { score: 7, details: "Formalidad compatible — buena mezcla" };
  if (range <= 3) return { score: 4, details: "Salto de formalidad notable" };
  return { score: 1, details: "Choque de formalidad — zapatillas running con blazer?" };
}

// ── Silhouette balance ────────────────────────────────

const SILHOUETTE_COMBOS: Record<string, Record<string, number>> = {
  slim: { slim: 7, regular: 9, oversize: 8, wide: 6 },
  regular: { slim: 9, regular: 8, oversize: 7, wide: 7 },
  oversize: { slim: 8, regular: 7, oversize: 5, wide: 3 },
  wide: { slim: 6, regular: 7, oversize: 3, wide: 4 },
};

export function scoreSilhouetteBalance(silhouettes: (string | null)[]): {
  score: number; // 0-5 (part of visual balance)
  details: string;
} {
  const valid = silhouettes.filter(Boolean) as string[];
  if (valid.length < 2) return { score: 4, details: "Silueta no definida" };

  // Score top-bottom combo primarily
  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const s = SILHOUETTE_COMBOS[valid[i]]?.[valid[j]] ?? 5;
      totalScore += s;
      pairs++;
    }
  }

  const avg = pairs > 0 ? totalScore / pairs : 5;
  const normalized = Math.round((avg / 10) * 5);

  let details = "";
  if (avg >= 7) details = "Proporciones equilibradas";
  else if (avg >= 5) details = "Proporciones aceptables";
  else details = "Desbalance de proporciones";

  return { score: normalized, details };
}

export { STYLE_MATRIX };
