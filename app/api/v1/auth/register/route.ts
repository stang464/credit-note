import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function error(message: string, status: number, code: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return error("ข้อมูลไม่ถูกต้อง", 422, "validation_error");
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const name = body.name?.trim() || email?.split("@")[0] || "ผู้ใช้ใหม่";

  if (!email || !email.includes("@") || password.length < 8 || name.length > 60) {
    return error("ข้อมูลไม่ถูกต้อง: อีเมลหรือรหัสผ่านไม่ถูกต้อง", 422, "validation_error");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const rawToken = randomBytes(32).toString("hex");

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        apiTokens: {
          create: {
            tokenHash: tokenHash(rawToken),
            expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
          },
        },
      },
      select: { userId: true, email: true, name: true },
    });

    return NextResponse.json({
      access_token: rawToken,
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
      user: { user_id: user.userId, email: user.email, name: user.name },
    }, { status: 201 });
  } catch (cause) {
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "P2002") {
      return error("อีเมลนี้ถูกใช้งานแล้ว", 409, "email_taken");
    }
    return error("ไม่สามารถสมัครสมาชิกได้", 500, "internal_error");
  }
}
