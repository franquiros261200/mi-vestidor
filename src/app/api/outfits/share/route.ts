import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST — generate share link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { outfitId } = await req.json();

  const outfit = await prisma.outfit.findFirst({
    where: { id: outfitId, userId: session.user.id },
  });

  if (!outfit) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Generate or return existing shareId
  let shareId = outfit.shareId;
  if (!shareId) {
    shareId = crypto.randomBytes(6).toString("hex");
    await prisma.outfit.update({
      where: { id: outfitId },
      data: { shareId },
    });
  }

  return NextResponse.json({ shareId });
}

// GET — get shared outfit (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("id");

  if (!shareId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const outfit = await prisma.outfit.findUnique({
    where: { shareId },
    include: {
      user: { select: { name: true, image: true } },
      items: {
        include: {
          item: {
            select: { imageUrl: true, thumbnailUrl: true, category: true, brand: true, colorNames: true, colors: true },
          },
        },
        orderBy: { layer: "asc" },
      },
    },
  });

  if (!outfit) return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });

  return NextResponse.json(outfit);
}
