import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — items in laundry
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const items = await prisma.item.findMany({
    where: { userId: session.user.id, inLaundry: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

// PATCH — toggle laundry or wash all
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { itemId, washAll } = await req.json();

  if (washAll) {
    await prisma.item.updateMany({
      where: { userId: session.user.id, inLaundry: true },
      data: { inLaundry: false },
    });
    return NextResponse.json({ ok: true });
  }

  if (itemId) {
    const item = await prisma.item.findFirst({ where: { id: itemId, userId: session.user.id } });
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.item.update({
      where: { id: itemId },
      data: { inLaundry: !item.inLaundry },
    });
    return NextResponse.json({ ok: true, inLaundry: !item.inLaundry });
  }

  return NextResponse.json({ error: "itemId o washAll requerido" }, { status: 400 });
}
