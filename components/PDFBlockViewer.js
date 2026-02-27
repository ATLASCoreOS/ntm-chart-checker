"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function PDFBlockViewer({ blockUrl, blockFilename }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [rendered, setRendered] = useState(false);

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
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {expanded ? "Hide" : "View"} Chart Block
        {blockFilename && (
          <span className="text-gray-400 font-normal">({blockFilename})</span>
        )}
      </button>

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
