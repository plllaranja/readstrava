import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

const schema = z.object({ content: z.string().min(1).max(500) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await prisma.readingSession.findFirst({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      sessionId,
      userId: user.userId,
      content: sanitizeText(parsed.data.content),
    },
    include: { user: { select: { username: true, name: true, avatarUrl: true } } },
  });

  if (session.userId !== user.userId) {
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: "comment",
        data: { fromUsername: user.username, sessionId, commentId: comment.id },
      },
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
