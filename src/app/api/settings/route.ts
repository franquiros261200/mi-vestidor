import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — check if user has keys configured
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { anthropicKey: true },
  });

  return NextResponse.json({
    hasAnthropicKey: !!user?.anthropicKey,
  });
}

// POST — save API keys
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { anthropicKey } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      anthropicKey: anthropicKey || null,
    },
  });

  return NextResponse.json({ ok: true });
}
