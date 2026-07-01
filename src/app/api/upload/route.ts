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

    // 1. Subir a Cloudinary
    let imageUrl: string, publicId: string, thumbUrl: string;
    try {
      const result = await uploadImage(image);
      imageUrl = result.imageUrl;
      publicId = result.publicId;
      thumbUrl = result.thumbUrl;
    } catch (err) {
      console.error("Cloudinary error:", err);
      return NextResponse.json({ error: "Error al subir imagen a Cloudinary" }, { status: 500 });
    }

    // 2. Ver si el usuario tiene API key de Anthropic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { anthropicKey: true },
    });

    let aiResult = null;

    if (user?.anthropicKey) {
      try {
        // Mandar base64 directo a Claude (más confiable que URL)
        aiResult = await analyzeClothingImage(image, user.anthropicKey);
      } catch (err: any) {
        console.error("AI analysis failed:", err?.message || err);
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
        style: aiResult?.style || null,
        formality: aiResult?.formality || 3,
        silhouette: aiResult?.silhouette || null,
        prendaType: aiResult?.prendaType || null,
      },
    });

    return NextResponse.json({
      item,
      aiSuggestions: aiResult,
      hasAI: !!aiResult,
    });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
