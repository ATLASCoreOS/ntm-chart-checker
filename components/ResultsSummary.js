"use client";

import DownloadPDFButton from "./DownloadPDFButton";

export default function ResultsSummary({ result }) {
  const {
    weekInfo,
    totalCorrections,
    totalTP,
    totalTPInForce,
    tpInForceWeek,
    charts,
    durationMs,
    checkedAt,
    fromCache,
    allBlockChartNums,
    matchingBlocks,
  } = result;

  const date = new Date(checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // How many of the user's charts actually need a correction this week
  const chartsNeedingCorrection = charts.filter(
    (c) => (result.corrections?.[c]?.length || 0) > 0
  ).length;

  // Verdict: corrections dominate; otherwise T&P to review; otherwise all clear
  let verdict;
  if (totalCorrections > 0) {
    verdict = {
      tone: "alert",
      label: "Action required",
      headline: `${chartsNeedingCorrection} of ${charts.length} chart${charts.length !== 1 ? "s" : ""} need correcting`,
      hero: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-800 dark:text-red-200",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      ),
    };
  } else if (totalTP > 0 || totalTPInForce > 0) {
    verdict = {
      tone: "warning",
      label: "T&P to review",
      headline: `No corrections — ${totalTP + totalTPInForce} T&P notice${totalTP + totalTPInForce !== 1 ? "s" : ""} affect your charts`,
      hero: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-800 dark:text-amber-200",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      ),
    };
  } else {
    verdict = {
      tone: "clear",
      label: "All clear",
      headline: `All ${charts.length} chart${charts.length !== 1 ? "s" : ""} up to date`,
      hero: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    };
  }

  return (
    <div className="card overflow-hidden" role="status" aria-live="polite">
      {/* Verdict hero — the glanceable answer */}
      <div className={`px-5 py-5 ${verdict.hero}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`flex items-center gap-2 ${verdict.text}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                {verdict.icon}
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider">{verdict.label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${verdict.text}`}>
              {verdict.headline}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {result.vesselName && (
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {result.vesselName}
                  <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                </span>
              )}
              Week {String(weekInfo.week).padStart(2, "0")}/{weekInfo.year}
            </p>
          </div>
          <DownloadPDFButton result={result} />
        </div>
      </div>

      {/* Stat strip + legend */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatBox value={totalCorrections} label="Corrections" status={totalCorrections === 0 ? "clear" : "alert"} />
          <StatBox value={totalTP} label="New T&P" status={totalTP === 0 ? "clear" : "warning"} />
          <StatBox value={totalTPInForce || 0} label="T&P In Force" status={(totalTPInForce || 0) === 0 ? "clear" : "info"} />
          <StatBox value={charts.length} label="Charts" status="neutral" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-2xs text-slate-400 dark:text-slate-500">
          <Key color="bg-red-400" text="Correction — chart needs updating" />
          <Key color="bg-amber-400" text="New T&P this week" />
          <Key color="bg-sky-400" text="T&P in force" />
        </div>

        {result.failures && result.failures.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg p-3 mt-4">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Some data could not be checked:</p>
            <ul className="space-y-0.5">
              {result.failures.map((f, i) => (
                <li key={i} className="text-2xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-px">&#8226;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tpInForceWeek && (tpInForceWeek.year !== weekInfo.year || tpInForceWeek.week !== weekInfo.week) && (
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-3">
            T&P In Force list from <span className="font-medium">Wk {String(tpInForceWeek.week).padStart(2, "0")}/{tpInForceWeek.year}</span> — the UKHO publishes it monthly.
          </p>
        )}

        {matchingBlocks && matchingBlocks.length > 0 ? (
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-2">
            Chart block PDFs available for your folio: <span className="font-medium">{matchingBlocks.join(", ")}</span>
          </p>
        ) : allBlockChartNums && allBlockChartNums.length > 0 ? (
          <p className="text-2xs text-slate-400 dark:text-slate-500 mt-2">
            No chart blocks match your folio this week.
          </p>
        ) : null}

        <p className="text-2xs text-slate-300 dark:text-slate-600 mt-3 tabular-nums">
          {date} · {(durationMs / 1000).toFixed(1)}s{fromCache ? " · cached" : ""}
        </p>
      </div>
    </div>
  );
}

function Key({ color, text }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {text}
    </span>
  );
}

function StatBox({ value, label, status }) {
  const styles = {
    clear: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    alert: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    neutral: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  }[status];

  return (
    <div className={`rounded-lg p-3 text-center border ${styles}`}>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-2xs uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}
