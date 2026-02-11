"use client";

import DownloadPDFButton from "./DownloadPDFButton";

export default function ResultsSummary({ result }) {
  const { weekInfo, totalCorrections, totalTP, totalTPInForce, charts, pdfCount, durationMs, checkedAt, weeklyNtmFile, allBlockChartNums, matchingBlocks } = result;

  const date = new Date(checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card-admiralty p-5">
      <div className="flex items-start justify-between mb-3">
        <h2 className="font-heading text-lg font-semibold text-brass">
          Weekly NtM Report
        </h2>
        <DownloadPDFButton result={result} />
      </div>

      <div className="gold-line mb-3" />

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-1">
        <span className="font-heading text-base font-semibold text-parchment">
          Week {String(weekInfo.week).padStart(2, "0")}/{weekInfo.year}
        </span>
        <span className="text-xs text-sea-slate">
          {weeklyNtmFile || "unknown"}
        </span>
      </div>

      <p className="text-xs text-sea-slate mb-4">
        Checked: {date} &bull; {pdfCount} PDFs parsed &bull; {(durationMs / 1000).toFixed(1)}s
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatBox
          value={totalCorrections}
          label="Corrections"
          color={totalCorrections === 0 ? "green" : "red"}
        />
        <StatBox
          value={totalTP}
          label="New T&P"
          color={totalTP === 0 ? "green" : "amber"}
        />
        <StatBox
          value={totalTPInForce || 0}
          label="T&P In Force"
          color={(totalTPInForce || 0) === 0 ? "green" : "blue"}
        />
        <StatBox value={charts.length} label="Charts" color="neutral" />
      </div>

      {matchingBlocks && matchingBlocks.length > 0 ? (
        <p className="text-xs text-signal-red font-bold">
          Chart block PDFs match your folio: {matchingBlocks.join(", ")}
        </p>
      ) : allBlockChartNums && allBlockChartNums.length > 0 ? (
        <p className="text-xs text-sea-slate">
          No chart block correction PDFs match your folio. Blocks issued for:{" "}
          {allBlockChartNums.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function StatBox({ value, label, color }) {
  const styles = {
    green: "bg-signal-green-bg border-signal-green/30 text-signal-green",
    red: "bg-signal-red-bg border-signal-red/30 text-signal-red",
    amber: "bg-signal-amber-bg border-signal-amber/30 text-signal-amber",
    blue: "bg-signal-blue-bg border-signal-blue/30 text-signal-blue",
    neutral: "bg-navy-700 border-navy-600 text-parchment",
  }[color];

  return (
    <div className={`rounded-md p-4 text-center border ${styles}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-[11px] uppercase font-bold tracking-wider text-sea-slate mt-1">
        {label}
      </div>
    </div>
  );
}
