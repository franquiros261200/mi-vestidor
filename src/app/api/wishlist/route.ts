import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ purchased: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const data = await req.json();

  const item = await prisma.wishlistItem.create({
    data: {
      userId: session.user.id,
      name: data.name,
      category: data.category || null,
      imageUrl: data.imageUrl || null,
      link: data.link || null,
      price: data.price ? parseFloat(data.price) : null,
      priority: data.priority || 0,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, ...data } = await req.json();

  await prisma.wishlistItem.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  await prisma.wishlistItem.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
