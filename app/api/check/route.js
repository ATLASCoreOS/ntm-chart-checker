import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateCharts, DEFAULT_CHARTS } from "@/lib/charts";
import { COOLDOWN_SECONDS } from "@/lib/constants";
import { fetchWeeklyPage, parsePageLinks, identifyPDFs } from "@/lib/scraper";
import {
  downloadAndParsePDF,
  downloadAndParsePDFWithPages,
  findCorrections,
  findTPNotices,
  findTPInForce,
  extractSectionIA,
  hasTpInForceList,
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

    // Enforce a per-user cooldown server-side (the client timer is advisory).
    // Protects UKHO from rapid scraping and limits function abuse.
    const lastCheck = await prisma.check.findFirst({
      where: { userId: session.user.id },
      orderBy: { checkedAt: "desc" },
      select: { checkedAt: true },
    });
    if (lastCheck) {
      const elapsedSec = (Date.now() - lastCheck.checkedAt.getTime()) / 1000;
      if (elapsedSec < COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(COOLDOWN_SECONDS - elapsedSec);
        return NextResponse.json(
          {
            error: `Please wait ${retryAfter}s before checking again`,
            retryAfter,
          },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // Parse optional year/week from request body (validated)
    let requestedYear, requestedWeek;
    try {
      const body = await request.json();
      const y = parseInt(body?.year, 10);
      const w = parseInt(body?.week, 10);
      if (y >= 2023 && y <= 2100 && w >= 1 && w <= 53) {
        requestedYear = y;
        requestedWeek = w;
      }
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

    // 3. Resolve the week's parsed PDF text.
    //    The parsed text is identical for all users for a given week, so it's
    //    cached in WeekCache: only the first check of a week pays the cost of
    //    downloading + parsing the PDFs; everyone after reuses the cache.
    const startTime = Date.now();
    let sniiText = null; // Section II full text (corrections + new T&P)
    let pageTexts = null; // per-page text for PDF page lookup
    let sectionIAText = null; // Section IA text (T&P in force list), may be ""
    let hasInForce = false;
    let links = [];
    let weekInfo = null;
    let cacheHit = false;
    const failures = [];

    const cacheKey = (y, w) => ({ weekYear_weekNumber: { weekYear: y, weekNumber: w } });

    // Past week with a known key: try the cache before any network call.
    if (requestedYear && requestedWeek) {
      const cached = await prisma.weekCache.findUnique({
        where: cacheKey(requestedYear, requestedWeek),
      });
      if (cached) {
        ({ sniiText, pageTexts, sectionIAText, links, weekInfo, hasInForce } = cached);
        cacheHit = true;
      }
    }

    // No direct hit — fetch the weekly page (also tells us the current week).
    if (!cacheHit) {
      let t0 = Date.now();
      const html = await fetchWeeklyPage(
        requestedYear && requestedWeek
          ? { year: requestedYear, week: requestedWeek }
          : {}
      );
      perf("fetchWeeklyPage", Date.now() - t0);
      const parsed = parsePageLinks(html);
      links = parsed.links;
      weekInfo = parsed.weekInfo;

      // Now that we know the week number, try the cache again (current week).
      const cached = await prisma.weekCache.findUnique({
        where: cacheKey(weekInfo.year, weekInfo.week),
      });
      if (cached) {
        sniiText = cached.sniiText;
        pageTexts = cached.pageTexts;
        sectionIAText = cached.sectionIAText;
        hasInForce = cached.hasInForce;
        links = cached.links; // full link list incl. block PDFs
        weekInfo = cached.weekInfo;
        cacheHit = true;
      } else {
        // Cache miss — download + parse both PDFs (the expensive path).
        const { weeklyNtm, sectionII } = identifyPDFs(links, charts);
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

        if (sniiResult?.ok) {
          sniiText = sniiResult.data.text;
          pageTexts = sniiResult.data.pageTexts;
        } else if (sniiResult && !sniiResult.ok) {
          log("error", "Section II PDF download/parse failed", sniiResult.error);
          failures.push("Section II (corrections) PDF failed to load");
        } else if (!sectionII) {
          log("warn", "Section II PDF not found on UKHO page");
          failures.push("Section II PDF not found on UKHO page");
        }

        if (wknmResult?.ok) {
          sectionIAText = extractSectionIA(wknmResult.text);
          hasInForce = hasTpInForceList(sectionIAText);
        } else if (wknmResult && !wknmResult.ok) {
          log("error", "Weekly NtM PDF download/parse failed", wknmResult.error);
          failures.push("Weekly NtM (T&P in force) PDF failed to load");
        } else if (!weeklyNtm) {
          log("warn", "Weekly NtM PDF not found on UKHO page");
          failures.push("Weekly NtM PDF not found on UKHO page");
        }

        // Cache the parsed week for everyone (only when we got Section II).
        if (sniiText !== null) {
          await prisma.weekCache.upsert({
            where: cacheKey(weekInfo.year, weekInfo.week),
            update: { sniiText, pageTexts, sectionIAText: sectionIAText || "", links, weekInfo, hasInForce },
            create: {
              weekYear: weekInfo.year,
              weekNumber: weekInfo.week,
              sniiText,
              pageTexts,
              sectionIAText: sectionIAText || "",
              links,
              weekInfo,
              hasInForce,
            },
          });
          log("info", `Cached parsed Wk ${weekInfo.week}/${weekInfo.year}`);
        }
      }
    }
    perf("resolveWeek", Date.now() - startTime);
    log("info", `WeekCache ${cacheHit ? "HIT" : "MISS"} for Wk ${weekInfo.week}/${weekInfo.year}`);

    // Identify PDFs from the (cached or fresh) link list for this user's charts.
    const { weeklyNtm, sectionII, chartBlocks, allChartBlocks } = identifyPDFs(
      links,
      charts
    );

    let corrections = {};
    let tpNotices = {};
    let tpInForce = {};
    for (const chart of charts) {
      corrections[chart] = [];
      tpNotices[chart] = [];
      tpInForce[chart] = [];
    }

    // 4. Chart corrections + new T&P notices from the Section II text (fast).
    if (sniiText) {
      const t0 = Date.now();
      corrections = findCorrections(sniiText, charts);
      tpNotices = findTPNotices(sniiText, charts);
      if (pageTexts) {
        for (const chart of charts) {
          for (const corr of corrections[chart]) {
            corr.pdfPage = findPageForCorrection(pageTexts, corr.nmNumber, chart);
          }
        }
      }
      perf("matchSectionII", Date.now() - t0);
    }

    // 5. T&P in force from Section IA text, with cross-week TpCache fallback.
    let tpInForceWeek = null;
    if (hasInForce && sectionIAText) {
      tpInForce = findTPInForce(sectionIAText, charts);
      tpInForceWeek = { year: weekInfo.year, week: weekInfo.week };

      // Keep the singleton TpCache pointing at the newest in-force list only.
      const existing = await prisma.tpCache.findUnique({ where: { id: "singleton" } });
      const isNewer =
        !existing ||
        weekInfo.year > existing.weekYear ||
        (weekInfo.year === existing.weekYear && weekInfo.week >= existing.weekNumber);
      if (isNewer) {
        await prisma.tpCache.upsert({
          where: { id: "singleton" },
          update: { weekYear: weekInfo.year, weekNumber: weekInfo.week, sectionText: sectionIAText },
          create: { id: "singleton", weekYear: weekInfo.year, weekNumber: weekInfo.week, sectionText: sectionIAText },
        });
      }
    } else {
      // No in-force list this week — fall back to the last cached one.
      const cached = await prisma.tpCache.findUnique({ where: { id: "singleton" } });
      if (cached) {
        tpInForce = findTPInForce(cached.sectionText, charts);
        tpInForceWeek = { year: cached.weekYear, week: cached.weekNumber };
      } else {
        log("warn", "No T&P In Force cache available yet");
      }
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
      tpInForceWeek,
      failures: failures.length > 0 ? failures : undefined,
      allBlockChartNums: allChartBlocks.map((b) => b.chartNum),
      matchingBlocks: chartBlocks.map((b) => b.filename),
      pdfCount: links.length,
      weeklyNtmFile: weeklyNtm?.filename || null,
      sectionIIFile: sectionII?.filename || null,
      sectionIIUrl: sectionII?.url || null,
      checkedAt,
      durationMs,
      fromCache: cacheHit,
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
    log("error", "Check failed", error.message);
    return NextResponse.json(
      { error: "Check failed. Please try again.", checkedAt },
      { status: 500 }
    );
  }
}
