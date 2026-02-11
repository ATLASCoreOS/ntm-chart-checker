import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let folio = await prisma.chartFolio.findUnique({
    where: { userId: session.user.id },
  });

  // Create default folio if none exists
  if (!folio) {
    folio = await prisma.chartFolio.create({
      data: { userId: session.user.id, charts: DEFAULT_CHARTS },
    });
  }

  return NextResponse.json({ charts: folio.charts });
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { charts } = await request.json();
  const validated = validateCharts(charts);

  if (validated.length === 0) {
    return NextResponse.json(
      { error: "No valid chart numbers provided" },
      { status: 400 }
    );
  }

  if (validated.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 charts allowed" },
      { status: 400 }
    );
  }

  const folio = await prisma.chartFolio.upsert({
    where: { userId: session.user.id },
    update: { charts: validated },
    create: { userId: session.user.id, charts: validated },
  });

  return NextResponse.json({ charts: folio.charts });
}
