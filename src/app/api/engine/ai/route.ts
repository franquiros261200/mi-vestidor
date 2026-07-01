import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { scoreOutfit, FashionItem, CATEGORY_TO_TYPE, CATEGORY_FORMALITY } from "@/lib/fashion-engine";

export const maxDuration = 60;
export const runtime = "nodejs";

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

  const { occasion, weather, count = 3 } = await req.json();

  // Get user's items
  const items = await prisma.item.findMany({
    where: { userId: session.user.id, archived: false, inLaundry: false },
  });

  if (items.length < 3) {
    return NextResponse.json({ error: "Necesitás al menos 3 prendas para generar outfits" }, { status: 400 });
  }

  // Build compact item catalog for Claude
  const catalog = items.map((i) => ({
    id: i.id,
    tipo: CATEGORY_TO_TYPE[i.category] || "accesorio",
    categoria: i.category,
    colores: i.colorNames.join(", ") || "sin definir",
    estilo: i.style || "sin definir",
    formalidad: i.formality,
    temporada: i.seasons.join(",") || "cualquiera",
    marca: i.brand || null,
  }));

  const anthropic = new Anthropic({ apiKey: user.anthropicKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Sos un asesor de moda experto. Te doy el guardarropa de un usuario argentino y necesito que armes ${count} outfits distintos${occasion ? ` para "${occasion}"` : ""}${weather ? ` con clima "${weather}"` : ""}.

REGLAS OBLIGATORIAS:
- Cada outfit debe tener: 1 prenda de tipo "superior", 1 de "inferior", 1 de "calzado". Opcionalmente 1 abrigo y accesorios.
- Excepción: si usás vestido/enterito (tipo "inferior"), no agregues "superior".
- Los outfits deben ser DISTINTOS entre sí (no repitas la misma remera en los 3).
- Considerá teoría del color (neutros con acentos, análogos, monocromáticos), coherencia de estilo, y adecuación a la ocasión.
- NO USES prendas con formalidad muy dispar (ej: zapatillas deportivas con blazer formal).

Guardarropa disponible (${catalog.length} prendas):
${JSON.stringify(catalog, null, 2)}

Devolvé SOLO un JSON válido (sin markdown, sin explicación afuera), con este formato exacto:
{
  "outfits": [
    {
      "itemIds": ["id1", "id2", "id3"],
      "razonamiento": "Por qué elegiste estas prendas, en 1-2 oraciones directas y en argentino natural"
    }
  ]
}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  let jsonText = text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || jsonText.match(/(\{[\s\S]*\})/);
  if (jsonMatch) jsonText = jsonMatch[1];

  let aiOutfits;
  try {
    aiOutfits = JSON.parse(jsonText);
  } catch {
    return NextResponse.json({ error: "La IA no devolvió un formato válido, probá de nuevo" }, { status: 500 });
  }

  // Validate + score each outfit with rules engine
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const validated = (aiOutfits.outfits || [])
    .map((outfit: any) => {
      const selectedItems = (outfit.itemIds || [])
        .map((id: string) => itemMap.get(id))
        .filter(Boolean);

      if (selectedItems.length < 2) return null;

      const fashionItems: FashionItem[] = selectedItems.map((item: any) => ({
        id: item.id,
        category: item.category,
        colors: item.colors,
        colorNames: item.colorNames,
        style: item.style,
        formality: item.formality || CATEGORY_FORMALITY[item.category] || 3,
        silhouette: item.silhouette,
        prendaType: item.prendaType || CATEGORY_TO_TYPE[item.category] || null,
        seasons: item.seasons,
        occasions: item.occasions,
        timesWorn: item.timesWorn,
        inLaundry: item.inLaundry,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl,
        brand: item.brand,
      }));

      const breakdown = scoreOutfit(fashionItems, { occasion, weather });

      return {
        items: fashionItems,
        score: breakdown.total,
        breakdown,
        aiReasoning: outfit.razonamiento || null,
        source: "ai",
      };
    })
    .filter(Boolean);

  // Sort by score, best first
  validated.sort((a: any, b: any) => b.score - a.score);

  return NextResponse.json(validated);
}
