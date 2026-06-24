import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — outfits in date range
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const outfits = await prisma.outfit.findMany({
    where: {
      userId: session.user.id,
      plannedDate: {
        gte: start ? new Date(start) : undefined,
        lte: end ? new Date(end) : undefined,
      },
    },
    include: {
      items: {
        include: { item: { select: { id: true, imageUrl: true, thumbnailUrl: true, category: true } } },
        orderBy: { layer: "asc" },
      },
    },
    orderBy: { plannedDate: "asc" },
  });

  return NextResponse.json(outfits);
}

// POST — assign outfit to date
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { outfitId, date } = await req.json();

  await prisma.outfit.updateMany({
    where: { id: outfitId, userId: session.user.id },
    data: { plannedDate: new Date(date) },
  });

  return NextResponse.json({ ok: true });
}
