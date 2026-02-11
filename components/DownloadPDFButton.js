"use client";

import { useState } from "react";

export default function DownloadPDFButton({ result, checkId }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setGenerating(true);
    setError(null);
    try {
      const body = checkId ? { checkId } : { result };
      const res = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const week = result?.weekInfo?.week || "unknown";
      const year = result?.weekInfo?.year || "unknown";
      a.download = `NtM-Report-Wk${String(week).padStart(2, "0")}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={generating}
        className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {generating ? "Generating..." : "Export PDF"}
      </button>
      {error && <span className="text-xs text-signal-red">{error}</span>}
    </div>
  );
}
