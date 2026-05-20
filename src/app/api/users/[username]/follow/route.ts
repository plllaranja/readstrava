import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (target.id === user.userId) {
    return NextResponse.json({ error: "Não pode seguir a si mesmo" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.userId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: user.userId, followingId: target.id } },
    });
    return NextResponse.json({ following: false });
  }

  await prisma.follow.create({ data: { followerId: user.userId, followingId: target.id } });

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "follow",
      data: { fromUsername: user.username },
    },
  });

  return NextResponse.json({ following: true });
}
