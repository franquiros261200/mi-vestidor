export interface FashionItem {
  id: string;
  category: string;
  colors: string[];       // hex
  colorNames: string[];
  style: string | null;
  formality: number;      // 1-5
  silhouette: string | null;
  prendaType: string | null;
  seasons: string[];
  occasions: string[];
  timesWorn: number;
  inLaundry: boolean;
  imageUrl: string;
  thumbnailUrl: string | null;
  brand: string | null;
}

export interface OutfitCombo {
  items: FashionItem[];
  score: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  colorHarmony: number;     // 0-25
  styleCompat: number;      // 0-25
  occasionFit: number;      // 0-20
  weatherFit: number;       // 0-15
  visualBalance: number;    // 0-15
  total: number;            // 0-100
  penalties: string[];
  bonuses: string[];
}

export interface EngineContext {
  occasion?: string;
  weather?: string;
  season?: string;
  temperature?: number;
  maxResults?: number;
  minScore?: number;
}

export type PrendaType = "superior" | "inferior" | "calzado" | "abrigo" | "accesorio";
export type Style = "casual" | "formal" | "streetwear" | "deportivo" | "elegante" | "smart_casual" | "minimalista";
export type Silhouette = "slim" | "regular" | "oversize" | "wide";

// Mapeo de categorías a tipo de prenda
export const CATEGORY_TO_TYPE: Record<string, PrendaType> = {
  remera: "superior", camisa: "superior", buzo: "superior", sweater: "superior",
  saco: "superior", blazer: "superior", chaleco: "superior",
  campera: "abrigo",
  pantalon: "inferior", jean: "inferior", short: "inferior",
  jogger: "inferior", pollera: "inferior",
  vestido: "inferior", enterito: "inferior",
  zapatillas: "calzado", zapatos: "calzado", sandalias: "calzado", botas: "calzado",
  gorra: "accesorio", sombrero: "accesorio", bufanda: "accesorio",
  cinturon: "accesorio", reloj: "accesorio", mochila: "accesorio",
  cartera: "accesorio", lentes: "accesorio",
  ropa_interior: "accesorio", medias: "accesorio", traje_de_baño: "inferior",
};

// Mapeo de categorías a formalidad default
export const CATEGORY_FORMALITY: Record<string, number> = {
  remera: 2, camisa: 4, buzo: 2, sweater: 3, saco: 4, blazer: 5, chaleco: 4,
  campera: 2, pantalon: 3, jean: 2, short: 1, jogger: 1, pollera: 3,
  vestido: 4, enterito: 3,
  zapatillas: 2, zapatos: 4, sandalias: 1, botas: 3,
  gorra: 1, sombrero: 3, bufanda: 3, cinturon: 3, reloj: 3,
  mochila: 1, cartera: 3, lentes: 2,
};
