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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Your Charts
        </h2>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-navy hover:underline transition-colors"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {chartsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {charts.map((chart) => (
              <span
                key={chart}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800"
              >
                {chart}
                {editing && (
                  <button
                    onClick={() => removeChart(chart)}
                    aria-label={`Remove chart ${chart}`}
                    className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
            {charts.length === 0 && (
              <p className="text-sm text-gray-400">No charts added yet.</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chart number..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              />
              <button
                onClick={addChart}
                className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-md hover:bg-navy-800 transition-colors"
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
