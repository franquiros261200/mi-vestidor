import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { anthropicKey: true },
  });

  if (!user?.anthropicKey) {
    return NextResponse.json({ error: "Sin API key configurada" }, { status: 400 });
  }

  const { items, score, breakdown, context } = await req.json();

  const anthropic = new Anthropic({ apiKey: user.anthropicKey });

  const itemDescriptions = items.map((i: any) =>
    `${i.category}${i.brand ? ` ${i.brand}` : ""} (${i.colorNames?.join(", ") || "sin color"}, estilo: ${i.style || "no definido"}, formalidad: ${i.formality}/5)`
  ).join("\n- ");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Sos un asesor de moda argentino. Explicá en 3-4 oraciones cortas por qué este outfit funciona bien. Sé directo, usá lunfardo suave, no seas cursi. Hablá de la combinación de colores, estilos y para qué ocasión va.

Outfit (puntaje ${score}/100):
- ${itemDescriptions}

Contexto: ${context?.occasion ? `Ocasión: ${context.occasion}.` : ""} ${context?.weather ? `Clima: ${context.weather}.` : ""}

Desglose: colores ${breakdown.colorHarmony}/25, estilo ${breakdown.styleCompat}/25, ocasión ${breakdown.occasionFit}/20, clima ${breakdown.weatherFit}/15, balance ${breakdown.visualBalance}/15.

Respondé SOLO la justificación, sin título ni formato.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({ justification: text.trim() });
}
