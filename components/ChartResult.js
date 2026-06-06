"use client";

import { useState } from "react";
import CorrectionItem from "./CorrectionItem";
import TPItem from "./TPItem";

export default function ChartResult({ chart, chartName, corrections, tpNotices, tpInForce = [], sectionIIUrl }) {
  const hasFindings = corrections.length > 0 || tpNotices.length > 0 || tpInForce.length > 0;
  const [open, setOpen] = useState(hasFindings);
  const panelId = `chart-${chart}-panel`;

  let statusDot = "bg-emerald-400";
  let badgeText = "Clear";
  let badgeClass = "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40";

  if (corrections.length > 0) {
    statusDot = "bg-red-400";
    badgeText = `${corrections.length} correction${corrections.length > 1 ? "s" : ""}`;
    badgeClass = "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40";
  } else if (tpNotices.length > 0 || tpInForce.length > 0) {
    statusDot = "bg-amber-400";
    const count = tpNotices.length + tpInForce.length;
    badgeText = `${count} T&P`;
    badgeClass = "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40";
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 min-h-[44px]"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />
          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm font-mono shrink-0">
            {chart}
          </span>
          {chartName && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {chartName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`text-2xs font-medium px-2 py-0.5 rounded-md ${badgeClass}`}>
            {badgeText}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div id={panelId} className="px-5 pb-4 animate-slide-down">
          {!hasFindings && (
            <p className="text-emerald-600 text-sm py-2">
              No corrections or T&P notices for this chart.
            </p>
          )}

          {corrections.length > 0 && (
            <div className="mt-1">
              <h4 className="label text-red-600 mb-2">
                Corrections
              </h4>
              <div className="space-y-2.5">
                {corrections.map((corr, i) => (
                  <CorrectionItem key={i} correction={corr} chartNumber={chart} sectionIIUrl={sectionIIUrl} />
                ))}
              </div>
            </div>
          )}

          {tpNotices.length > 0 && (
            <div className="mt-4">
              <h4 className="label text-amber-600 mb-2">
                New T&P This Week
              </h4>
              <div className="space-y-2.5">
                {tpNotices.map((tp, i) => (
                  <TPItem key={i} tp={tp} />
                ))}
              </div>
            </div>
          )}

          {tpInForce.length > 0 && (
            <div className="mt-4">
              <h4 className="label text-sky-600 mb-2">
                T&P In Force ({tpInForce.length})
              </h4>
              <div className="space-y-2">
                {tpInForce.map((tp, i) => (
                  <div key={i} className="border border-sky-100 dark:border-sky-900 rounded-lg overflow-hidden">
                    <div className="bg-sky-50 dark:bg-sky-950/40 px-4 py-2">
                      <span className="text-sm font-semibold text-sky-800 dark:text-sky-200 font-mono">
                        {tp.nmNumber}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 bg-white dark:bg-slate-900 space-y-1">
                      {tp.subject && (
                        <p className="text-2xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">Subject</span>
                          {tp.subject}
                        </p>
                      )}
                      <p className="text-2xs text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">Charts</span>
                        <span className="font-mono">{tp.charts}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
