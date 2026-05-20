import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sanitizeOptional } from "@/lib/sanitize";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(200),
  totalPages: z.number().int().min(1).max(99999),
  publisher: z.string().max(200).optional(),
  coverUrl: z.string().url().optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  status: z.enum(["READING", "COMPLETED", "PAUSED", "WISHLIST"]).default("READING"),
  googleBooksId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = {
    userId: user.userId,
    ...(status ? { status: status as any } : {}),
  };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        sessions: {
          select: { pagesRead: true, durationSeconds: true },
        },
      },
    }),
    prisma.book.count({ where }),
  ]);

  const enriched = books.map((b) => {
    const pagesRead = b.sessions.reduce((s, sess) => s + (sess.pagesRead ?? 0), 0);
    const totalTime = b.sessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0);
    return {
      ...b,
      sessions: undefined,
      pagesRead,
      totalTimeSeconds: totalTime,
      progressPercent: b.totalPages > 0 ? Math.min(100, Math.round((pagesRead / b.totalPages) * 100)) : 0,
    };
  });

  return NextResponse.json({ books: enriched, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const book = await prisma.book.create({
    data: {
      userId: user.userId,
      title: data.title.trim(),
      author: data.author.trim(),
      totalPages: data.totalPages,
      publisher: sanitizeOptional(data.publisher),
      coverUrl: data.coverUrl ?? null,
      isbn: data.isbn ?? null,
      genre: sanitizeOptional(data.genre),
      status: data.status,
      googleBooksId: data.googleBooksId ?? null,
      startedAt: data.status === "READING" ? new Date() : null,
    },
  });

  return NextResponse.json({ book }, { status: 201 });
}
