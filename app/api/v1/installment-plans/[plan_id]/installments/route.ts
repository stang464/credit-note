import { NextResponse } from "next/server";
import { authenticate, notFound, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
export async function GET(
  request: Request,
  context: { params: Promise<{ plan_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { plan_id } = await context.params;
  const plan = await prisma.installmentPlan.findFirst({
    where: { planId: plan_id, card: { userId: uid } },
  });
  if (!plan) return notFound();
  return NextResponse.json({
    items: await prisma.transaction.findMany({
      where: { planId: plan_id },
      orderBy: { installmentNo: "asc" },
    }),
  });
}
