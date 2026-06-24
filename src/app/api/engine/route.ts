import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOutfits, FashionItem, CATEGORY_TO_TYPE, CATEGORY_FORMALITY } from "@/lib/fashion-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const context = await req.json();

  const items = await prisma.item.findMany({
    where: { userId: session.user.id, archived: false },
  });

  // Map to FashionItem type with defaults
  const fashionItems: FashionItem[] = items.map((item) => ({
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

  const outfits = generateOutfits(fashionItems, context);

  return NextResponse.json(outfits);
}
