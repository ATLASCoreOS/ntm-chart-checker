"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Link from "next/link";

const keyOf = (i) => `${i.weekYear}-${i.weekNumber}-${i.chart}-${i.nmNumber}`;

// Run async tasks with limited concurrency, reporting progress as each finishes.
async function runPool(items, worker, concurrency, onProgress) {
  let i = 0;
  let done = 0;
  const results = [];
  async function next() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch {
        results[idx] = null;
      }
      onProgress(++done);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, next)
  );
  return results;
}

export default function CorrectionsLogPage() {
  const [charts, setCharts] = useState([]);
  const [vesselName, setVesselName] = useState(null);
  const [names, setNames] = useState({});
  const [items, setItems] = useState([]);
  const [appliedSet, setAppliedSet] = useState(new Set());
  const [weeks, setWeeks] = useState([]);
  const [scanCount, setScanCount] = useState(8);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const runId = useRef(0);

  // Initial load: active folio charts, applied set, available weeks
  useEffect(() => {
    (async () => {
      try {
        const [folioRes, appliedRes, weeksRes] = await Promise.all([
          fetch("/api/folio").then((r) => r.json()),
          fetch("/api/applied").then((r) => r.json()),
          fetch("/api/weeks").then((r) => r.json()),
        ]);
        const active = (folioRes.folios || []).find(
          (f) => f.id === folioRes.activeFolioId
        );
        setCharts(active?.charts || []);
        setVesselName(active?.vesselName || null);
        setAppliedSet(new Set(appliedRes.applied || []));
        setWeeks(weeksRes.weeks || []);
      } catch {
        setError("Failed to load. Please retry.");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Resolve chart titles
  useEffect(() => {
    if (charts.length === 0) return;
    fetch(`/api/charts?nums=${charts.join(",")}`)
      .then((r) => r.json())
      .then((d) => d.names && setNames(d.names))
      .catch(() => {});
  }, [charts]);

  const scan = useCallback(async () => {
    if (charts.length === 0 || weeks.length === 0) return;
    const myRun = ++runId.current;
    setScanning(true);
    setError(null);
    setItems([]);
    const target = weeks.slice(0, scanCount);
    setProgress({ done: 0, total: target.length });

    const perWeek = await runPool(
      target,
      (w) =>
        fetch(`/api/corrections-log/week?year=${w.year}&week=${w.week}`).then((r) =>
          r.ok ? r.json() : { items: [] }
        ),
      3,
      (done) => {
        if (runId.current === myRun) setProgress((p) => ({ ...p, done }));
      }
    );
    if (runId.current !== myRun) return; // superseded

    const flat = [];
    for (const wk of perWeek) {
      if (!wk?.items) continue;
      for (const it of wk.items) {
        flat.push({ ...it, weekYear: wk.weekYear, weekNumber: wk.weekNumber });
      }
    }
    flat.sort(
      (a, b) =>
        a.chart - b.chart ||
        b.weekYear - a.weekYear ||
        b.weekNumber - a.weekNumber
    );
    setItems(flat);
    setScanning(false);
  }, [charts, weeks, scanCount]);

  // Auto-scan once data is ready (and when scope changes)
  useEffect(() => {
    if (ready && charts.length > 0 && weeks.length > 0) scan();
  }, [ready, scan]);

  async function toggle(item) {
    const k = keyOf(item);
    const applied = !appliedSet.has(k);
    setAppliedSet((prev) => {
      const n = new Set(prev);
      applied ? n.add(k) : n.delete(k);
      return n;
    });
    try {
      await fetch("/api/applied", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: item.chart,
          nmNumber: item.nmNumber,
          weekYear: item.weekYear,
          weekNumber: item.weekNumber,
          applied,
        }),
      });
    } catch {
      // revert on failure
      setAppliedSet((prev) => {
        const n = new Set(prev);
        applied ? n.delete(k) : n.add(k);
        return n;
      });
    }
  }

  const visible = outstandingOnly
    ? items.filter((i) => !appliedSet.has(keyOf(i)))
    : items;

  // Group by chart
  const byChart = {};
  for (const it of visible) {
    (byChart[it.chart] = byChart[it.chart] || []).push(it);
  }
  const chartKeys = Object.keys(byChart).map(Number).sort((a, b) => a - b);

  const outstandingTotal = items.filter((i) => !appliedSet.has(keyOf(i))).length;

  return (
    <>
      <NavBar activePage="corrections" />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Corrections to reconcile
            </h2>
            <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
              {vesselName && (
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {vesselName}
                  <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                </span>
              )}
              Last {Math.min(scanCount, weeks.length)} weeks · {items.length} corrections · {outstandingTotal} outstanding
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={outstandingOnly}
                onChange={(e) => setOutstandingOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-navy-700 focus:ring-navy-600/30"
              />
              Outstanding only
            </label>
            <button
              onClick={scan}
              disabled={scanning}
              className="btn-secondary text-sm min-h-[44px]"
            >
              {scanning ? "Scanning…" : "Rescan"}
            </button>
            {weeks.length > scanCount && (
              <button
                onClick={() => setScanCount((n) => n + 8)}
                disabled={scanning}
                className="text-sm text-navy-700 dark:text-navy-300 hover:underline min-h-[44px]"
              >
                Scan 8 more weeks
              </button>
            )}
          </div>

          {scanning && (
            <div className="card p-4">
              <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Scanning UKHO bulletins…</span>
                <span className="tabular-nums">
                  {progress.done}/{progress.total} weeks
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-700 dark:bg-navy-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500 mt-2">
                First scan is slower while weeks are parsed; results are cached afterwards.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm" role="alert">
              {error}
            </div>
          )}

          {ready && charts.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No charts in your active folio.
              </p>
              <Link href="/" className="text-navy-700 dark:text-navy-300 text-sm font-medium mt-2 inline-block">
                Add charts on the dashboard
              </Link>
            </div>
          )}

          {!scanning && items.length > 0 && visible.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                All corrections marked applied. 🎉
              </p>
            </div>
          )}

          {chartKeys.map((chart) => (
            <div key={chart} className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-2">
                <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {chart}
                </span>
                {names[chart] && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {names[chart]}
                  </span>
                )}
                <span className="ml-auto text-2xs text-slate-400 dark:text-slate-500">
                  {byChart[chart].filter((i) => !appliedSet.has(keyOf(i))).length} outstanding
                </span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {byChart[chart].map((item) => {
                  const k = keyOf(item);
                  const done = appliedSet.has(k);
                  return (
                    <li key={k}>
                      <label className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggle(item)}
                          className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500/30 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-mono ${done ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                            NM {item.nmNumber}
                          </p>
                          {item.subject && (
                            <p className={`text-2xs truncate ${done ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                              {item.subject}
                            </p>
                          )}
                        </div>
                        <span className="text-2xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                          Wk {String(item.weekNumber).padStart(2, "0")}/{String(item.weekYear).slice(-2)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {!scanning && ready && charts.length > 0 && items.length === 0 && !error && (
            <div className="card p-8 text-center">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                No corrections for your charts in the last {Math.min(scanCount, weeks.length)} weeks.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
