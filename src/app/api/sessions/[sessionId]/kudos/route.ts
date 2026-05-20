import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const session = await prisma.readingSession.findFirst({
    where: { id: sessionId },
    include: { user: { select: { isPublic: true } } },
  });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  if (!session.user.isPublic && session.userId !== user.userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    await prisma.kudos.create({ data: { sessionId, userId: user.userId } });

    if (session.userId !== user.userId) {
      await prisma.notification.create({
        data: {
          userId: session.userId,
          type: "kudos",
          data: { fromUserId: user.userId, fromUsername: user.username, sessionId },
        },
      });
    }
  } catch {
    // already kudos'd — remove it (toggle)
    await prisma.kudos.delete({ where: { sessionId_userId: { sessionId, userId: user.userId } } });
    return NextResponse.json({ kudosed: false });
  }

  return NextResponse.json({ kudosed: true });
}
