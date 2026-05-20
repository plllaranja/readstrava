import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("refresh_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const result = await rotateRefreshToken(token);
  if (!result) {
    const res = NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
    res.cookies.delete("refresh_token");
    return res;
  }

  const res = NextResponse.json({ accessToken: result.accessToken });
  res.cookies.set("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth",
  });

  return res;
}
