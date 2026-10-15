import { NextResponse } from "next/server";
import { authenticate, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, email: true, name: true },
  });
  return user
    ? NextResponse.json({
        user_id: user.userId,
        email: user.email,
        name: user.name,
      })
    : unauthorized();
}
