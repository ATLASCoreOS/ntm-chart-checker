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
    <div className="card-maritime p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-brass uppercase tracking-wider">
          Your Charts
        </h2>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-brass hover:text-brass-light transition-colors"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {chartsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-navy-700 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {charts.map((chart) => (
              <span
                key={chart}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-700 border border-navy-600 rounded-md text-sm font-medium text-parchment"
              >
                {chart}
                {editing && (
                  <button
                    onClick={() => removeChart(chart)}
                    aria-label={`Remove chart ${chart}`}
                    className="text-sea-slate hover:text-signal-red ml-1 transition-colors"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
            {charts.length === 0 && (
              <p className="text-sm text-sea-slate">No charts added yet.</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add chart number..."
                className="input-maritime flex-1 text-sm"
              />
              <button
                onClick={addChart}
                className="px-4 py-2 bg-brass text-navy-900 text-sm font-semibold rounded-md hover:bg-brass-light transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
