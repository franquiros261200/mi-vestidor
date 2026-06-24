import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";

// GET /api/items — listar prendas del usuario con filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const season = searchParams.get("season");
  const occasion = searchParams.get("occasion");
  const favorite = searchParams.get("favorite");
  const archived = searchParams.get("archived");
  const search = searchParams.get("q");

  const where: any = {
    userId: session.user.id,
    archived: archived === "true" ? true : false,
  };

  if (category) where.category = category;
  if (season) where.seasons = { has: season };
  if (occasion) where.occasions = { has: occasion };
  if (favorite === "true") where.favorite = true;
  if (search) {
    where.OR = [
      { category: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { colorNames: { hasSome: [search.toLowerCase()] } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// PATCH /api/items — actualizar prenda
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, ...data } = await req.json();

  const item = await prisma.item.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json(item);
}

// DELETE /api/items — eliminar prenda
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await req.json();

  // Buscar para obtener publicId de Cloudinary
  const item = await prisma.item.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Borrar de Cloudinary
  await deleteImage(item.imagePublicId);

  // Borrar de DB
  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
