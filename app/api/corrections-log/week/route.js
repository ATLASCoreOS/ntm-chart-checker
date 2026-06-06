import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { getWeekData } from "@/lib/weekData";
import { identifyPDFs } from "@/lib/scraper";
import { findCorrections } from "@/lib/parser";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Derive a short subject line from a correction excerpt
function subjectOf(excerpt) {
  if (!excerpt) return "";
  const first = excerpt.split("\n").find((l) => l.trim());
  if (!first) return "";
  return first.replace(/^\d{3,5}\*?\s*/, "").trim().slice(0, 120);
}

// GET /api/corrections-log/week?year=&week=
// Corrections affecting the active folio's charts for one week (cached).
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year"), 10);
  const week = parseInt(searchParams.get("week"), 10);
  if (!(year >= 2023 && year <= 2100 && week >= 1 && week <= 53)) {
    return NextResponse.json({ error: "Invalid year/week" }, { status: 400 });
  }

  // Active folio charts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeFolioId: true },
  });
  let folio = null;
  if (user?.activeFolioId) {
    folio = await prisma.chartFolio.findFirst({
      where: { id: user.activeFolioId, userId: session.user.id },
    });
  }
  if (!folio) {
    folio = await prisma.chartFolio.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
  }
  const charts = validateCharts(folio?.charts || DEFAULT_CHARTS);

  const { sniiText, links, weekInfo } = await getWeekData({ year, week });

  const items = [];
  if (sniiText) {
    const corrections = findCorrections(sniiText, charts);
    for (const chart of charts) {
      for (const c of corrections[chart] || []) {
        items.push({ chart, nmNumber: c.nmNumber, subject: subjectOf(c.excerpt) });
      }
    }
  }

  // Include chart-block-only corrections not already present as text corrections
  const { chartBlocks } = identifyPDFs(links || [], charts);
  for (const block of chartBlocks) {
    const nmMatch = block.filename.match(/NM(\d+)/i);
    const nmNumber = nmMatch ? nmMatch[1] : "—";
    if (!items.some((i) => i.chart === block.chartNum && i.nmNumber === nmNumber)) {
      items.push({ chart: block.chartNum, nmNumber, subject: "Chart block correction" });
    }
  }

  return NextResponse.json({
    weekYear: weekInfo?.year ?? year,
    weekNumber: weekInfo?.week ?? week,
    items,
  });
}
