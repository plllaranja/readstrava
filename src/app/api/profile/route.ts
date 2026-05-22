import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { sanitizeOptional } from "@/lib/sanitize";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(300).optional().nullable(),
  isPublic: z.boolean().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
      ...(parsed.data.bio !== undefined && { bio: sanitizeOptional(parsed.data.bio) }),
      ...(parsed.data.isPublic !== undefined && { isPublic: parsed.data.isPublic }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
    },
    select: { username: true, name: true, avatarUrl: true, isPublic: true, bio: true },
  });

  return NextResponse.json({ user: updated });
}
