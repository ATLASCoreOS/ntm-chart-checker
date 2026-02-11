"use client";

import { useState } from "react";
import CorrectionItem from "./CorrectionItem";
import TPItem from "./TPItem";

export default function ChartResult({ chart, corrections, tpNotices, tpInForce = [] }) {
  const hasFindings = corrections.length > 0 || tpNotices.length > 0 || tpInForce.length > 0;
  const [open, setOpen] = useState(hasFindings);

  let badgeText = "Clear";
  let badgeClass = "bg-signal-green-bg text-signal-green border border-signal-green/30";

  if (corrections.length > 0) {
    badgeText = `${corrections.length} correction${corrections.length > 1 ? "s" : ""}`;
    badgeClass = "bg-signal-red-bg text-signal-red border border-signal-red/30";
  } else if (tpNotices.length > 0 || tpInForce.length > 0) {
    const count = tpNotices.length + tpInForce.length;
    badgeText = `${count} T&P`;
    badgeClass = "bg-signal-amber-bg text-signal-amber border border-signal-amber/30";
  }

  return (
    <div className="border border-navy-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-700 transition-colors"
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <span className="font-semibold text-parchment">
          {open ? "▾" : "▸"} Chart {chart}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeClass}`}>
          {badgeText}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-navy-600">
          {!hasFindings && (
            <p className="text-signal-green text-sm mt-3">
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
              <h4 className="text-xs font-semibold text-signal-amber uppercase tracking-wider mb-2">
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
              <h4 className="text-xs font-semibold text-signal-blue uppercase tracking-wider mb-2">
                T&P Notices In Force ({tpInForce.length})
              </h4>
              <div className="space-y-2">
                {tpInForce.map((tp, i) => (
                  <div key={i} className="border-l-3 border-signal-blue bg-signal-blue-bg rounded-r-lg p-3">
                    <div className="text-xs font-bold text-parchment">{tp.nmNumber}</div>
                    <p className="text-xs text-parchment-muted mt-1">
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
