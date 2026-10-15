import { NextResponse } from "next/server";
import { authenticate, notFound, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function owned(userId: string, id: string) { return prisma.card.findFirst({ where: { cardId: id, userId } }); }
export async function GET(request: Request, context: { params: Promise<{ card_id: string }> }) { const uid = await authenticate(request); if (!uid) return unauthorized(); const { card_id } = await context.params; const card = await owned(uid, card_id); return card ? NextResponse.json(card) : notFound(); }
export async function PATCH(request: Request, context: { params: Promise<{ card_id: string }> }) { const uid = await authenticate(request); if (!uid) return unauthorized(); const { card_id } = await context.params; if (!(await owned(uid, card_id))) return notFound(); const b = await request.json(); const data = Object.fromEntries(Object.entries({ name: b.name, bank: b.bank, last4: b.last4, creditLimit: b.credit_limit, statementDay: b.statement_day, dueDay: b.due_day, color: b.color, isActive: b.is_active }).filter(([, v]) => v !== undefined)); return NextResponse.json(await prisma.card.update({ where: { cardId: card_id }, data })); }
export async function DELETE(request: Request, context: { params: Promise<{ card_id: string }> }) { const uid = await authenticate(request); if (!uid) return unauthorized(); const { card_id } = await context.params; if (!(await owned(uid, card_id))) return notFound(); await prisma.card.delete({ where: { cardId: card_id } }); return new NextResponse(null, { status: 204 }); }
