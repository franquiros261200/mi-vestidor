import Anthropic from "@anthropic-ai/sdk";

export interface AITagResult {
  category: string;
  subcategory: string | null;
  colors: { hex: string; name: string }[];
  seasons: string[];
  occasions: string[];
  material: string | null;
  brand: string | null;
  style: string | null;
  formality: number;
  silhouette: string | null;
  prendaType: string | null;
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

const STYLES = ["casual", "formal", "streetwear", "deportivo", "elegante", "smart_casual", "minimalista"];
const SILHOUETTES = ["slim", "regular", "oversize", "wide"];
const PRENDA_TYPES = ["superior", "inferior", "calzado", "abrigo", "accesorio"];
const SEASONS = ["verano", "invierno", "entretiempo", "todo_el_año"];
const OCCASIONS = ["casual", "formal", "deporte", "salida", "trabajo", "playa", "facultad", "boliche", "cita", "gym"];

export async function analyzeClothingImage(base64Image: string, apiKey: string): Promise<AITagResult> {
  const anthropic = new Anthropic({ apiKey });

  // Extraer media type y data del base64
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  const mediaType = (match?.[1] || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const imageData = match?.[2] || base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageData },
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
  "material": material estimado ("algodón", "poliéster", "cuero", "jean", "lana") o null,
  "brand": marca visible o null,
  "style": una de [${STYLES.join(", ")}],
  "formality": número 1 a 5 (1=muy casual, 5=muy formal),
  "silhouette": una de [${SILHOUETTES.join(", ")}],
  "prendaType": una de [${PRENDA_TYPES.join(", ")}],
  "confidence": 0.0 a 1.0 qué tan seguro estás
}

Si no es una prenda de ropa, intentá clasificarla lo mejor posible. Si tiene textura o estampado, describí los colores dominantes.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  
  try {
    return JSON.parse(text.trim()) as AITagResult;
  } catch {
    return {
      category: "remera",
      subcategory: null,
      colors: [{ hex: "#000000", name: "negro" }],
      seasons: ["todo_el_año"],
      occasions: ["casual"],
      material: null,
      brand: null,
      style: "casual",
      formality: 3,
      silhouette: "regular",
      prendaType: "superior",
      confidence: 0,
    };
  }
}
