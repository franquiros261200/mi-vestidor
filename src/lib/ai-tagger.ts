import Anthropic from "@anthropic-ai/sdk";

export interface AITagResult {
  category: string;
  subcategory: string | null;
  colors: { hex: string; name: string }[];
  seasons: string[];
  occasions: string[];
  material: string | null;
  brand: string | null;
  confidence: number;
}

const CATEGORIES = [
  "remera", "camisa", "buzo", "sweater", "campera", "chaleco",
  "pantalon", "jean", "short", "jogger", "pollera",
  "zapatillas", "zapatos", "sandalias", "botas",
  "gorra", "sombrero", "bufanda", "cinturon", "reloj",
  "mochila", "cartera", "lentes",
  "traje_de_baño", "ropa_interior", "medias",
  "vestido", "enterito", "saco", "blazer",
];

const SEASONS = ["verano", "invierno", "entretiempo", "todo_el_año"];
const OCCASIONS = ["casual", "formal", "deporte", "salida", "trabajo", "playa"];

export async function analyzeClothingImage(imageUrl: string, apiKey: string): Promise<AITagResult> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `Analizá esta prenda de ropa y devolvé SOLO un JSON (sin markdown, sin backticks) con:
{
  "category": una de [${CATEGORIES.join(", ")}],
  "subcategory": subtipo si aplica (ej: "polo", "crop top") o null,
  "colors": [{"hex": "#XXXXXX", "name": "nombre en español"}] (máximo 3 colores dominantes),
  "seasons": array de [${SEASONS.join(", ")}],
  "occasions": array de [${OCCASIONS.join(", ")}],
  "material": material estimado ("algodón", "poliéster", "cuero", "jean") o null,
  "brand": marca visible o null,
  "confidence": 0.0 a 1.0 qué tan seguro estás
}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  
  try {
    return JSON.parse(text.trim()) as AITagResult;
  } catch {
    // Fallback si el parse falla
    return {
      category: "remera",
      subcategory: null,
      colors: [{ hex: "#000000", name: "negro" }],
      seasons: ["todo_el_año"],
      occasions: ["casual"],
      material: null,
      brand: null,
      confidence: 0,
    };
  }
}
