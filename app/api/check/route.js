import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { fetchWeeklyPage, parsePageLinks, identifyPDFs } from "@/lib/scraper";
import {
  downloadAndParsePDF,
  downloadAndParsePDFWithPages,
  findCorrections,
  findTPNotices,
  findTPInForce,
  findPageForCorrection,
} from "@/lib/parser";
import { log, perf } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(request) {
  const checkedAt = new Date().toISOString();

  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional year/week from request body
    let requestedYear, requestedWeek;
    try {
      const body = await request.json();
      requestedYear = body?.year;
      requestedWeek = body?.week;
    } catch {
      // No body or invalid JSON — check current week
    }

    // 2. Read ACTIVE chart folio from DB
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

    if (charts.length === 0) {
      return NextResponse.json(
        { error: "No valid chart numbers in folio" },
        { status: 400 }
      );
    }

    // 3. Fetch and parse UKHO page (current or specified week)
    const startTime = Date.now();
    let t0 = Date.now();
    const html = await fetchWeeklyPage(
      requestedYear && requestedWeek
        ? { year: requestedYear, week: requestedWeek }
        : {}
    );
    perf("fetchWeeklyPage", Date.now() - t0);

    const { links, weekInfo } = parsePageLinks(html);
    const { weeklyNtm, sectionII, chartBlocks, allChartBlocks } = identifyPDFs(
      links,
      charts
    );

    let corrections = {};
    let tpNotices = {};
    let tpInForce = {};
    const failures = [];
    for (const chart of charts) {
      corrections[chart] = [];
      tpNotices[chart] = [];
      tpInForce[chart] = [];
    }

    // 4. Download both PDFs in parallel — biggest performance win
    t0 = Date.now();
    const [sniiResult, wknmResult] = await Promise.all([
      sectionII
        ? downloadAndParsePDFWithPages(sectionII.url)
            .then((data) => ({ ok: true, data }))
            .catch((err) => ({ ok: false, error: err.message }))
        : Promise.resolve(null),
      weeklyNtm
        ? downloadAndParsePDF(weeklyNtm.url)
            .then((text) => ({ ok: true, text }))
            .catch((err) => ({ ok: false, error: err.message }))
        : Promise.resolve(null),
    ]);
    perf("downloadPDFs (parallel)", Date.now() - t0);

    // 5. Parse Section II PDF (snii) — chart corrections + new T&P notices
    if (sniiResult?.ok) {
      t0 = Date.now();
      const { text, pageTexts } = sniiResult.data;
      corrections = findCorrections(text, charts);
      tpNotices = findTPNotices(text, charts);

      // Assign PDF page numbers to corrections for rendering
      for (const chart of charts) {
        for (const corr of corrections[chart]) {
          corr.pdfPage = findPageForCorrection(
            pageTexts,
            corr.nmNumber,
            chart
          );
        }
      }
      perf("parseSectionII", Date.now() - t0);
    } else if (sniiResult && !sniiResult.ok) {
      log("error", "Section II PDF download/parse failed", sniiResult.error);
      failures.push("Section II (corrections) PDF failed to load");
    } else if (!sectionII) {
      log("warn", "Section II PDF not found on UKHO page");
      failures.push("Section II PDF not found on UKHO page");
    }

    // 6. Parse weekly NtM PDF (wknm) — T&P notices in force from Section IA
    let tpInForceAvailable = true;
    if (wknmResult?.ok) {
      t0 = Date.now();
      tpInForce = findTPInForce(wknmResult.text, charts);
      tpInForceAvailable = tpInForce._listAvailable !== false;
      delete tpInForce._listAvailable;
      perf("parseWKNM", Date.now() - t0);
    } else if (wknmResult && !wknmResult.ok) {
      log("error", "Weekly NtM PDF download/parse failed", wknmResult.error);
      failures.push("Weekly NtM (T&P in force) PDF failed to load");
    } else if (!weeklyNtm) {
      log("warn", "Weekly NtM PDF not found on UKHO page");
      failures.push("Weekly NtM PDF not found on UKHO page");
    }

    // 7. Chart block PDFs — attach URL to matching text correction, or add new entry
    for (const block of chartBlocks) {
      const chart = block.chartNum;
      if (corrections[chart]) {
        const nmMatch = block.filename.match(/NM(\d+)/i);
        const nmNumber = nmMatch ? nmMatch[1] : "—";
        const existing = corrections[chart].find(
          (c) => c.nmNumber === nmNumber
        );
        if (existing) {
          // Attach the chart block PDF URL to the existing text correction
          existing.blockUrl = block.url;
          existing.blockFilename = block.filename;
        } else {
          corrections[chart].push({
            nmNumber,
            excerpt: `Chart block correction: ${block.filename}`,
            isPdfBlock: true,
            blockUrl: block.url,
            blockFilename: block.filename,
          });
        }
      }
    }

    // 8. Build response
    let totalCorrections = 0;
    let totalTP = 0;
    let totalTPInForce = 0;
    for (const chart of charts) {
      totalCorrections += corrections[chart].length;
      totalTP += tpNotices[chart].length;
      totalTPInForce += tpInForce[chart].length;
    }

    const durationMs = Date.now() - startTime;
    perf("totalCheck", durationMs);

    const result = {
      weekInfo,
      charts,
      vesselName: folio?.vesselName || null,
      corrections,
      tpNotices,
      tpInForce,
      totalCorrections,
      totalTP,
      totalTPInForce,
      tpInForceAvailable,
      failures: failures.length > 0 ? failures : undefined,
      allBlockChartNums: allChartBlocks.map((b) => b.chartNum),
      matchingBlocks: chartBlocks.map((b) => b.filename),
      pdfCount: links.length,
      weeklyNtmFile: weeklyNtm?.filename || null,
      sectionIIFile: sectionII?.filename || null,
      sectionIIUrl: sectionII?.url || null,
      checkedAt,
      durationMs,
      sourceUrl: "https://msi.admiralty.co.uk/NoticesToMariners/Weekly",
    };

    // 9. Save to DB
    await prisma.check.create({
      data: {
        userId: session.user.id,
        folioId: folio?.id || null,
        vesselName: folio?.vesselName || null,
        weekYear: weekInfo.year,
        weekNumber: weekInfo.week,
        charts,
        results: result,
        checkedAt: new Date(checkedAt),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check failed:", error);
    return NextResponse.json(
      { error: "Check failed", message: error.message, checkedAt },
      { status: 500 }
    );
  }
}
