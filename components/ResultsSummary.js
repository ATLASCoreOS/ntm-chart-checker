"use client";

import DownloadPDFButton from "./DownloadPDFButton";

export default function ResultsSummary({ result }) {
  const { weekInfo, totalCorrections, totalTP, totalTPInForce, tpInForceWeek, charts, pdfCount, durationMs, checkedAt, weeklyNtmFile, allBlockChartNums, matchingBlocks } = result;

  const date = new Date(checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Weekly NtM Report
          </h2>
          <p className="text-2xs text-slate-400 mt-1">
            {result.vesselName && (
              <span className="text-navy-600 font-medium">{result.vesselName}<span className="mx-1.5 text-slate-200">|</span></span>
            )}
            Week {String(weekInfo.week).padStart(2, "0")}/{weekInfo.year}
            <span className="mx-1.5 text-slate-200">|</span>
            {weeklyNtmFile || "unknown"}
          </p>
        </div>
        <DownloadPDFButton result={result} />
      </div>

      <p className="text-2xs text-slate-400 mb-4 tabular-nums">
        {date} &middot; {pdfCount} PDFs parsed &middot; {(durationMs / 1000).toFixed(1)}s
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <StatBox
          value={totalCorrections}
          label="Corrections"
          status={totalCorrections === 0 ? "clear" : "alert"}
        />
        <StatBox
          value={totalTP}
          label="New T&P"
          status={totalTP === 0 ? "clear" : "warning"}
        />
        <StatBox
          value={totalTPInForce || 0}
          label="T&P In Force"
          status={(totalTPInForce || 0) === 0 ? "clear" : "info"}
        />
        <StatBox value={charts.length} label="Charts" status="neutral" />
      </div>

      {result.failures && result.failures.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Some data could not be checked:</p>
          <ul className="space-y-0.5">
            {result.failures.map((f, i) => (
              <li key={i} className="text-2xs text-amber-700 flex items-start gap-1.5">
                <span className="text-amber-400 mt-px">&#8226;</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tpInForceWeek && (tpInForceWeek.year !== weekInfo.year || tpInForceWeek.week !== weekInfo.week) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3">
          <p className="text-2xs text-slate-500">
            T&P In Force data from <span className="font-medium text-slate-600">Wk {String(tpInForceWeek.week).padStart(2, "0")}/{tpInForceWeek.year}</span> — the UKHO publishes this list monthly.
          </p>
        </div>
      )}

      {!tpInForceWeek && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3">
          <p className="text-2xs text-slate-500">
            No cached T&P In Force data yet. Run a check against a week that includes the monthly list to populate.
          </p>
        </div>
      )}

      {matchingBlocks && matchingBlocks.length > 0 ? (
        <p className="text-2xs text-red-600 font-medium">
          Chart block PDFs match your folio: {matchingBlocks.join(", ")}
        </p>
      ) : allBlockChartNums && allBlockChartNums.length > 0 ? (
        <p className="text-2xs text-slate-400">
          No chart block corrections match your folio. Blocks issued for:{" "}
          {allBlockChartNums.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function StatBox({ value, label, status }) {
  const styles = {
    clear: "border-emerald-200 bg-emerald-50 text-emerald-700",
    alert: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  }[status];

  return (
    <div className={`rounded-lg p-3 text-center border ${styles}`}>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-2xs uppercase font-medium tracking-wider text-slate-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}
