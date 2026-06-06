import prisma from "./db";
import { fetchWeeklyPage, parsePageLinks, identifyPDFs } from "./scraper";
import {
  downloadAndParsePDF,
  downloadAndParsePDFWithPages,
  extractSectionIA,
  hasTpInForceList,
} from "./parser";
import { log, perf } from "./logger";

const cacheKey = (y, w) => ({ weekYear_weekNumber: { weekYear: y, weekNumber: w } });

/**
 * Resolve the parsed PDF text for a UKHO week — shared by /api/check and the
 * corrections-log scan. The parsed text is identical for all users for a given
 * week, so it's cached in WeekCache: only the first request for a week pays the
 * download + parse cost; everyone after reuses the cache.
 *
 * Pass { year, week } for a specific week, or {} for the current week.
 * Returns { sniiText, pageTexts, sectionIAText, hasInForce, links, weekInfo,
 *           fromCache, failures }.
 */
export async function getWeekData({ year, week } = {}) {
  const start = Date.now();
  let sniiText = null;
  let pageTexts = null;
  let sectionIAText = null;
  let hasInForce = false;
  let links = [];
  let weekInfo = null;
  let fromCache = false;
  const failures = [];

  // Known week key: try the cache before any network call.
  if (year && week) {
    const cached = await prisma.weekCache.findUnique({ where: cacheKey(year, week) });
    if (cached) {
      ({ sniiText, pageTexts, sectionIAText, links, weekInfo, hasInForce } = cached);
      fromCache = true;
    }
  }

  if (!fromCache) {
    let t0 = Date.now();
    const html = await fetchWeeklyPage(year && week ? { year, week } : {});
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
      links = cached.links;
      weekInfo = cached.weekInfo;
      fromCache = true;
    } else {
      const { weeklyNtm, sectionII } = identifyPDFs(links, []);
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
        failures.push("Section II PDF not found on UKHO page");
      }

      if (wknmResult?.ok) {
        sectionIAText = extractSectionIA(wknmResult.text);
        hasInForce = hasTpInForceList(sectionIAText);
      } else if (wknmResult && !wknmResult.ok) {
        log("error", "Weekly NtM PDF download/parse failed", wknmResult.error);
        failures.push("Weekly NtM (T&P in force) PDF failed to load");
      } else if (!weeklyNtm) {
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
      }
    }
  }

  perf("resolveWeek", Date.now() - start);
  log("info", `WeekCache ${fromCache ? "HIT" : "MISS"} for Wk ${weekInfo?.week}/${weekInfo?.year}`);

  return { sniiText, pageTexts, sectionIAText, hasInForce, links, weekInfo, fromCache, failures };
}
