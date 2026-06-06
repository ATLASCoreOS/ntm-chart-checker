"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function PDFBlockViewer({ blockUrl, blockFilename }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadBlock = useCallback(async () => {
    setDownloading(true);
    setError(null);
    let objectUrl;
    try {
      // Pull the original UKHO block PDF through the auth'd, domain-locked proxy
      const res = await fetch(`/api/pdf-proxy?url=${encodeURIComponent(blockUrl)}`);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = blockFilename || "chart-block.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Download failed");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDownloading(false);
    }
  }, [blockUrl, blockFilename]);

  const renderPDF = useCallback(async () => {
    if (rendered || loading) return;
    setLoading(true);
    setError(null);

    try {
      const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(blockUrl)}`;
      const pdf = await pdfjsLib.getDocument(proxyUrl).promise;
      const page = await pdf.getPage(1);

      const scale = 2;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
      }).promise;

      setRendered(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [blockUrl, rendered, loading]);

  useEffect(() => {
    if (expanded && !rendered) {
      renderPDF();
    }
  }, [expanded, rendered, renderPDF]);

  return (
    <div className="border-t border-red-100">
      <div className="flex items-center justify-between px-4 py-2 gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors min-w-0"
          aria-expanded={expanded}
        >
          <svg
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="truncate">
            {expanded ? "Hide" : "View"} Chart Block
            {blockFilename && (
              <span className="text-gray-400 font-normal"> ({blockFilename})</span>
            )}
          </span>
        </button>

        <button
          onClick={downloadBlock}
          disabled={downloading}
          className="btn-secondary text-2xs py-1 px-2 shrink-0 inline-flex items-center gap-1.5"
          title="Download the original UKHO chart block PDF"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {downloading ? "..." : "Download"}
        </button>
      </div>

      {error && !expanded && (
        <p className="text-xs text-red-500 px-4 pb-2">{error}</p>
      )}

      {expanded && (
        <div className="px-4 pb-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
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
              Loading chart block...
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 py-2">
              Failed to load chart block: {error}
            </p>
          )}

          <canvas
            ref={canvasRef}
            className="w-full rounded border border-gray-200"
            style={{ display: rendered ? "block" : "none" }}
          />
        </div>
      )}
    </div>
  );
}
