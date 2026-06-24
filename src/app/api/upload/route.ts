import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { analyzeClothingImage } from "@/lib/ai-tagger";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    // 1. Subir a Cloudinary (siempre, es gratis)
    const { imageUrl, publicId, thumbUrl } = await uploadImage(image);

    // 2. Ver si el usuario tiene API key de Anthropic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { anthropicKey: true },
    });

    let aiResult = null;

    if (user?.anthropicKey) {
      // Tiene key → analizar con Claude Vision
      try {
        aiResult = await analyzeClothingImage(imageUrl, user.anthropicKey);
      } catch (err) {
        console.error("AI analysis failed:", err);
        // Si falla la IA, seguimos sin ella
      }
    }

    // 3. Guardar en DB
    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        imageUrl,
        imagePublicId: publicId,
        thumbnailUrl: thumbUrl,
        category: aiResult?.category || "remera",
        subcategory: aiResult?.subcategory || null,
        colors: aiResult?.colors.map((c) => c.hex) || [],
        colorNames: aiResult?.colors.map((c) => c.name) || [],
        seasons: aiResult?.seasons || [],
        occasions: aiResult?.occasions || [],
        material: aiResult?.material || null,
        brand: aiResult?.brand || null,
      },
    });

    return NextResponse.json({
      item,
      aiSuggestions: aiResult,
      hasAI: !!aiResult,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
