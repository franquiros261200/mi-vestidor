import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeClothingImage } from "@/lib/ai-tagger";

export const maxDuration = 60;
export const runtime = "nodejs";

// Reanaliza una prenda existente usando su URL de Cloudinary
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { anthropicKey: true },
  });

  if (!user?.anthropicKey) {
    return NextResponse.json({ error: "Necesitás configurar tu API key en ⚙️ Configuración" }, { status: 400 });
  }

  const { itemId } = await req.json();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
  });

  if (!item) return NextResponse.json({ error: "Prenda no encontrada" }, { status: 404 });

  try {
    // Descargar la imagen desde Cloudinary y convertir a base64
    const imgRes = await fetch(item.imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const base64 = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;

    const aiResult = await analyzeClothingImage(base64, user.anthropicKey);

    await prisma.item.update({
      where: { id: itemId },
      data: {
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        colors: aiResult.colors.map((c) => c.hex),
        colorNames: aiResult.colors.map((c) => c.name),
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
    console.error("Re-analyze error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Error al reanalizar" }, { status: 500 });
  }
}
