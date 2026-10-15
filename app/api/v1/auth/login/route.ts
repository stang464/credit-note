import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "validation_error", message: "ข้อมูลไม่ถูกต้อง" } }, { status: 422 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const invalid = () => NextResponse.json(
    { error: { code: "invalid_credentials", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } },
    { status: 401 },
  );

  if (!email || !password) return invalid();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) return invalid();

  const rawToken = randomBytes(32).toString("hex");
  await prisma.apiToken.create({
    data: {
      userId: user.userId,
      tokenHash: tokenHash(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
    },
  });
  await prisma.user.update({ where: { userId: user.userId }, data: { lastLoginAt: new Date() } });

  return NextResponse.json({
    access_token: rawToken,
    token_type: "Bearer",
    expires_in: TOKEN_TTL_SECONDS,
    user: { user_id: user.userId, email: user.email, name: user.name },
  });
}
