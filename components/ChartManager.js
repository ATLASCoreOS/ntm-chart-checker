"use client";

import { useState, useEffect, useRef } from "react";

// Pull every 1–5 digit number out of free text ("1534, 1535 1543\n2052")
function parseNumbers(text) {
  return (text.match(/\d{1,5}/g) || [])
    .map((s) => parseInt(s, 10))
    .filter((n) => n > 0 && n <= 99999);
}

export default function ChartManager({ charts, chartsLoading, onChartsChange }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [names, setNames] = useState({}); // number -> title (null if unknown)
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  // Resolve titles for the charts currently in the folio (one batch request)
  useEffect(() => {
    const missing = charts.filter((c) => !(c in names));
    if (missing.length === 0) return;
    let cancelled = false;
    fetch(`/api/charts?nums=${missing.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.names) setNames((prev) => ({ ...prev, ...d.names }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [charts, names]);

  // Debounced typeahead while editing
  useEffect(() => {
    const q = input.trim();
    if (!editing || !q || /[,\s]/.test(q)) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/charts?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.results || []))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [input, editing]);

  function addNumbers(nums) {
    const fresh = nums.filter((n) => !charts.includes(n));
    if (fresh.length === 0) {
      setInput("");
      setSuggestions([]);
      return;
    }
    onChartsChange([...charts, ...fresh].sort((a, b) => a - b));
    setInput("");
    setSuggestions([]);
  }

  function addFromInput() {
    addNumbers(parseNumbers(input));
  }

  function removeChart(num) {
    onChartsChange(charts.filter((c) => c !== num));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addFromInput();
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
          className="btn-secondary text-sm min-h-[44px] py-2 px-4"
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
                title={names[chart] || undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  editing
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-slate-50 text-slate-700 border border-slate-100"
                }`}
              >
                <span className="font-mono">{chart}</span>
                {names[chart] && (
                  <span className="text-2xs text-slate-400 font-normal max-w-[10rem] truncate hidden sm:inline">
                    {names[chart]}
                  </span>
                )}
                {editing && (
                  <button
                    onClick={() => removeChart(chart)}
                    aria-label={`Remove chart ${chart}`}
                    className="ml-0.5 -mr-1 p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add charts — number or name; paste many"
                    className="input-field w-full"
                    autoComplete="off"
                    aria-label="Add chart numbers"
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-elevated max-h-64 overflow-auto">
                      {suggestions.map((s) => (
                        <li key={s.number}>
                          <button
                            type="button"
                            onClick={() => addNumbers([s.number])}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-baseline gap-2"
                          >
                            <span className="font-mono text-sm text-slate-800">{s.number}</span>
                            <span className="text-xs text-slate-500 truncate">{s.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={addFromInput} className="btn-primary min-h-[44px] px-4">
                  Add
                </button>
              </div>
              <p className="text-2xs text-slate-400 mt-1.5">
                Tip: paste a whole list — e.g. <span className="font-mono">1534, 1535 1543</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
