import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const currentUser = await getAuthUser(req);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      isPublic: true,
      createdAt: true,
      _count: { select: { followers: true, following: true, books: true } },
      achievements: { orderBy: { unlockedAt: "desc" }, take: 10 },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const isOwner = currentUser?.userId === user.id;
  const isFollowing = currentUser
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUser.userId, followingId: user.id } },
      }))
    : false;

  if (!user.isPublic && !isOwner && !isFollowing) {
    return NextResponse.json({ error: "Perfil privado" }, { status: 403 });
  }

  const [completedBooks, totalPages, totalTime] = await Promise.all([
    prisma.book.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.readingSession.aggregate({ where: { userId: user.id }, _sum: { pagesRead: true } }),
    prisma.readingSession.aggregate({ where: { userId: user.id }, _sum: { durationSeconds: true } }),
  ]);

  return NextResponse.json({
    user: {
      ...user,
      id: undefined,
    },
    stats: {
      completedBooks,
      totalPages: totalPages._sum.pagesRead ?? 0,
      totalTimeSeconds: totalTime._sum.durationSeconds ?? 0,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    },
    isFollowing,
    isOwner,
  });
}
