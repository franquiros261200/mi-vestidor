import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — listar outfits del usuario
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const occasion = searchParams.get("occasion");
  const weather = searchParams.get("weather");

  const where: any = { userId: session.user.id };
  if (occasion) where.occasion = occasion;
  if (weather) where.weather = weather;

  const outfits = await prisma.outfit.findMany({
    where,
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              imageUrl: true,
              thumbnailUrl: true,
              category: true,
              colorNames: true,
              colors: true,
              brand: true,
            },
          },
        },
        orderBy: { layer: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(outfits);
}

// POST — crear outfit
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { name, occasion, weather, notes, itemIds } = await req.json();

  if (!name || !itemIds?.length) {
    return NextResponse.json({ error: "Nombre y prendas requeridos" }, { status: 400 });
  }

  const outfit = await prisma.outfit.create({
    data: {
      userId: session.user.id,
      name,
      occasion: occasion || null,
      weather: weather || null,
      notes: notes || null,
      items: {
        create: itemIds.map((itemId: string, index: number) => ({
          itemId,
          layer: index,
        })),
      },
    },
    include: {
      items: {
        include: { item: true },
        orderBy: { layer: "asc" },
      },
    },
  });

  return NextResponse.json(outfit);
}

// PATCH — editar outfit
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, name, occasion, weather, notes, rating } = await req.json();

  await prisma.outfit.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(occasion !== undefined && { occasion }),
      ...(weather !== undefined && { weather }),
      ...(notes !== undefined && { notes }),
      ...(rating !== undefined && { rating }),
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — eliminar outfit
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await req.json();

  await prisma.outfit.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
