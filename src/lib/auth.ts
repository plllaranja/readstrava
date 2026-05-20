import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_SECRET must be set");
}

export interface JWTPayload {
  userId: string;
  username: string;
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = verifyRefreshToken(oldToken);
  if (!payload) return null;

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { token: oldToken } });
    return null;
  }

  await prisma.refreshToken.delete({ where: { token: oldToken } });

  const newPayload: JWTPayload = { userId: payload.userId, username: payload.username };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}
