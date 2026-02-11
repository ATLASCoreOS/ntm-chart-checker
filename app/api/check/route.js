import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { fetchWeeklyPage, parsePageLinks, identifyPDFs } from "@/lib/scraper";
import { downloadAndParsePDF, findCorrections, findTPNotices } from "@/lib/parser";

export const maxDuration = 60;

export async function POST() {
  const checkedAt = new Date().toISOString();

  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read chart folio from DB
    const folio = await prisma.chartFolio.findUnique({
      where: { userId: session.user.id },
    });
    const charts = validateCharts(folio?.charts || DEFAULT_CHARTS);

    if (charts.length === 0) {
      return NextResponse.json(
        { error: "No valid chart numbers in folio" },
        { status: 400 }
      );
    }

    // 3. Fetch and parse UKHO page
    const startTime = Date.now();
    const html = await fetchWeeklyPage();
    const { links, weekInfo } = parsePageLinks(html);
    const { weeklyNtm, sectionII, chartBlocks, allChartBlocks } = identifyPDFs(
      links,
      charts
    );

    let corrections = {};
    let tpNotices = {};
    for (const chart of charts) {
      corrections[chart] = [];
      tpNotices[chart] = [];
    }

    // 4. Parse weekly NtM PDF
    if (weeklyNtm) {
      try {
        const text = await downloadAndParsePDF(weeklyNtm.url);
        const corr = findCorrections(text, charts);
        const tp = findTPNotices(text, charts);

        // Merge
        for (const chart of charts) {
          corrections[chart] = [...corrections[chart], ...corr[chart]];
          tpNotices[chart] = [...tpNotices[chart], ...tp[chart]];
        }
      } catch (err) {
        console.error("Error parsing weekly NtM PDF:", err.message);
      }
    }

    // 5. Parse Section II PDF
    if (sectionII) {
      try {
        const text = await downloadAndParsePDF(sectionII.url);
        const corr = findCorrections(text, charts);

        // Merge (deduplicate)
        for (const chart of charts) {
          for (const c of corr[chart]) {
            const isDupe = corrections[chart].some(
              (existing) =>
                existing.excerpt.slice(0, 200) === c.excerpt.slice(0, 200)
            );
            if (!isDupe) {
              corrections[chart].push(c);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing Section II PDF:", err.message);
      }
    }

    // 6. Chart block PDFs
    for (const block of chartBlocks) {
      const chart = block.chartNum;
      if (corrections[chart]) {
        const nmMatch = block.filename.match(/NM(\d+)/i);
        corrections[chart].push({
          nmNumber: nmMatch ? nmMatch[1] : "—",
          excerpt: `Chart block correction: ${block.filename}`,
          isPdfBlock: true,
        });
      }
    }

    // 7. Build response
    let totalCorrections = 0;
    let totalTP = 0;
    for (const chart of charts) {
      totalCorrections += corrections[chart].length;
      totalTP += tpNotices[chart].length;
    }

    const durationMs = Date.now() - startTime;
    const result = {
      weekInfo,
      charts,
      corrections,
      tpNotices,
      totalCorrections,
      totalTP,
      allBlockChartNums: allChartBlocks.map((b) => b.chartNum),
      matchingBlocks: chartBlocks.map((b) => b.filename),
      pdfCount: links.length,
      weeklyNtmFile: weeklyNtm?.filename || null,
      sectionIIFile: sectionII?.filename || null,
      checkedAt,
      durationMs,
      sourceUrl: "https://msi.admiralty.co.uk/NoticesToMariners/Weekly",
    };

    // 8. Save to DB
    await prisma.check.create({
      data: {
        userId: session.user.id,
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
