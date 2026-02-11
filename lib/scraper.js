import { BASE_URL, WEEKLY_PAGE, USER_AGENT } from "./constants";

export async function fetchWeeklyPage() {
  const res = await fetch(BASE_URL + WEEKLY_PAGE, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch weekly page: ${res.status}`);
  }
  return await res.text();
}

export function parsePageLinks(html) {
  // Extract PDF download links
  const linkRegex =
    /href="(\/NoticesToMariners\/DownloadFile\?fileName=([^&]+)&[^"]+)"/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = BASE_URL + match[1].replace(/&amp;/g, "&");
    const filename = decodeURIComponent(match[2]);
    links.push({ url, filename });
  }

  // Extract week info from page content or filenames
  let year = new Date().getFullYear();
  let week = 0;

  // Try patterns like "2026 Wk 08" or "2026Wk8" or from filenames like wknm2026008
  const weekPatterns = [
    /(\d{4})\s*Wk\s*(\d{1,2})/i,
    /wknm(\d{4})(\d{3})\.pdf/i,
  ];

  for (const pattern of weekPatterns) {
    const m = html.match(pattern);
    if (m) {
      year = parseInt(m[1], 10);
      week = parseInt(m[2], 10);
      break;
    }
  }

  // Also try from link filenames (multiple formats)
  if (week === 0) {
    for (const link of links) {
      // Format: wknm2026008.pdf (full year + 3-digit week)
      let m = link.filename.match(/wknm(\d{4})(\d{3})\.pdf/i);
      if (m) {
        year = parseInt(m[1], 10);
        week = parseInt(m[2], 10);
        break;
      }
      // Format: 08wknm26.pdf (2-digit week + wknm + 2-digit year)
      m = link.filename.match(/^(\d{2})wknm(\d{2})\.pdf/i);
      if (m) {
        week = parseInt(m[1], 10);
        year = 2000 + parseInt(m[2], 10);
        break;
      }
      // Format: 08snii26.pdf (also reveals week/year)
      m = link.filename.match(/^(\d{2})snii(\d{2})\.pdf/i);
      if (m) {
        week = parseInt(m[1], 10);
        year = 2000 + parseInt(m[2], 10);
        break;
      }
    }
  }

  return { links, weekInfo: { year, week } };
}

export function identifyPDFs(links, charts) {
  let weeklyNtm = null;
  let sectionII = null;
  const chartBlocks = [];
  const allChartBlocks = [];

  for (const link of links) {
    const fn = link.filename.toLowerCase();

    if (!weeklyNtm && fn.includes("wknm")) {
      weeklyNtm = link;
    } else if (!sectionII && fn.includes("snii")) {
      sectionII = link;
    }

    // Chart block PDFs: Chart{N}NM{M}.pdf
    const chartBlockMatch = link.filename.match(/^Chart(\d+)NM/i);
    if (chartBlockMatch) {
      const chartNum = parseInt(chartBlockMatch[1], 10);
      allChartBlocks.push({ ...link, chartNum });
      if (charts.includes(chartNum)) {
        chartBlocks.push({ ...link, chartNum });
      }
    }
  }

  return { weeklyNtm, sectionII, chartBlocks, allChartBlocks };
}
