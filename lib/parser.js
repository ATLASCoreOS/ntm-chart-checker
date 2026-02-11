import { USER_AGENT } from "./constants";
import chartNamesMap from "./chart-names.json";

export async function downloadAndParsePDF(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to download PDF: ${res.status} from ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
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

/**
 * Extract the geographic core from a chart/panel name by stripping
 * nautical prefixes and suffixes, leaving the place name.
 * e.g., "Great Yarmouth and Approaches" → "Great Yarmouth"
 * e.g., "Approaches to Great Yarmouth" → "Great Yarmouth"
 */
function extractCore(title) {
  let t = title.trim();
  // Normalize whitespace (PDF extraction can insert newlines mid-title)
  t = t.replace(/\s+/g, " ");
  // Strip prefixes: "Approaches to", "Entrance to", "River", directional
  t = t.replace(
    /^(Outer |Inner |Northern |Southern |Eastern |Western |Central |Upper |Lower )?Approaches? to (the )?/i,
    ""
  );
  t = t.replace(
    /^(Outer |Inner |Northern |Southern |Eastern |Western |Central )?Entrance to (the )?/i,
    ""
  );
  t = t.replace(/^River /i, "");
  // Strip suffixes: "and Approaches", "Harbour", "Entrance", directional Part
  t = t.replace(/( and)? Approaches?$/i, "");
  t = t.replace(/ Harbou?r( Entrance)?$/i, "");
  t = t.replace(/ Entrance$/i, "");
  t = t.replace(/ including .*/i, "");
  t = t.replace(
    /(,? ?(Northern|Southern|Eastern|Western|Central|Outer|Inner|Upper|Lower) Part)$/i,
    ""
  );
  return t.trim();
}

export function findCorrections(text, charts) {
  const corrections = {};
  for (const chart of charts) {
    corrections[chart] = [];
  }

  // Pre-compute the geographic core for each folio chart from the CAL
  const chartCores = {};
  for (const chart of charts) {
    const name = chartNamesMap[String(chart)];
    if (name) {
      chartCores[chart] = extractCore(name).toLowerCase();
    }
  }

  // Extract Section II only to avoid false matches from Section IA
  const sectionII = extractSectionII(text);

  // Split into individual notices
  const notices = splitIntoNotices(sectionII);

  for (const notice of notices) {
    for (const chart of charts) {
      const chartStr = String(chart);

      // Pattern 1: Direct chart match - "Chart NNNN" or "Chart NNNN_N"
      const permPattern = new RegExp(
        `\\bChart\\s+${chartStr}(?:_\\d+)?(?:\\s|\\(|\\[)`,
        "i"
      );

      // Pattern 2: T&P affected charts - "Chart(s) affected - NNNN"
      const affectedPattern = new RegExp(
        `Charts?\\s+affected\\s*-[\\s\\d\\-(,)INT_]*\\b${chartStr}\\b`,
        "i"
      );

      const directMatch =
        permPattern.test(notice.text) || affectedPattern.test(notice.text);

      // Pattern 3: Panel name match — find panel chart numbers in the notice
      // whose CAL names match this folio chart's geographic name.
      // Always run this (even with directMatch) to collect ALL relevant base
      // numbers for excerpt extraction, so panel sections aren't cut off.
      // e.g., notice mentions "Chart 5614_4" → CAL says "Approaches to Great Yarmouth"
      // → extractCore gives "Great Yarmouth" → matches folio chart 1534
      const relevantBases = new Set([chartStr]);
      let panelMatch = false;
      if (chartCores[chart]) {
        const panelNumRegex = /Chart\s+(\d{3,5}_\d+)/gi;
        let m;
        while ((m = panelNumRegex.exec(notice.text)) !== null) {
          const panelNum = m[1]; // e.g., "5614_4"
          const panelName = chartNamesMap[panelNum];
          if (panelName) {
            const panelCore = extractCore(panelName).toLowerCase();
            if (panelCore.length >= 5 && panelCore === chartCores[chart]) {
              relevantBases.add(panelNum.split("_")[0]);
              panelMatch = true;
            }
          }
        }
      }

      if (directMatch || panelMatch) {
        // Clean up the text: page markers and continuation headers
        const cleanText = notice.text
          .replace(/Wk\d{2}\/\d{2}\s*\n\s*II\s*\n[\d\s.]+\n/g, "")
          .replace(/\n\d{3,5}[^\n]*\(continued\)[^\n]*/gi, "\n")
          .trim();

        // Extract ALL chart sections whose base is in our relevant set.
        // Notices can have interleaved charts (e.g., 1534, 1535, 1543, 5614_4)
        // so we can't just grab one contiguous block — we collect each matching
        // section individually and join them.
        const header = cleanText.split("\n").slice(0, 2).join("\n");
        const sections = [];

        // Find every "Chart NNNN" boundary in the notice
        const chartBoundaryRegex =
          /\nChart\s+(\d{3,5})(?:_\d+)?(?:\s|\(|\[)/gi;
        const boundaries = [];
        let bm;
        while ((bm = chartBoundaryRegex.exec(cleanText)) !== null) {
          const base = bm[1];
          boundaries.push({ index: bm.index, base });
        }

        for (let bi = 0; bi < boundaries.length; bi++) {
          if (relevantBases.has(boundaries[bi].base)) {
            const start = boundaries[bi].index;
            const end =
              bi + 1 < boundaries.length
                ? boundaries[bi + 1].index
                : cleanText.length;
            sections.push(cleanText.substring(start, end).trim());
          }
        }

        let excerpt;
        if (sections.length > 0) {
          excerpt = header + "\n" + sections.join("\n");
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
  }

  return corrections;
}

/**
 * Parse Section IA — T&P Notices In Force.
 * These are ALL active temporary/preliminary notices affecting user's charts.
 * Format: "4697(T)/25   1491,  2693.......... ENGLAND, East Coast: Buoyage"
 * Some entries span multiple lines when chart lists are long.
 */
export function findTPInForce(text, charts) {
  const tpInForce = {};
  for (const chart of charts) {
    tpInForce[chart] = [];
  }

  // Section IA is between the start of the document and the Section II index.
  // Find where Section II notices begin (to set upper boundary)
  const sectionIIStart =
    /\n(\d{3,5})(?:\*|\([TP]\)\/\d{2,4})?\s{3,}[A-Z][A-Z]+\s*-\s/.exec(text);
  const endPos = sectionIIStart ? sectionIIStart.index : text.length;

  // Only search within Section IA (roughly positions 20000 to Section II start)
  const sectionIA = text.substring(0, endPos);

  // Match T&P In Force entries:
  // NM(T)/YY or NM(P)/YY followed by chart numbers, dots, then subject
  const entryRegex =
    /(\d{3,5}\([TP]\)\/\d{2,4})\s+([\d,\s_A-Za-z]+?)\.{3,}\s*([A-Z][\w\s,;:()\-&'/]+?)\.{2,}/g;
  let match;

  while ((match = entryRegex.exec(sectionIA)) !== null) {
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
