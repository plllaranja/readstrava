import { prisma } from "./prisma";

export const ACHIEVEMENT_TYPES = {
  FIRST_SESSION: "first_session",
  MARATHON_READER: "marathon_reader",      // 100 pages in one day
  CONSISTENT_7: "consistent_7",           // 7 day streak
  CONSISTENT_30: "consistent_30",         // 30 day streak
  DEVOURER: "devourer",                   // 5 books in a month
  NIGHT_OWL: "night_owl",                 // 10 sessions after 22h
  EXPLORER: "explorer",                   // 5 different genres
  BOOKS_10: "books_10",
  BOOKS_25: "books_25",
  BOOKS_50: "books_50",
  BOOKS_100: "books_100",
} as const;

export const ACHIEVEMENT_META: Record<string, { title: string; description: string; icon: string }> = {
  first_session: { title: "Primeira Página", description: "Registrou sua primeira sessão de leitura", icon: "📖" },
  marathon_reader: { title: "Maratonista", description: "100 páginas em um único dia", icon: "🏃" },
  consistent_7: { title: "Consistente", description: "7 dias seguidos lendo", icon: "🔥" },
  consistent_30: { title: "Imparável", description: "30 dias seguidos lendo", icon: "⚡" },
  devourer: { title: "Devorador", description: "5 livros em um mês", icon: "🌊" },
  night_owl: { title: "Coruja", description: "10 sessões após as 22h", icon: "🦉" },
  explorer: { title: "Explorador", description: "5 gêneros diferentes lidos", icon: "🧭" },
  books_10: { title: "Leitor", description: "10 livros concluídos", icon: "📚" },
  books_25: { title: "Bibliófilo", description: "25 livros concluídos", icon: "🎓" },
  books_50: { title: "Erudito", description: "50 livros concluídos", icon: "🏆" },
  books_100: { title: "Lendário", description: "100 livros concluídos", icon: "👑" },
};

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const newAchievements: string[] = [];

  const sessions = await prisma.readingSession.findMany({
    where: { userId, endedAt: { not: null } },
    include: { book: true },
    orderBy: { startedAt: "desc" },
  });

  if (sessions.length === 1) {
    await awardIfNew(userId, ACHIEVEMENT_TYPES.FIRST_SESSION, newAchievements);
  }

  const todayPages = sessions
    .filter((s) => {
      const today = new Date();
      const d = new Date(s.startedAt);
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);

  if (todayPages >= 100) {
    await awardIfNew(userId, ACHIEVEMENT_TYPES.MARATHON_READER, newAchievements);
  }

  const streak = await calculateStreak(userId);
  if (streak >= 7) await awardIfNew(userId, ACHIEVEMENT_TYPES.CONSISTENT_7, newAchievements);
  if (streak >= 30) await awardIfNew(userId, ACHIEVEMENT_TYPES.CONSISTENT_30, newAchievements);

  const completedBooks = await prisma.book.count({ where: { userId, status: "COMPLETED" } });
  if (completedBooks >= 10) await awardIfNew(userId, ACHIEVEMENT_TYPES.BOOKS_10, newAchievements);
  if (completedBooks >= 25) await awardIfNew(userId, ACHIEVEMENT_TYPES.BOOKS_25, newAchievements);
  if (completedBooks >= 50) await awardIfNew(userId, ACHIEVEMENT_TYPES.BOOKS_50, newAchievements);
  if (completedBooks >= 100) await awardIfNew(userId, ACHIEVEMENT_TYPES.BOOKS_100, newAchievements);

  return newAchievements;
}

async function awardIfNew(userId: string, type: string, list: string[]) {
  try {
    await prisma.achievement.create({ data: { userId, type } });
    list.push(type);
  } catch {
    // already exists
  }
}

export async function calculateStreak(userId: string): Promise<number> {
  const sessions = await prisma.readingSession.findMany({
    where: { userId, endedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  if (!sessions.length) return 0;

  const days = new Set(sessions.map((s) => new Date(s.startedAt).toDateString()));
  const daysArr = Array.from(days).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const day of daysArr) {
    const d = new Date(day);
    const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }

  return streak;
}
