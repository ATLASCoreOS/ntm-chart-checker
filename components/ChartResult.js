"use client";

import { useState } from "react";
import CorrectionItem from "./CorrectionItem";
import TPItem from "./TPItem";

export default function ChartResult({ chart, corrections, tpNotices, tpInForce = [] }) {
  const hasFindings = corrections.length > 0 || tpNotices.length > 0 || tpInForce.length > 0;
  const [open, setOpen] = useState(hasFindings);

  let badgeText = "Clear";
  let badgeClass = "bg-green-50 text-green-700 border border-green-200";

  if (corrections.length > 0) {
    badgeText = `${corrections.length} correction${corrections.length > 1 ? "s" : ""}`;
    badgeClass = "bg-red-50 text-red-700 border border-red-200";
  } else if (tpNotices.length > 0 || tpInForce.length > 0) {
    const count = tpNotices.length + tpInForce.length;
    badgeText = `${count} T&P`;
    badgeClass = "bg-orange-50 text-orange-700 border border-orange-200";
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900 text-sm">
          {open ? "▾" : "▸"} Chart {chart}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${badgeClass}`}>
          {badgeText}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
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
              <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">
                New T&P Notices This Week
              </h4>
              <div className="space-y-2">
                {tpNotices.map((tp, i) => (
                  <TPItem key={i} tp={tp} />
                ))}
              </div>
            </div>
          )}

          {tpInForce.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                T&P Notices In Force ({tpInForce.length})
              </h4>
              <div className="space-y-2">
                {tpInForce.map((tp, i) => (
                  <div key={i} className="border-l-[3px] border-blue-400 bg-blue-50 rounded-r-lg p-3">
                    <div className="text-xs font-semibold text-gray-800">{tp.nmNumber}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Charts: {tp.charts}
                      {tp.subject && <span> — {tp.subject}</span>}
                    </p>
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
