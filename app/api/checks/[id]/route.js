import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const check = await prisma.check.findUnique({ where: { id } });

  if (!check || check.userId !== session.user.id) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: check.id,
    weekYear: check.weekYear,
    weekNumber: check.weekNumber,
    charts: check.charts,
    results: check.results,
    checkedAt: check.checkedAt,
  });
}
