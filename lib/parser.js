import { USER_AGENT } from "./constants";
import { fetchWithRetry } from "./scraper";

// --- Regex cache: compile once, reuse across calls ---
const chartPatternCache = new Map();
const affectedPatternCache = new Map();
const chartSearchCache = new Map();
const nextChartCache = new Map();

function getChartPattern(chartStr) {
  if (!chartPatternCache.has(chartStr)) {
    chartPatternCache.set(
      chartStr,
      new RegExp(`\\bChart\\s+${chartStr}(?:\\s|\\(|\\[)`, "i")
    );
  }
  return chartPatternCache.get(chartStr);
}

function getAffectedPattern(chartStr) {
  if (!affectedPatternCache.has(chartStr)) {
    affectedPatternCache.set(
      chartStr,
      new RegExp(
        `Charts?\\s+affected\\s*-[\\s\\d\\-(,)INT_]{0,500}\\b${chartStr}\\b`,
        "i"
      )
    );
  }
  return affectedPatternCache.get(chartStr);
}

function getChartSearchPattern(chartStr) {
  if (!chartSearchCache.has(chartStr)) {
    chartSearchCache.set(
      chartStr,
      new RegExp(`Chart\\s+${chartStr}(?:\\s|\\(|\\[)`, "i")
    );
  }
  return chartSearchCache.get(chartStr);
}

function getNextChartPattern(chartStr) {
  if (!nextChartCache.has(chartStr)) {
    nextChartCache.set(
      chartStr,
      new RegExp(
        `\\nChart\\s+(?!${chartStr}(?:\\s|\\(|\\[))\\d{3,5}(?:_\\d+)?(?:\\s|\\(|\\[)`,
        "i"
      )
    );
  }
  return nextChartCache.get(chartStr);
}

export async function downloadAndParsePDF(url) {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Download and parse a PDF, returning both the full text and per-page text.
 * Uses the same rendering logic as pdf-parse default but also records each page's text.
 * Used for Section II parsing where we need page numbers for corrections.
 */
export async function downloadAndParsePDFWithPages(url) {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfParse = (await import("pdf-parse")).default;
  const pageTexts = [];

  const data = await pdfParse(buffer, {
    pagerender: function (pageData) {
      return pageData
        .getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        })
        .then(function (textContent) {
          let lastY,
            text = "";
          for (const item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += "\n" + item.str;
            }
            lastY = item.transform[5];
          }
          pageTexts.push(text);
          return text;
        });
    },
  });

  return { text: data.text, pageTexts };
}

/**
 * Look up which page a correction is on based on NM number and chart number.
 * Returns 1-indexed page number, or null if not found.
 *
 * Single-pass scoring: each page gets a score based on what it contains.
 * Skips index/TOC pages. Higher score = better match.
 *
 * Scoring:
 *   +8  "Chart NNNN" regex match + NM number present (best: exact match)
 *   +5  NM number + chart number as substring (good: both present)
 *   +3  "Chart NNNN" regex match only (continuation page)
 *   +2  Chart number as substring only (broader match)
 *   +1  NM number only (last resort)
 */
export function findPageForCorrection(pageTexts, nmNumber, chartNumber) {
  const nmStr = nmNumber.replace(/\*$/, "");
  const chartStr = String(chartNumber);
  const chartRegex = getChartPattern(chartStr);

  // Only match pages that contain actual notice content,
  // not index/TOC pages or section headers
  const noticePageKeywords =
    /\b(Insert|Delete|Replace|Amend|Move|Add|Remove|Substitute)\b/i;
  const chartsAffected = /\bCharts?\s+affected\b/i;
  const isCancelled = /\bis\s+cancelled\b/i;

  let bestPage = null;
  let bestScore = 0;

  for (let i = 0; i < pageTexts.length; i++) {
    const text = pageTexts[i];

    // Skip non-notice pages
    if (
      text.includes("INDEX OF CHARTS AFFECTED") ||
      (!noticePageKeywords.test(text) &&
        !chartsAffected.test(text) &&
        !isCancelled.test(text))
    ) {
      continue;
    }

    const hasNm = text.includes(nmStr);
    const hasChartRegex = chartRegex.test(text);
    const hasChartStr = hasChartRegex || text.includes(chartStr);

    let score = 0;
    if (hasNm && hasChartRegex) score = 8;
    else if (hasNm && hasChartStr) score = 5;
    else if (hasChartRegex) score = 3;
    else if (hasChartStr) score = 2;
    else if (hasNm) score = 1;

    if (score > bestScore) {
      bestScore = score;
      bestPage = i + 1;
      if (score === 8) break; // Perfect match, no need to continue
    }
  }

  return bestPage;
}

/**
 * Extract the Section II content from the full weekly NtM PDF text.
 * Section II contains the actual chart corrections.
 * Before it is a massive Section IA (T&P In Force list) that causes false matches.
 */
function extractSectionII(text) {
  // Find actual notices: NM number followed by 4+ spaces then ALLCAPS country/region
  // Pattern: "759*   ENGLAND" or "770    CANADA" or "762(T)/26     WALES"
  const noticeStartPattern =
    /\n(\d{3,5})(?:\*|\([TP]\)\/\d{2,4})?\s{3,}[A-Z]{2,}/;
  const firstNotice = text.match(noticeStartPattern);

  if (!firstNotice) {
    return text; // Fallback: return everything
  }

  // Section II content starts just before the first notice
  let sectionStart = firstNotice.index;

  // Skip past the Section II index/table of contents
  // The index has entries like "759*2.8         1, 2" (no space between NM and page ref)
  // Real notices have "770    CANADA" (4+ spaces then country)
  // Find the first REAL notice (not an index entry)
  const realNoticePattern =
    /\n(\d{3,5})(?:\*|\([TP]\)\/\d{2,4})?\s{3,}[A-Z][A-Z]+\s*-\s/g;
  realNoticePattern.lastIndex = sectionStart;
  const realMatch = realNoticePattern.exec(text);

  if (realMatch) {
    sectionStart = realMatch.index;
  }

  // Section II ends before Section III, IV, or end of document
  // Look for Sailing Directions section or List of Lights section
  let sectionEnd = text.length;
  const endMarkers = [
    /\nNP\d+\s/,  // Sailing Directions start with "NP3 Africa Pilot..."
    /\n[A-Z]\d{4}/,  // List of Lights entries like "A0896"
  ];

  for (const marker of endMarkers) {
    // Search from the middle of the document onwards
    const midPoint = Math.floor(text.length * 0.7);
    const searchText = text.substring(midPoint);
    const endMatch = searchText.match(marker);
    if (endMatch) {
      const endPos = midPoint + endMatch.index;
      if (endPos > sectionStart && endPos < sectionEnd) {
        sectionEnd = endPos;
      }
    }
  }

  return text.substring(sectionStart, sectionEnd);
}

/**
 * Split Section II text into individual notice blocks.
 * Notices start with: "NNN    COUNTRY - Region - Subject"
 * or "NNN(T)/YY     COUNTRY - Region - Subject"
 *
 * Long notices that span page breaks are repeated with "(continued)".
 * We merge these so each NM number has exactly one block.
 */
function splitIntoNotices(sectionText) {
  // Match notice headers: number + optional (T)/YY or * + spaces + COUNTRY
  const headerRegex =
    /\n(\d{3,5})(\([TP]\)\/\d{2,4}|\*)?\s{3,}([A-Z][A-Z\s]+?\s*-\s)/g;
  const headers = [];
  let match;

  while ((match = headerRegex.exec(sectionText)) !== null) {
    const nmNumber = match[1] + (match[2] || "");
    headers.push({
      nmNumber,
      index: match.index,
    });
  }

  // Build raw notice blocks
  const rawNotices = [];
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end =
      i + 1 < headers.length ? headers[i + 1].index : sectionText.length;
    rawNotices.push({
      nmNumber: headers[i].nmNumber,
      text: sectionText.substring(start, end),
    });
  }

  // Merge continuation blocks with the same NM number
  const notices = [];
  for (const notice of rawNotices) {
    const baseNm = notice.nmNumber.replace(/\*$/, "");
    const prev = notices.length > 0 ? notices[notices.length - 1] : null;
    const prevBaseNm = prev ? prev.nmNumber.replace(/\*$/, "") : null;

    if (prev && baseNm === prevBaseNm) {
      // Merge: append this block's text to the previous one
      prev.text += notice.text;
    } else {
      notices.push({ ...notice });
    }
  }

  return notices;
}

export function findCorrections(text, charts) {
  const corrections = {};
  for (const chart of charts) {
    corrections[chart] = [];
  }

  // Extract Section II only to avoid false matches from Section IA
  const sectionII = extractSectionII(text);

  // Split into individual notices
  const notices = splitIntoNotices(sectionII);

  for (const notice of notices) {
    for (const chart of charts) {
      const chartStr = String(chart);

      // Pattern 1: Direct chart match - "Chart NNNN" (cached)
      const chartPattern = getChartPattern(chartStr);

      // Pattern 2: T&P affected charts - "Chart(s) affected - NNNN" (cached)
      const affectedPattern = getAffectedPattern(chartStr);

      if (!chartPattern.test(notice.text) && !affectedPattern.test(notice.text)) {
        continue;
      }

      // Clean up the text: page markers and continuation headers
      const cleanText = notice.text
        .replace(/Wk\d{2}\/\d{2}\s*\n\s*II\s*\n[\d\s.]+\n/g, "")
        .replace(/\n\d{3,5}[^\n]*\(continued\)[^\n]*/gi, "\n")
        .trim();

      // Extract the chart-specific section from the notice
      const header = cleanText.split("\n").slice(0, 2).join("\n");
      let excerpt;
      const chartPos = cleanText.search(getChartSearchPattern(chartStr));
      if (chartPos >= 0) {
        const rest = cleanText.substring(chartPos);
        // Find next chart section with a different number
        const nextChartMatch = rest.search(getNextChartPattern(chartStr));
        const chartSection =
          nextChartMatch >= 0 ? rest.substring(0, nextChartMatch) : rest;
        excerpt = header + "\n" + chartSection;
      } else {
        excerpt = cleanText;
      }
      excerpt = excerpt.trim();

      const cleanNm = notice.nmNumber.replace(/\*$/, "");
      const isDupe = corrections[chart].some(
        (c) => c.nmNumber === cleanNm
      );
      if (!isDupe) {
        corrections[chart].push({
          nmNumber: cleanNm,
          excerpt,
          isPdfBlock: false,
        });
      }
    }
  }

  return corrections;
}

/**
 * Extract Section IA text from the full wknm PDF text.
 * Section IA contains the T&P In Force list (published monthly).
 * Returns the text before the first Section II notice header.
 */
export function extractSectionIA(text) {
  const sectionIIStart =
    /\n(\d{3,5})(?:\*|\([TP]\)\/\d{2,4})?\s{3,}[A-Z][A-Z]+\s*-\s/.exec(text);
  return text.substring(0, sectionIIStart ? sectionIIStart.index : text.length);
}

/**
 * Check whether a Section IA text block contains the T&P In Force list.
 * The list uses dot-separated entries; if none are found, it wasn't published this week.
 */
export function hasTpInForceList(sectionIAText) {
  return /\d{3,5}\([TP]\)\/\d{2,4}\s+[\d,\s_A-Za-z]+?\.{3,}/.test(sectionIAText);
}

/**
 * Parse Section IA — T&P Notices In Force.
 * These are ALL active temporary/preliminary notices affecting user's charts.
 * Format: "4697(T)/25   1491,  2693.......... ENGLAND, East Coast: Buoyage"
 * Some entries span multiple lines when chart lists are long.
 *
 * Accepts either full wknm text or pre-extracted Section IA text.
 */
export function findTPInForce(sectionIAText, charts) {
  const tpInForce = {};
  for (const chart of charts) {
    tpInForce[chart] = [];
  }

  // Match T&P In Force entries:
  // NM(T)/YY or NM(P)/YY followed by chart numbers, dots, then subject
  const entryRegex =
    /(\d{3,5}\([TP]\)\/\d{2,4})\s+([\d,\s_A-Za-z]+?)\.{3,}\s*([A-Z][\w\s,;:()\-&'/]+?)\.{2,}/g;
  let match;

  while ((match = entryRegex.exec(sectionIAText)) !== null) {
    const nmNumber = match[1];
    const chartsStr = match[2];
    const subject = match[3].trim();

    // Parse chart numbers from the comma-separated list
    // Format: "1491,  2693,\n 5607_7"
    const chartNumbers = [];
    const chartNumRegex = /\b(\d{3,5})\b/g;
    let cm;
    while ((cm = chartNumRegex.exec(chartsStr)) !== null) {
      const num = parseInt(cm[1], 10);
      if (num > 0) {
        chartNumbers.push(num);
      }
    }

    // Check if any user chart is in this T&P entry
    for (const chart of charts) {
      if (chartNumbers.includes(chart)) {
        const isDupe = tpInForce[chart].some((t) => t.nmNumber === nmNumber);
        if (!isDupe) {
          tpInForce[chart].push({
            nmNumber,
            charts: chartNumbers.join(", "),
            subject,
          });
        }
      }
    }
  }

  return tpInForce;
}

export function findTPNotices(text, charts) {
  const tpNotices = {};
  for (const chart of charts) {
    tpNotices[chart] = [];
  }

  // Extract Section II only
  const sectionII = extractSectionII(text);

  // Find T&P notices by their distinctive format:
  // "NNN(T)/YY     COUNTRY - Region - Subject"
  const tpHeaderRegex =
    /\n(\d{3,5}\([TP]\)\/\d{2,4})\s{3,}([A-Z][A-Z\s]+?\s*-\s[^\n]+)/g;
  let match;

  while ((match = tpHeaderRegex.exec(sectionII)) !== null) {
    const nmNumber = match[1];
    const subject = match[2].trim();
    const startPos = match.index;

    // Find the "Charts affected" line for this notice
    // Look ahead up to 5000 chars for the affected charts
    const noticeText = sectionII.substring(startPos, startPos + 5000);

    // Match "Chart(s) affected -  NNNN -  MMMM" or "Chart(s) affected -  NNNN (INT XXXX) -  MMMM"
    const affectedMatch = noticeText.match(
      /Charts?\s+affected\s*-([\s\d\-_,()\w]*?)(?:\n[A-Z]|\n\d{3,5}(?:\(|\*)|\n$)/
    );

    if (!affectedMatch) continue;

    const chartsLine = affectedMatch[1];

    // Parse chart numbers from the affected line
    // Format: "  152 (INT 1549) -  156 -  1191 (INT 1507)"
    const chartNumbers = [];
    const chartNumRegex = /\b(\d{3,5})\b/g;
    let chartMatch;
    while ((chartMatch = chartNumRegex.exec(chartsLine)) !== null) {
      const num = parseInt(chartMatch[1], 10);
      // Exclude INT numbers (usually 4 digits following "INT")
      const beforeMatch = chartsLine.substring(
        Math.max(0, chartMatch.index - 5),
        chartMatch.index
      );
      if (!beforeMatch.includes("INT") && num > 0) {
        chartNumbers.push(num);
      }
    }

    // Check if any user chart is affected
    for (const chart of charts) {
      if (chartNumbers.includes(chart)) {
        const isDupe = tpNotices[chart].some((t) => t.nmNumber === nmNumber);
        if (!isDupe) {
          tpNotices[chart].push({
            nmNumber,
            charts: chartNumbers.join(", "),
            subject,
          });
        }
      }
    }
  }

  return tpNotices;
}
