"use client";

import { useState } from "react";

export default function ChartManager({ charts, chartsLoading, onChartsChange }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  function addChart() {
    const num = parseInt(input, 10);
    if (isNaN(num) || num <= 0 || num > 99999) return;
    if (charts.includes(num)) return;
    const updated = [...charts, num].sort((a, b) => a - b);
    onChartsChange(updated);
    setInput("");
  }

  function removeChart(num) {
    onChartsChange(charts.filter((c) => c !== num));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addChart();
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Your Charts</h2>
          <p className="text-2xs text-slate-400 mt-0.5">
            {charts.length} chart{charts.length !== 1 ? "s" : ""} in folio
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {chartsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {charts.map((chart) => (
              <span
                key={chart}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-colors duration-150 ${
                  editing
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-slate-50 text-slate-700 border border-slate-100"
                }`}
              >
                {chart}
                {editing && (
                  <button
                    onClick={() => removeChart(chart)}
                    aria-label={`Remove chart ${chart}`}
                    className="text-slate-400 hover:text-red-500 transition-colors duration-150 -mr-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {charts.length === 0 && (
              <p className="text-sm text-slate-400">No charts added yet. Tap Edit to add your chart numbers.</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 mt-4">
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chart number"
                className="input-field flex-1"
              />
              <button onClick={addChart} className="btn-primary px-4">
                Add
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
