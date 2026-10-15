import { NextResponse } from "next/server";
import { authenticate, unauthorized, validation } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await authenticate(request); if (!userId) return unauthorized();
  const items = await prisma.card.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}
export async function POST(request: Request) {
  const userId = await authenticate(request); if (!userId) return unauthorized();
  const body = await request.json();
  if (!body.name || !body.credit_limit || !body.statement_day || !body.due_day) return validation("กรุณากรอกข้อมูลบัตรให้ครบ");
  try {
    const card = await prisma.card.create({ data: { userId, name: body.name, bank: body.bank ?? null, last4: body.last4 ?? null, creditLimit: body.credit_limit, statementDay: body.statement_day, dueDay: body.due_day, color: body.color ?? "blue" } });
    return NextResponse.json(card, { status: 201 });
  } catch { return NextResponse.json({ error: { code: "duplicate_name", message: "ชื่อบัตรซ้ำ" } }, { status: 409 }); }
}
