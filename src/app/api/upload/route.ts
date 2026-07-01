import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

// Solo sube a Cloudinary y guarda en DB — rápido, sin IA
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    // Subir a Cloudinary
    const { imageUrl, publicId, thumbUrl } = await uploadImage(image);

    // Guardar en DB sin tags (se completan después con IA o manual)
    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        imageUrl,
        imagePublicId: publicId,
        thumbnailUrl: thumbUrl,
        category: "remera",
        colors: [],
        colorNames: [],
        seasons: [],
        occasions: [],
        formality: 3,
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Error al subir: " + (error?.message || "desconocido") },
      { status: 500 }
    );
  }
}
