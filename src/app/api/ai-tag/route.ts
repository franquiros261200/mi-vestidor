import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeClothingImage } from "@/lib/ai-tagger";

export const maxDuration = 60;
export const runtime = "nodejs";

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
    return NextResponse.json({ hasAI: false });
  }

  try {
    const { image, itemId } = await req.json();

    const aiResult = await analyzeClothingImage(image, user.anthropicKey);

    // Actualizar el item con los tags de IA
    if (itemId) {
      await prisma.item.updateMany({
        where: { id: itemId, userId: session.user.id },
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
    }

    return NextResponse.json({ hasAI: true, aiSuggestions: aiResult });
  } catch (error: any) {
    console.error("AI tagging error:", error?.message || error);
    return NextResponse.json({ hasAI: false, error: error?.message });
  }
}
