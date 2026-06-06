import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchCharts, getChartName } from "@/lib/chartNames";

export const dynamic = "force-dynamic";

// GET /api/charts?q=<text|number>  — typeahead search over the catalog
// GET /api/charts?nums=1,2,3       — batch number->name lookup
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const nums = searchParams.get("nums");
  const headers = { "Cache-Control": "private, max-age=3600" };

  if (nums) {
    const names = {};
    for (const part of nums.split(",")) {
      const n = parseInt(part, 10);
      if (n > 0) names[n] = getChartName(n);
    }
    return NextResponse.json({ names }, { headers });
  }

  const q = searchParams.get("q") || "";
  return NextResponse.json({ results: searchCharts(q, 10) }, { headers });
}
