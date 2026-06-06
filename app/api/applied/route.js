import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const keyOf = (a) => `${a.weekYear}-${a.weekNumber}-${a.chart}-${a.nmNumber}`;

// GET /api/applied — compact list of keys the user has marked applied
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.appliedCorrection.findMany({
    where: { userId: session.user.id },
    select: { chart: true, nmNumber: true, weekYear: true, weekNumber: true },
  });
  return NextResponse.json({ applied: rows.map(keyOf) });
}

// POST /api/applied — toggle one correction's applied state
// body: { chart, nmNumber, weekYear, weekNumber, applied: boolean }
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chart = parseInt(body?.chart, 10);
  const weekYear = parseInt(body?.weekYear, 10);
  const weekNumber = parseInt(body?.weekNumber, 10);
  const nmNumber = typeof body?.nmNumber === "string" ? body.nmNumber : null;
  const applied = !!body?.applied;

  if (!chart || !weekYear || !weekNumber || !nmNumber) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const where = {
    appliedKey: { userId: session.user.id, weekYear, weekNumber, chart, nmNumber },
  };

  if (applied) {
    await prisma.appliedCorrection.upsert({
      where,
      update: {},
      create: { userId: session.user.id, weekYear, weekNumber, chart, nmNumber },
    });
  } else {
    await prisma.appliedCorrection
      .delete({ where })
      .catch(() => {}); // already absent — fine
  }

  return NextResponse.json({ ok: true, applied });
}
