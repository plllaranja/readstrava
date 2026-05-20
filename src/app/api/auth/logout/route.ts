import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("refresh_token")?.value;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("refresh_token");
  return res;
}
