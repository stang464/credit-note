import { NextResponse } from "next/server";
import { authenticate, notFound, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
async function get(uid: string, id: string) {
  return prisma.installmentPlan.findFirst({
    where: { planId: id, card: { userId: uid } },
    include: { transactions: { orderBy: { installmentNo: "asc" } } },
  });
}
function result(p: NonNullable<Awaited<ReturnType<typeof get>>>) {
  const { transactions, ...data } = p;
  return {
    ...data,
    paid_terms: transactions.filter((t) => t.status === "PAID").length,
    remaining_terms: transactions.filter((t) => t.status === "PENDING").length,
    remaining_balance: transactions
      .filter((t) => t.status === "PENDING")
      .reduce((n, t) => n + Number(t.amount), 0),
  };
}
export async function GET(
  request: Request,
  context: { params: Promise<{ plan_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { plan_id } = await context.params;
  const p = await get(uid, plan_id);
  return p ? NextResponse.json(result(p)) : notFound();
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ plan_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { plan_id } = await context.params;
  if (!(await get(uid, plan_id))) return notFound();
  await prisma.installmentPlan.delete({ where: { planId: plan_id } });
  return new NextResponse(null, { status: 204 });
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ plan_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { plan_id } = await context.params;
  const old = await get(uid, plan_id);
  if (!old) return notFound();
  const b = await request.json();
  const paid =
    b.paid_terms ?? old.transactions.filter((t) => t.status === "PAID").length;
  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: { planId: plan_id, status: "PENDING" },
    });
    await tx.installmentPlan.update({
      where: { planId: plan_id },
      data: {
        ...(b.item_name !== undefined ? { itemName: b.item_name } : {}),
        ...(b.term_count !== undefined ? { termCount: b.term_count } : {}),
        ...(b.monthly_amount !== undefined
          ? { monthlyAmount: b.monthly_amount }
          : {}),
      },
    });
  });
  const updated = await get(uid, plan_id);
  return updated ? NextResponse.json(result(updated)) : notFound();
}
