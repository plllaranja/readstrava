import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20"));

  const following = await prisma.follow.findMany({
    where: { followerId: user.userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const sessions = await prisma.readingSession.findMany({
    where: {
      userId: { in: [...followingIds, user.userId] },
      endedAt: { not: null },
      user: { isPublic: true },
    },
    orderBy: { endedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
      _count: { select: { kudos: true, comments: true } },
      kudos: { where: { userId: user.userId }, select: { userId: true } },
    },
  });

  const enriched = sessions.map((s) => ({
    ...s,
    hasKudos: s.kudos.length > 0,
    kudos: undefined,
    kudosCount: s._count.kudos,
    commentsCount: s._count.comments,
    _count: undefined,
  }));

  return NextResponse.json({ sessions: enriched, page, limit });
}
