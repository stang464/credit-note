import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) await prisma.apiToken.updateMany({ where: { tokenHash: createHash("sha256").update(token).digest("hex"), revokedAt: null }, data: { revokedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
