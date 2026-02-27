"use client";

import { useState, useEffect, useRef } from "react";

// Module-level cache: one loaded PDF shared across all correction viewers
let cachedPdf = null;
let cachedPdfUrl = null;
let loadingPromise = null;

async function loadPdf(proxyUrl) {
  if (cachedPdf && cachedPdfUrl === proxyUrl) {
    return cachedPdf;
  }
  if (loadingPromise && cachedPdfUrl === proxyUrl) {
    return loadingPromise;
  }

  cachedPdfUrl = proxyUrl;
  loadingPromise = (async () => {
    const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const pdf = await pdfjsLib.getDocument(proxyUrl).promise;
    cachedPdf = pdf;
    loadingPromise = null;
    return pdf;
  })();

  return loadingPromise;
}

// Find crop boundaries for a specific chart section within an NM notice.
// PDF coordinate system: Y=0 is at bottom of page, Y increases upward.
// An NM notice (e.g. 764) may cover multiple charts — we crop to just the
// "Chart {chartNumber}" section and its instructions.
function findCropBounds(textItems, nmNumber, chartNumber, pageHeight) {
  const nmStr = String(nmNumber).replace(/\*$/, "");
  const chartStr = String(chartNumber);
  // Escape underscores for regex and allow underscore or space in PDF text
  const chartPattern = chartStr.replace(/_/g, "[_ ]");

  // Sort items top-to-bottom (highest PDF Y = top of page)
  const sorted = [...textItems].sort((a, b) => b.transform[5] - a.transform[5]);

  // Group items into lines by Y position (within 3 units = same line)
  const lines = [];
  let currentLine = null;
  for (const item of sorted) {
    const y = item.transform[5];
    if (!currentLine || Math.abs(currentLine.y - y) > 3) {
      currentLine = { y, text: item.str, items: [item] };
      lines.push(currentLine);
    } else {
      currentLine.text += " " + item.str;
      currentLine.items.push(item);
    }
  }

  // Strategy 1: Find "Chart {chartNumber}" header line for chart-level crop.
  // This is the primary approach for multi-chart NM notices.
  let chartLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    if (new RegExp(`^Chart\\s+${chartPattern}\\b`, "i").test(text)) {
      chartLineIdx = i;
      break;
    }
  }

  if (chartLineIdx !== -1) {
    // Found the chart header — crop from there to next boundary
    const topPdfY = lines[chartLineIdx].y;

    let bottomPdfY = 0;
    for (let i = chartLineIdx + 1; i < lines.length; i++) {
      const text = lines[i].text.trim();

      // Next "Chart XXXX" line (different chart)
      if (/^Chart\s+\S+/i.test(text)) {
        const match = text.match(/^Chart\s+(\S+)/i);
        // Normalize: replace spaces/underscores for comparison
        const found = match ? match[1].replace(/[_ ]/g, "") : "";
        const target = chartStr.replace(/[_ ]/g, "");
        if (found !== target) {
          bottomPdfY = lines[i].y;
          break;
        }
      }

      // Next NM notice header (different NM number)
      const nextNmMatch = text.match(/^(\d{3,5})\*?\s/);
      if (nextNmMatch && nextNmMatch[1] !== nmStr) {
        bottomPdfY = lines[i].y;
        break;
      }

      // Page footer markers
      if (/^Wk\d{2}\/\d{2}/.test(text)) {
        bottomPdfY = lines[i].y;
        break;
      }
    }

    const topPadding = 20;
    const bottomPadding = 12;
    return {
      cropTopPdf: Math.min(topPdfY + topPadding, pageHeight),
      cropBottomPdf: bottomPdfY > 0 ? bottomPdfY + bottomPadding : 0,
    };
  }

  // Strategy 2: No explicit "Chart" header found — single-chart notice.
  // Crop to the whole NM notice (NM header to next NM or page footer).
  let nmLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    if (
      new RegExp(`^${nmStr}\\*?\\s`).test(text) ||
      new RegExp(`^${nmStr}\\*?$`).test(text)
    ) {
      nmLineIdx = i;
      break;
    }
  }

  if (nmLineIdx === -1) return null;

  const topPdfY = lines[nmLineIdx].y;
  let bottomPdfY = 0;
  for (let i = nmLineIdx + 1; i < lines.length; i++) {
    const text = lines[i].text.trim();
    const nextNmMatch = text.match(/^(\d{3,5})\*?\s/);
    if (nextNmMatch && nextNmMatch[1] !== nmStr) {
      bottomPdfY = lines[i].y;
      break;
    }
    if (/^Wk\d{2}\/\d{2}/.test(text)) {
      bottomPdfY = lines[i].y;
      break;
    }
  }

  const topPadding = 20;
  const bottomPadding = 12;
  return {
    cropTopPdf: Math.min(topPdfY + topPadding, pageHeight),
    cropBottomPdf: bottomPdfY > 0 ? bottomPdfY + bottomPadding : 0,
  };
}

export default function CorrectionPDFView({
  sectionIIUrl,
  pageNumber,
  chartNumber,
  nmNumber,
  onError,
}) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sectionIIUrl || !pageNumber) {
      setLoading(false);
      setError("No PDF page available");
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(sectionIIUrl)}`;
        const pdf = await loadPdf(proxyUrl);

        if (cancelled) return;

        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          setError("Page out of range");
          setLoading(false);
          return;
        }

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const scale = 2;
        const viewport = page.getViewport({ scale });
        const pageHeight = page.getViewport({ scale: 1 }).height;

        // Get text content for crop boundary detection
        const textContent = await page.getTextContent();
        if (cancelled) return;

        const bounds = chartNumber && nmNumber
          ? findCropBounds(textContent.items, nmNumber, chartNumber, pageHeight)
          : null;

        // Render full page to offscreen canvas
        const offscreen = document.createElement("canvas");
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;

        await page.render({
          canvasContext: offscreen.getContext("2d"),
          viewport,
        }).promise;

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        if (bounds) {
          // Convert PDF coords to canvas coords (scaled)
          // PDF: Y=0 bottom, Y=pageHeight top
          // Canvas: Y=0 top, Y=viewport.height bottom
          const canvasTop = Math.round((pageHeight - bounds.cropTopPdf) * scale);
          const canvasBottom = Math.round((pageHeight - bounds.cropBottomPdf) * scale);
          const cropHeight = canvasBottom - canvasTop;

          if (cropHeight > 20) {
            canvas.width = viewport.width;
            canvas.height = cropHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
              offscreen,
              0, canvasTop, viewport.width, cropHeight, // source
              0, 0, viewport.width, cropHeight            // destination
            );
          } else {
            // Crop region too small, show full page
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.getContext("2d").drawImage(offscreen, 0, 0);
          }
        } else {
          // No crop — show full page
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.getContext("2d").drawImage(offscreen, 0, 0);
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("CorrectionPDFView error:", err.message, { sectionIIUrl, pageNumber, chartNumber });
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [sectionIIUrl, pageNumber, chartNumber, nmNumber]);

  useEffect(() => {
    if (error && onError) onError();
  }, [error, onError]);

  if (error) {
    return null;
  }

  return (
    <div className="border-t border-red-100">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-6 px-4 justify-center">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading NtM page...
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full bg-white"
        style={{ display: loading ? "none" : "block" }}
      />
    </div>
  );
}
