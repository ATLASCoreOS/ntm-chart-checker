import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { HISTORY_PAGE_LIMIT, HISTORY_MAX_LIMIT } from "@/lib/constants";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(HISTORY_MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(HISTORY_PAGE_LIMIT), 10)));
  const q = (searchParams.get("q") || "").trim();
  const findingsOnly = searchParams.get("findingsOnly") === "true";

  // Build filter: own checks, optionally by vessel name and findings-only
  const where = { userId: session.user.id };
  if (q) where.vesselName = { contains: q, mode: "insensitive" };
  if (findingsOnly) {
    where.OR = [
      { results: { path: ["totalCorrections"], gt: 0 } },
      { results: { path: ["totalTP"], gt: 0 } },
      { results: { path: ["totalTPInForce"], gt: 0 } },
    ];
  }

  const [checks, total] = await Promise.all([
    prisma.check.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.check.count({ where }),
  ]);

  // Return summary data (extract totals from JSONB, strip full results)
  const summary = checks.map((check) => ({
    id: check.id,
    weekYear: check.weekYear,
    weekNumber: check.weekNumber,
    charts: check.charts,
    vesselName: check.vesselName || null,
    totalCorrections: check.results?.totalCorrections ?? 0,
    totalTP: check.results?.totalTP ?? 0,
    totalTPInForce: check.results?.totalTPInForce ?? 0,
    checkedAt: check.checkedAt,
  }));

  return NextResponse.json(
    { checks: summary, total, page, limit },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
