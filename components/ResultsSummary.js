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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Weekly NtM Report
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Week {String(weekInfo.week).padStart(2, "0")}/{weekInfo.year}
            <span className="mx-2 text-gray-300">|</span>
            {weeklyNtmFile || "unknown"}
          </p>
        </div>
        <DownloadPDFButton result={result} />
      </div>

      <p className="text-xs text-gray-400 mb-4">
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
          color={totalTP === 0 ? "green" : "orange"}
        />
        <StatBox
          value={totalTPInForce || 0}
          label="T&P In Force"
          color={(totalTPInForce || 0) === 0 ? "green" : "blue"}
        />
        <StatBox value={charts.length} label="Charts" color="neutral" />
      </div>

      {matchingBlocks && matchingBlocks.length > 0 ? (
        <p className="text-xs text-red-600 font-medium">
          Chart block PDFs match your folio: {matchingBlocks.join(", ")}
        </p>
      ) : allBlockChartNums && allBlockChartNums.length > 0 ? (
        <p className="text-xs text-gray-400">
          No chart block correction PDFs match your folio. Blocks issued for:{" "}
          {allBlockChartNums.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function StatBox({ value, label, color }) {
  const styles = {
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    neutral: "bg-gray-50 border-gray-200 text-gray-700",
  }[color];

  return (
    <div className={`rounded-lg p-3 text-center border ${styles}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] uppercase font-medium tracking-wider text-gray-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}
