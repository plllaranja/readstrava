import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateStreak, ACHIEVEMENT_META } from "@/lib/achievements";
import { startOfWeek, startOfMonth, startOfYear, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    weekSessions,
    monthSessions,
    yearSessions,
    allSessions,
    completedThisYear,
    achievements,
    activeSession,
  ] = await Promise.all([
    prisma.readingSession.findMany({
      where: { userId: user.userId, startedAt: { gte: weekStart }, endedAt: { not: null } },
      select: { pagesRead: true, durationSeconds: true, pacePerHour: true, startedAt: true },
    }),
    prisma.readingSession.findMany({
      where: { userId: user.userId, startedAt: { gte: monthStart }, endedAt: { not: null } },
      select: { pagesRead: true, durationSeconds: true },
    }),
    prisma.readingSession.findMany({
      where: { userId: user.userId, startedAt: { gte: yearStart }, endedAt: { not: null } },
      select: { pagesRead: true, durationSeconds: true, startedAt: true },
    }),
    prisma.readingSession.findMany({
      where: { userId: user.userId, endedAt: { not: null } },
      select: { pagesRead: true, durationSeconds: true, pacePerHour: true, startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
    prisma.book.count({ where: { userId: user.userId, status: "COMPLETED", finishedAt: { gte: yearStart } } }),
    prisma.achievement.findMany({ where: { userId: user.userId }, orderBy: { unlockedAt: "desc" } }),
    prisma.readingSession.findFirst({ where: { userId: user.userId, isActive: true } }),
  ]);

  const sum = (arr: { pagesRead: number | null }[]) => arr.reduce((s, r) => s + (r.pagesRead ?? 0), 0);
  const sumTime = (arr: { durationSeconds: number | null }[]) => arr.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);

  // Heatmap: last 365 days
  const heatmap: Record<string, number> = {};
  for (const s of allSessions) {
    const day = format(new Date(s.startedAt), "yyyy-MM-dd");
    heatmap[day] = (heatmap[day] ?? 0) + (s.pagesRead ?? 0);
  }

  // Monthly pace trend (last 12 months)
  const paceByMonth: Record<string, number[]> = {};
  for (const s of allSessions) {
    if (!s.pacePerHour) continue;
    const month = format(new Date(s.startedAt), "yyyy-MM");
    if (!paceByMonth[month]) paceByMonth[month] = [];
    paceByMonth[month].push(s.pacePerHour);
  }
  const paceTrend = Object.entries(paceByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, paces]) => ({
      month,
      avgPace: Math.round((paces.reduce((s, p) => s + p, 0) / paces.length) * 10) / 10,
    }));

  const streak = await calculateStreak(user.userId);

  const enrichedAchievements = achievements.map((a) => ({
    ...a,
    meta: ACHIEVEMENT_META[a.type] ?? { title: a.type, description: "", icon: "⭐" },
  }));

  return NextResponse.json({
    stats: {
      week: { pages: sum(weekSessions), timeSeconds: sumTime(weekSessions) },
      month: { pages: sum(monthSessions), timeSeconds: sumTime(monthSessions) },
      year: { pages: sum(yearSessions), timeSeconds: sumTime(yearSessions), completedBooks: completedThisYear },
      streak,
    },
    heatmap,
    paceTrend,
    achievements: enrichedAchievements,
    activeSession,
  });
}
