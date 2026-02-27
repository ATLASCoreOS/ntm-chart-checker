"use client";

import ResultsSummary from "./ResultsSummary";
import ChartResult from "./ChartResult";

export default function CheckHistoryCard({ check, expanded, expandedResult, onExpand, loadingDetail }) {
  const date = new Date(check.checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasFindings = check.totalCorrections > 0 || check.totalTP > 0;

  return (
    <div className="card-interactive overflow-hidden">
      <button
        onClick={() => onExpand(check.id)}
        className="w-full text-left px-5 py-4 flex items-center justify-between"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${hasFindings ? "bg-red-400" : "bg-emerald-400"}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {check.vesselName && (
                <span className="text-navy-700">{check.vesselName}<span className="mx-1.5 text-slate-200">|</span></span>
              )}
              {date}
            </p>
            <p className="text-2xs text-slate-400 mt-0.5 tabular-nums">
              {check.charts.length} charts &middot; {check.totalCorrections} correction{check.totalCorrections !== 1 ? "s" : ""} &middot; {check.totalTP} T&P
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5 animate-slide-down">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-2xs text-slate-400 py-4 justify-center">
              <span className="w-4 h-4 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
              Loading results...
            </div>
          ) : expandedResult ? (
            <div className="space-y-3">
              <ResultsSummary result={expandedResult} />
              <div className="card overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {expandedResult.charts.map((chart) => (
                    <ChartResult
                      key={chart}
                      chart={chart}
                      corrections={expandedResult.corrections[chart] || []}
                      tpNotices={expandedResult.tpNotices[chart] || []}
                      tpInForce={expandedResult.tpInForce?.[chart] || []}
                      sectionIIUrl={expandedResult.sectionIIUrl}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
