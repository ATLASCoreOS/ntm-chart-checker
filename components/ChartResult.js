"use client";

import { useState } from "react";
import CorrectionItem from "./CorrectionItem";
import TPItem from "./TPItem";

export default function ChartResult({ chart, corrections, tpNotices }) {
  const hasFindings = corrections.length > 0 || tpNotices.length > 0;
  const [open, setOpen] = useState(hasFindings);

  let badgeText = "Clear";
  let badgeClass = "bg-green-100 text-green-700";

  if (corrections.length > 0) {
    badgeText = `${corrections.length} correction${corrections.length > 1 ? "s" : ""}`;
    badgeClass = "bg-red-100 text-red-700";
  } else if (tpNotices.length > 0) {
    badgeText = `${tpNotices.length} T&P in force`;
    badgeClass = "bg-amber-100 text-amber-700";
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900">
          {open ? "▾" : "▸"} Chart {chart}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
          {badgeText}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {!hasFindings && (
            <p className="text-green-600 text-sm mt-3">
              No corrections or T&P notices for this chart.
            </p>
          )}

          {corrections.length > 0 && (
            <div className="mt-3 space-y-2">
              {corrections.map((corr, i) => (
                <CorrectionItem key={i} correction={corr} />
              ))}
            </div>
          )}

          {tpNotices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                T&P Notices In Force
              </h4>
              <div className="space-y-2">
                {tpNotices.map((tp, i) => (
                  <TPItem key={i} tp={tp} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
