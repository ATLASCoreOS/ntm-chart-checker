import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { fetchWeeklyPage, parsePageLinks, identifyPDFs } from "@/lib/scraper";
import {
  downloadAndParsePDF,
  findCorrections,
  findTPNotices,
  findTPInForce,
} from "@/lib/parser";

export const maxDuration = 60;

/**
 * Debug endpoint — visit in browser to see raw parser output as plain text.
 * GET /api/debug-check
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const folio = await prisma.chartFolio.findUnique({
      where: { userId: session.user.id },
    });
    const charts = validateCharts(folio?.charts || DEFAULT_CHARTS);

    const html = await fetchWeeklyPage();
    const { links, weekInfo } = parsePageLinks(html);
    const { weeklyNtm, sectionII } = identifyPDFs(links, charts);

    const lines = [];
    lines.push(`Week: ${weekInfo.week}/${weekInfo.year}`);
    lines.push(`Charts: ${charts.join(", ")}`);
    lines.push(`Weekly NtM: ${weeklyNtm?.filename || "NOT FOUND"}`);
    lines.push(`Section II: ${sectionII?.filename || "NOT FOUND"}`);
    lines.push(`PDF count: ${links.length}`);
    lines.push("");

    if (!weeklyNtm) {
      lines.push("ERROR: No weekly NtM PDF found");
      return new Response(lines.join("\n"), {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const text = await downloadAndParsePDF(weeklyNtm.url);
    lines.push(`PDF text length: ${text.length} chars`);
    lines.push("");

    const corrections = findCorrections(text, charts);
    const tpNotices = findTPNotices(text, charts);

    let tpInForce = {};
    for (const chart of charts) tpInForce[chart] = [];
    try {
      tpInForce = findTPInForce(text, charts);
      lines.push("findTPInForce: OK");
    } catch (e) {
      lines.push(`findTPInForce: ERROR - ${e.message}`);
    }

    lines.push("");
    lines.push("=== CORRECTIONS ===");
    let totalCorr = 0;
    for (const chart of charts) {
      const corrs = corrections[chart] || [];
      totalCorr += corrs.length;
      if (corrs.length > 0) {
        lines.push(`Chart ${chart}: ${corrs.length} correction(s)`);
        for (const c of corrs) {
          lines.push(`  NM ${c.nmNumber}`);
        }
      }
    }
    lines.push(`Total: ${totalCorr}`);

    lines.push("");
    lines.push("=== NEW T&P NOTICES ===");
    let totalTP = 0;
    for (const chart of charts) {
      const tps = tpNotices[chart] || [];
      totalTP += tps.length;
      if (tps.length > 0) {
        lines.push(`Chart ${chart}: ${tps.length} notice(s)`);
        for (const t of tps) lines.push(`  ${t.nmNumber} | ${t.subject}`);
      }
    }
    lines.push(`Total: ${totalTP}`);

    lines.push("");
    lines.push("=== T&P IN FORCE ===");
    let totalTPIF = 0;
    for (const chart of charts) {
      const tps = tpInForce[chart] || [];
      totalTPIF += tps.length;
      if (tps.length > 0) {
        lines.push(`Chart ${chart}: ${tps.length} T&P in force`);
        for (const t of tps) lines.push(`  ${t.nmNumber} | ${t.subject}`);
      }
    }
    lines.push(`Total: ${totalTPIF}`);

    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}\n${error.stack}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
