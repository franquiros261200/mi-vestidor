import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Devuelve lista de items que probablemente están mal clasificados
// (todos los que están marcados como default "remera" sin colores/estilo)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const items = await prisma.item.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { colors: { isEmpty: true } },
        { style: null },
        { AND: [{ category: "remera" }, { colorNames: { isEmpty: true } }] },
      ],
    },
    select: { id: true, imageUrl: true, category: true, thumbnailUrl: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
