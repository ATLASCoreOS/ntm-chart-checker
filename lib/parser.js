import { USER_AGENT } from "./constants";

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

export function findCorrections(text, charts) {
  const corrections = {};
  for (const chart of charts) {
    corrections[chart] = [];
  }

  // Strategy 1: NM block splitting
  // Split on NM numbers at start of line or after whitespace
  const blocks = [];
  const blockRegex = /(?:^|\n)\s*(\d{3,5})\s*[.\-–—]\s*/g;
  let lastIndex = 0;
  let lastNm = null;
  let match;

  const indices = [];
  while ((match = blockRegex.exec(text)) !== null) {
    indices.push({ index: match.index, nm: match[1] });
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index;
    const end = i + 1 < indices.length ? indices[i + 1].index : text.length;
    const blockText = text.slice(start, end);
    blocks.push({ nm: indices[i].nm, text: blockText });
  }

  // Check each block for chart references
  for (const block of blocks) {
    for (const chart of charts) {
      const patterns = [
        new RegExp(`\\bCharts?\\s+${chart}\\b`, "i"),
        new RegExp(`\\bCharts?\\s+[\\d,\\s]*\\b${chart}\\b`, "i"),
      ];

      for (const pattern of patterns) {
        if (pattern.test(block.text)) {
          const existing = corrections[chart];
          const excerpt = block.text.slice(0, 600).trim();
          // Deduplicate by first 200 chars
          const isDupe = existing.some(
            (c) => c.excerpt.slice(0, 200) === excerpt.slice(0, 200)
          );
          if (!isDupe) {
            existing.push({
              nmNumber: block.nm,
              excerpt,
              isPdfBlock: false,
            });
          }
          break;
        }
      }
    }
  }

  // Strategy 2: Line-by-line fallback
  const lines = text.split("\n");
  for (const line of lines) {
    for (const chart of charts) {
      const patterns = [
        new RegExp(`\\bCharts?\\s+${chart}\\b`, "i"),
        new RegExp(`\\bCharts?\\s+[\\d,\\s]*\\b${chart}\\b`, "i"),
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          const existing = corrections[chart];
          const excerpt = line.trim().slice(0, 600);
          // Check if this line text appears in any existing excerpt
          const isDupe = existing.some((c) =>
            c.excerpt.includes(excerpt.slice(0, 200))
          );
          if (!isDupe && excerpt.length > 10) {
            existing.push({
              nmNumber: "—",
              excerpt,
              isPdfBlock: false,
            });
          }
          break;
        }
      }
    }
  }

  return corrections;
}

export function findTPNotices(text, charts) {
  const tpNotices = {};
  for (const chart of charts) {
    tpNotices[chart] = [];
  }

  // T&P table pattern: NM_NUMBER(T or P)/YEAR    CHART_NUMBERS    SUBJECT
  const tpRegex =
    /(\d{3,5}\([TP]\)\/\d{2,4})\s+([\d,\s_]+?)\s{2,}([A-Z][\w\s,\-:;()&]+)/g;
  let match;

  while ((match = tpRegex.exec(text)) !== null) {
    const nmNumber = match[1];
    const chartsStr = match[2];
    const subject = match[3].trim();

    // Parse chart numbers from the list
    const tpCharts = chartsStr
      .split(/[,\s_]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);

    // Check if any user charts match
    for (const chart of charts) {
      if (tpCharts.includes(chart)) {
        tpNotices[chart].push({
          nmNumber,
          charts: chartsStr.trim(),
          subject,
        });
      }
    }
  }

  return tpNotices;
}
