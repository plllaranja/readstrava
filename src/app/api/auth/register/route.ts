import { NextRequest, NextResponse } from "next/server";
import { hash } from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`auth:register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { username, email, password, name } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, username: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: existing.username === username ? "Username já em uso" : "Email já em uso" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password);

  const user = await prisma.user.create({
    data: {
      username: sanitizeText(username.toLowerCase()),
      email,
      passwordHash,
      name: sanitizeText(name),
    },
    select: { id: true, username: true, name: true, avatarUrl: true, isPublic: true },
  });

  const payload = { userId: user.id, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const res = NextResponse.json({ user, accessToken }, { status: 201 });
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth",
  });

  return res;
}
