import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
export const runtime = "nodejs";

const STYLES = ["casual", "formal", "streetwear", "deportivo", "elegante", "smart_casual", "minimalista"];
const SILHOUETTES = ["slim", "regular", "oversize", "wide"];
const PRENDA_TYPES = ["superior", "inferior", "calzado", "abrigo", "accesorio"];
const SEASONS = ["verano", "invierno", "entretiempo", "todo_el_año"];
const OCCASIONS = ["casual", "formal", "deporte", "salida", "trabajo", "playa", "facultad", "boliche", "cita", "gym"];
const CATEGORIES = [
  "remera", "camisa", "buzo", "sweater", "campera", "chaleco",
  "pantalon", "jean", "short", "jogger", "pollera",
  "zapatillas", "zapatos", "sandalias", "botas",
  "gorra", "sombrero", "bufanda", "cinturon", "reloj",
  "mochila", "cartera", "lentes",
  "traje_de_baño", "ropa_interior", "medias",
  "vestido", "enterito", "saco", "blazer",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { anthropicKey: true },
  });

  if (!user?.anthropicKey) {
    return NextResponse.json({ error: "Necesitás configurar tu API key en ⚙️ Configuración" }, { status: 400 });
  }

  const { itemId, extraImages } = await req.json();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
  });

  if (!item) return NextResponse.json({ error: "Prenda no encontrada" }, { status: 404 });

  try {
    // Get main image from Cloudinary as base64
    const mainRes = await fetch(item.imageUrl);
    const mainBuffer = await mainRes.arrayBuffer();
    const mainBase64 = Buffer.from(mainBuffer).toString("base64");

    // Extract data from extra images
    const extraImageData = (extraImages || []).map((img: string) => {
      const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
      return {
        mediaType: (match?.[1] || "image/jpeg") as any,
        data: match?.[2] || img.replace(/^data:image\/\w+;base64,/, ""),
      };
    });

    const anthropic = new Anthropic({ apiKey: user.anthropicKey });

    const content: any[] = [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: mainBase64 } },
    ];

    extraImageData.forEach((img: any) => {
      content.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } });
    });

    content.push({
      type: "text",
      text: `Te muestro ${1 + extraImageData.length} fotos de la MISMA prenda de ropa desde distintos ángulos. Analizá todas juntas y devolvé SOLO un JSON (sin markdown, sin backticks) con la clasificación más precisa:
{
  "category": una de [${CATEGORIES.join(", ")}],
  "subcategory": subtipo si aplica o null,
  "colors": [{"hex": "#XXXXXX", "name": "nombre en español"}] (máximo 3 colores dominantes),
  "seasons": array de [${SEASONS.join(", ")}],
  "occasions": array de [${OCCASIONS.join(", ")}],
  "material": material estimado o null,
  "brand": marca visible o null,
  "style": una de [${STYLES.join(", ")}],
  "formality": número 1 a 5,
  "silhouette": una de [${SILHOUETTES.join(", ")}],
  "prendaType": una de [${PRENDA_TYPES.join(", ")}],
  "confidence": 0.0 a 1.0
}`,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || jsonText.match(/(\{[\s\S]*\})/);
    if (jsonMatch) jsonText = jsonMatch[1];

    const aiResult = JSON.parse(jsonText);

    await prisma.item.update({
      where: { id: itemId },
      data: {
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        colors: aiResult.colors.map((c: any) => c.hex),
        colorNames: aiResult.colors.map((c: any) => c.name),
        seasons: aiResult.seasons,
        occasions: aiResult.occasions,
        material: aiResult.material,
        brand: aiResult.brand,
        style: aiResult.style,
        formality: aiResult.formality,
        silhouette: aiResult.silhouette,
        prendaType: aiResult.prendaType,
      },
    });

    return NextResponse.json({ ok: true, aiResult });
  } catch (error: any) {
    console.error("Multi-analyze error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Error al reanalizar" }, { status: 500 });
  }
}
