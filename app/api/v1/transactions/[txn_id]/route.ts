import { NextResponse } from "next/server";
import { authenticate, notFound, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
export async function GET(
  request: Request,
  context: { params: Promise<{ txn_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { txn_id } = await context.params;
  const item = await prisma.transaction.findFirst({
    where: { txnId: txn_id, card: { userId: uid } },
  });
  return item ? NextResponse.json(item) : notFound();
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ txn_id: string }> },
) {
  const uid = await authenticate(request);
  if (!uid) return unauthorized();
  const { txn_id } = await context.params;
  const item = await prisma.transaction.findFirst({
    where: { txnId: txn_id, card: { userId: uid } },
  });
  if (!item) return notFound();
  if (item.txnType === "INSTALLMENT")
    return NextResponse.json(
      { error: { code: "installment_row", message: "ลบงวดผ่อนผ่านแผนผ่อน" } },
      { status: 409 },
    );
  await prisma.transaction.delete({ where: { txnId: txn_id } });
  return new NextResponse(null, { status: 204 });
}
