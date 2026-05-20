import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { sanitizeOptional } from "@/lib/sanitize";

const stopTimerSchema = z.object({
  action: z.literal("stop"),
  endPage: z.number().int().min(0),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  locationTag: z.enum(["home", "cafe", "transit", "other"]).optional().nullable(),
  highlight: z.string().max(1000).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await prisma.readingSession.findFirst({
    where: { id: sessionId, userId: user.userId },
    include: {
      book: { select: { id: true, title: true, author: true, coverUrl: true, totalPages: true } },
      kudos: { select: { userId: true, user: { select: { username: true, avatarUrl: true } } } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true, name: true, avatarUrl: true } } },
      },
    },
  });

  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  return NextResponse.json({ session });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await prisma.readingSession.findFirst({ where: { id: sessionId, userId: user.userId } });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = stopTimerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const durationSeconds = Math.round((now.getTime() - session.startedAt.getTime()) / 1000);
  const pagesRead = Math.max(0, parsed.data.endPage - session.startPage);
  const pacePerHour = durationSeconds > 0 ? (pagesRead / durationSeconds) * 3600 : null;

  const updated = await prisma.readingSession.update({
    where: { id: sessionId },
    data: {
      endPage: parsed.data.endPage,
      pagesRead,
      endedAt: now,
      durationSeconds,
      pacePerHour,
      mood: parsed.data.mood,
      locationTag: parsed.data.locationTag,
      highlight: sanitizeOptional(parsed.data.highlight),
      isActive: false,
    },
    include: { book: { select: { id: true, title: true, author: true, coverUrl: true, totalPages: true } } },
  });

  const book = updated.book as any;
  if (parsed.data.endPage >= book.totalPages) {
    await prisma.book.update({
      where: { id: session.bookId },
      data: { status: "COMPLETED", finishedAt: now },
    });
  }

  const newAchievements = await checkAndAwardAchievements(user.userId);

  return NextResponse.json({ session: updated, newAchievements });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await prisma.readingSession.findFirst({ where: { id: sessionId, userId: user.userId } });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  await prisma.readingSession.delete({ where: { id: sessionId } });
  return NextResponse.json({ success: true });
}
