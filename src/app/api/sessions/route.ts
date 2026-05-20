import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { sanitizeOptional } from "@/lib/sanitize";

const manualSchema = z.object({
  bookId: z.string().uuid(),
  startPage: z.number().int().min(0),
  endPage: z.number().int().min(0),
  startedAt: z.string().datetime(),
  durationSeconds: z.number().int().min(0).optional(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  locationTag: z.enum(["home", "cafe", "transit", "other"]).optional().nullable(),
  highlight: z.string().max(1000).optional().nullable(),
});

const startTimerSchema = z.object({
  bookId: z.string().uuid(),
  startPage: z.number().int().min(0),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20"));
  const bookId = req.nextUrl.searchParams.get("bookId");

  const [sessions, total] = await Promise.all([
    prisma.readingSession.findMany({
      where: { userId: user.userId, ...(bookId ? { bookId } : {}) },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true } },
        _count: { select: { kudos: true, comments: true } },
      },
    }),
    prisma.readingSession.count({ where: { userId: user.userId } }),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const mode = body?.mode ?? "manual";

  if (mode === "timer_start") {
    const parsed = startTimerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const book = await prisma.book.findFirst({ where: { id: parsed.data.bookId, userId: user.userId } });
    if (!book) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

    await prisma.readingSession.updateMany({
      where: { userId: user.userId, isActive: true },
      data: { isActive: false },
    });

    const session = await prisma.readingSession.create({
      data: {
        userId: user.userId,
        bookId: parsed.data.bookId,
        startPage: parsed.data.startPage,
        startedAt: new Date(),
        isActive: true,
      },
      include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
    });

    return NextResponse.json({ session }, { status: 201 });
  }

  const parsed = manualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { bookId, startPage, endPage, startedAt, durationSeconds, mood, locationTag, highlight } = parsed.data;

  const book = await prisma.book.findFirst({ where: { id: bookId, userId: user.userId } });
  if (!book) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

  if (endPage < startPage) {
    return NextResponse.json({ error: "Página final deve ser maior que a inicial" }, { status: 400 });
  }

  const pagesRead = endPage - startPage;
  const endedAt = new Date(new Date(startedAt).getTime() + (durationSeconds ?? 0) * 1000);
  const actualDuration = durationSeconds ?? 0;
  const pacePerHour = actualDuration > 0 ? (pagesRead / actualDuration) * 3600 : null;

  const session = await prisma.readingSession.create({
    data: {
      userId: user.userId,
      bookId,
      startPage,
      endPage,
      pagesRead,
      startedAt: new Date(startedAt),
      endedAt,
      durationSeconds: actualDuration,
      pacePerHour,
      mood,
      locationTag,
      highlight: sanitizeOptional(highlight),
      isActive: false,
    },
    include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
  });

  if (endPage >= book.totalPages && book.status === "READING") {
    await prisma.book.update({
      where: { id: bookId },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
  }

  const newAchievements = await checkAndAwardAchievements(user.userId);

  return NextResponse.json({ session, newAchievements }, { status: 201 });
}
