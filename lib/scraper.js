import { BASE_URL, WEEKLY_PAGE, USER_AGENT, MAX_RETRIES, RETRY_BASE_MS, FETCH_TIMEOUT_MS } from "./constants";
import { log } from "./logger";

const WEEKLY_URL = BASE_URL + WEEKLY_PAGE;

/**
 * Fetch with exponential backoff retry and timeout.
 * Retries on network errors and 5xx responses.
 */
export async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.ok) return res;
      // Retry on server errors (5xx), fail immediately on client errors (4xx)
      if (res.status < 500) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      if (attempt < retries) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        log("warn", `Retry ${attempt + 1}/${retries} for ${url} (${res.status}), waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw new Error(`HTTP ${res.status} from ${url} after ${retries + 1} attempts`);
      }
    } catch (err) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        if (attempt < retries) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          log("warn", `Timeout retry ${attempt + 1}/${retries} for ${url}, waiting ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw new Error(`Request to ${url} timed out after ${retries + 1} attempts`);
        }
      } else if (err.message.startsWith("HTTP ")) {
        throw err; // Don't retry 4xx errors
      } else if (attempt < retries) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        log("warn", `Network error retry ${attempt + 1}/${retries} for ${url}: ${err.message}, waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// Extract anti-forgery token from UKHO page HTML
function extractToken(html) {
  const m =
    html.match(/name="__RequestVerificationToken"[^>]+value="([^"]+)"/) ||
    html.match(/value="([^"]+)"[^>]+name="__RequestVerificationToken"/);
  return m ? m[1] : null;
}

// Extract Set-Cookie header(s) from a fetch response
function extractCookies(res) {
  // getSetCookie() returns an array in Node 18+; fall back to get()
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie().join("; ");
  }
  return res.headers.get("set-cookie") || "";
}

export async function fetchWeeklyPage(options = {}) {
  const { year, week } = options;

  // Current week: simple GET (existing behavior)
  if (!year || !week) {
    const res = await fetchWithRetry(WEEKLY_URL, {
      headers: { "User-Agent": USER_AGENT },
    });
    return await res.text();
  }

  // Past week: GET to obtain token + cookies, then POST with year/week
  const getRes = await fetchWithRetry(WEEKLY_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  const getHtml = await getRes.text();
  const token = extractToken(getHtml);
  if (!token) {
    throw new Error("Could not extract UKHO anti-forgery token");
  }
  const cookies = extractCookies(getRes);

  const postRes = await fetchWithRetry(WEEKLY_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: `year=${year}&week=${week}&__RequestVerificationToken=${encodeURIComponent(token)}`,
  });
  return await postRes.text();
}

export async function fetchAvailableWeeks() {
  const res = await fetch(WEEKLY_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch weekly page: ${res.status}`);
  }
  const html = await res.text();

  // Extract serverData from embedded JavaScript: var serverData = [{"Year":2023,"Week":10},...];
  const m = html.match(/var\s+serverData\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) {
    return [];
  }

  const data = JSON.parse(m[1]);

  // Normalize to lowercase keys and sort descending (newest first)
  const weeks = data
    .map((d) => ({ year: d.Year, week: d.Week }))
    .sort((a, b) => b.year - a.year || b.week - a.week);

  return weeks;
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
