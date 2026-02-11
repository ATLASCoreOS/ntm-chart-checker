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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <p className="text-sm font-medium text-slate-900">{date}</p>
        <p className="text-xs text-slate-500 mt-1">
          {check.charts.length} charts &bull; {check.totalCorrections} correction{check.totalCorrections !== 1 ? "s" : ""} &bull; {check.totalTP} T&P
        </p>
        <button
          onClick={() => onExpand(check.id)}
          className="text-xs text-blue-600 hover:underline mt-2"
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "▸ View details"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading results...
            </div>
          ) : expandedResult ? (
            <div className="space-y-3">
              <ResultsSummary result={expandedResult} />
              <div className="space-y-2">
                {expandedResult.charts.map((chart) => (
                  <ChartResult
                    key={chart}
                    chart={chart}
                    corrections={expandedResult.corrections[chart] || []}
                    tpNotices={expandedResult.tpNotices[chart] || []}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
