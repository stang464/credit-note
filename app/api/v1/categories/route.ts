import { NextResponse } from "next/server";
import { authenticate, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) { const uid = await authenticate(request); if (!uid) return unauthorized(); return NextResponse.json({ items: await prisma.category.findMany({ orderBy: { name: "asc" } }) }); }
