import { NextResponse } from "next/server";
import { authenticate, notFound, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
export async function POST(
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
  const row = await prisma.transaction.findFirst({
    where: { planId: plan_id, status: "PAID" },
    orderBy: { installmentNo: "desc" },
  });
  if (!row)
    return NextResponse.json(
      { error: { code: "nothing_to_undo", message: "ไม่มีงวดที่จ่ายแล้ว" } },
      { status: 409 },
    );
  await prisma.transaction.update({
    where: { txnId: row.txnId },
    data: { status: "PENDING", paidAt: null },
  });
  return NextResponse.json(
    await prisma.installmentPlan.findUnique({ where: { planId: plan_id } }),
  );
}
