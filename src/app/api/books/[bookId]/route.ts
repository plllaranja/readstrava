import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sanitizeOptional } from "@/lib/sanitize";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  author: z.string().min(1).max(200).optional(),
  totalPages: z.number().int().min(1).max(99999).optional(),
  status: z.enum(["READING", "COMPLETED", "PAUSED", "WISHLIST"]).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  review: z.string().max(5000).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
});

async function getBook(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await getBook(bookId, user.userId);
  if (!book) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

  const sessions = await prisma.readingSession.findMany({
    where: { bookId, userId: user.userId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const pagesRead = sessions.reduce((s, sess) => s + (sess.pagesRead ?? 0), 0);
  const totalTime = sessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0);
  const avgPace = sessions.filter((s) => s.pacePerHour).reduce((sum, s, _, arr) => sum + (s.pacePerHour ?? 0) / arr.length, 0);

  const lastSession = sessions[0];
  let estimatedDaysLeft: number | null = null;
  if (lastSession && avgPace > 0 && book.totalPages > pagesRead) {
    const remainingPages = book.totalPages - pagesRead;
    const hoursLeft = remainingPages / avgPace;
    const recentAvgSessionHours = totalTime / sessions.length / 3600;
    estimatedDaysLeft = Math.ceil(hoursLeft / Math.max(recentAvgSessionHours, 0.5));
  }

  return NextResponse.json({
    book: {
      ...book,
      pagesRead,
      totalTimeSeconds: totalTime,
      progressPercent: book.totalPages > 0 ? Math.min(100, Math.round((pagesRead / book.totalPages) * 100)) : 0,
      avgPacePerHour: Math.round(avgPace * 10) / 10,
      estimatedDaysLeft,
    },
    sessions,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const existing = await getBook(bookId, user.userId);
  if (!existing) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: any = { ...data };

  if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    updateData.finishedAt = new Date();
  }
  if (data.status === "READING" && existing.status !== "READING") {
    updateData.startedAt = existing.startedAt ?? new Date();
  }
  if (data.review) updateData.review = sanitizeOptional(data.review);

  const book = await prisma.book.update({ where: { id: bookId }, data: updateData });
  return NextResponse.json({ book });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const existing = await getBook(bookId, user.userId);
  if (!existing) return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });

  await prisma.book.delete({ where: { id: bookId } });
  return NextResponse.json({ success: true });
}
