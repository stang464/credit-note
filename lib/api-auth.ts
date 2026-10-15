import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function authenticate(request: Request) {
  const value = request.headers.get("authorization");
  const token = value?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.apiToken.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
    select: { tokenId: true, userId: true },
  });
  if (!record) return null;
  await prisma.apiToken.update({ where: { tokenId: record.tokenId }, data: { lastUsedAt: new Date() } });
  return record.userId;
}

export function unauthorized() {
  return NextResponse.json({ error: { code: "unauthorized", message: "กรุณาเข้าสู่ระบบ" } }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: { code: "not_found", message: "ไม่พบข้อมูล" } }, { status: 404 });
}

export function validation(message: string) {
  return NextResponse.json({ error: { code: "validation_error", message } }, { status: 422 });
}
