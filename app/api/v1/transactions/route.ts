import { NextResponse } from "next/server";
import { authenticate, unauthorized, validation } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  const q = new URL(request.url).searchParams;
  const items = await prisma.transaction.findMany({
    where: {
      card: { userId },
      ...(q.get("card_id") ? { cardId: q.get("card_id")! } : {}),
      ...(q.get("txn_type") ? { txnType: q.get("txn_type")! } : {}),
      ...(q.get("status") ? { status: q.get("status")! } : {}),
      ...(q.get("plan_id") ? { planId: q.get("plan_id")! } : {}),
      ...(q.get("statement_month")
        ? { statementMonth: new Date(q.get("statement_month")!) }
        : {}),
    },
    orderBy: { txnDate: "desc" },
  });
  return NextResponse.json({ items });
}
export async function POST(request: Request) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  const b = await request.json();
  if (!b.card_id || !b.txn_date || !b.amount)
    return validation("กรุณากรอกข้อมูลรายการให้ครบ");
  const card = await prisma.card.findFirst({
    where: { cardId: b.card_id, userId },
  });
  if (!card) return validation("ไม่พบบัตรของผู้ใช้");
  const date = new Date(b.txn_date);
  const month = new Date(
    date.getFullYear(),
    date.getMonth() + (date.getDate() > card.statementDay ? 1 : 0),
    1,
  );
  const item = await prisma.transaction.create({
    data: {
      cardId: card.cardId,
      categoryId: b.category_id ?? null,
      txnType: b.txn_type ?? "PURCHASE",
      txnDate: date,
      statementMonth: month,
      description: b.description ?? null,
      amount: b.amount,
      status: "POSTED",
    },
  });
  return NextResponse.json(item, { status: 201 });
}
