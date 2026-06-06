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
  extractSectionIA,
} from "@/lib/parser";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

    // Diagnostics endpoint — restrict to allow-listed admin emails
    const admins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!admins.includes((session.user.email || "").toLowerCase())) {
      return new Response("Not found", { status: 404 });
    }

    // Resolve the active folio (userId is not unique — a user may have many)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeFolioId: true },
    });
    let folio = null;
    if (currentUser?.activeFolioId) {
      folio = await prisma.chartFolio.findFirst({
        where: { id: currentUser.activeFolioId, userId: session.user.id },
      });
    }
    if (!folio) {
      folio = await prisma.chartFolio.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
    }
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

    let corrections = {};
    let tpNotices = {};
    let tpInForce = {};
    for (const chart of charts) {
      corrections[chart] = [];
      tpNotices[chart] = [];
      tpInForce[chart] = [];
    }

    // Parse Section II PDF (snii) for corrections + new T&P notices
    if (sectionII) {
      const sniiText = await downloadAndParsePDF(sectionII.url);
      lines.push(`Section II PDF text length: ${sniiText.length} chars`);
      corrections = findCorrections(sniiText, charts);
      tpNotices = findTPNotices(sniiText, charts);
    } else {
      lines.push("WARNING: No Section II PDF found");
    }

    // Parse weekly NtM PDF (wknm) for T&P in force
    if (weeklyNtm) {
      const wknmText = await downloadAndParsePDF(weeklyNtm.url);
      lines.push(`Weekly NtM PDF text length: ${wknmText.length} chars`);
      try {
        tpInForce = findTPInForce(extractSectionIA(wknmText), charts);
        lines.push("findTPInForce: OK");
      } catch (e) {
        lines.push(`findTPInForce: ERROR - ${e.message}`);
      }
    } else {
      lines.push("WARNING: No weekly NtM PDF found");
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
    console.error("debug-check error:", error);
    return new Response("Error running diagnostics", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
