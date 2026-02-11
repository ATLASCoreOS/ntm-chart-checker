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
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Your Charts
        </h2>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-blue-600 hover:underline"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {chartsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-slate-200 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {charts.map((chart) => (
              <span
                key={chart}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700"
              >
                {chart}
                {editing && (
                  <button
                    onClick={() => removeChart(chart)}
                    aria-label={`Remove chart ${chart}`}
                    className="text-slate-400 hover:text-red-500 ml-1"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
            {charts.length === 0 && (
              <p className="text-sm text-slate-400">No charts added yet.</p>
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addChart}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
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
