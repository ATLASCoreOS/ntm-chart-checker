"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Link from "next/link";

const keyOf = (i) => `${i.weekYear}-${i.weekNumber}-${i.chart}-${i.nmNumber}`;
const CAP_OPTIONS = [12, 26, 52, 104];

// Group collected corrections by chart and apply each chart's edition boundary:
// walking newest->oldest, keep corrections down to (and including) the one whose
// "previous update" is a New Edition; everything older belongs to a prior edition.
function computeGroups(items, charts) {
  const byChart = {};
  for (const c of charts) byChart[c] = [];
  for (const it of items) if (byChart[it.chart]) byChart[it.chart].push(it);

  const groups = {};
  for (const c of charts) {
    const list = byChart[c]
      .slice()
      .sort((a, b) => b.weekYear - a.weekYear || b.weekNumber - a.weekNumber);
    const kept = [];
    let editionDate = null;
    let boundaryReached = false;
    for (const it of list) {
      kept.push(it);
      if (it.editionDate) {
        editionDate = it.editionDate;
        boundaryReached = true;
        break;
      }
    }
    groups[c] = { kept, editionDate, boundaryReached, hadAny: list.length > 0 };
  }
  return groups;
}

export default function CorrectionsLogPage() {
  const [charts, setCharts] = useState([]);
  const [vesselName, setVesselName] = useState(null);
  const [names, setNames] = useState({});
  const [items, setItems] = useState([]);
  const [appliedSet, setAppliedSet] = useState(new Set());
  const [weeks, setWeeks] = useState([]);
  const [cap, setCap] = useState(26);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [folioRes, appliedRes, weeksRes] = await Promise.all([
          fetch("/api/folio").then((r) => r.json()),
          fetch("/api/applied").then((r) => r.json()),
          fetch("/api/weeks").then((r) => r.json()),
        ]);
        const active = (folioRes.folios || []).find((f) => f.id === folioRes.activeFolioId);
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
    const target = weeks.slice(0, cap);
    setProgress({ done: 0, total: target.length });

    const collected = [];
    const BATCH = 3;
    for (let i = 0; i < target.length; i += BATCH) {
      if (runId.current !== myRun) return;
      const chunk = target.slice(i, i + BATCH);
      const res = await Promise.all(
        chunk.map((w) =>
          fetch(`/api/corrections-log/week?year=${w.year}&week=${w.week}`)
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .catch(() => ({ items: [] }))
        )
      );
      if (runId.current !== myRun) return;
      for (const wk of res) {
        for (const it of wk.items || []) {
          collected.push({ ...it, weekYear: wk.weekYear, weekNumber: wk.weekNumber });
        }
      }
      setProgress({ done: Math.min(i + BATCH, target.length), total: target.length });
      setItems([...collected]);

      // Stop early once every chart has reached its edition boundary
      const groups = computeGroups(collected, charts);
      if (charts.every((c) => groups[c].boundaryReached)) {
        break;
      }
    }
    setScanning(false);
  }, [charts, weeks, cap]);

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
      setAppliedSet((prev) => {
        const n = new Set(prev);
        applied ? n.delete(k) : n.add(k);
        return n;
      });
    }
  }

  const groups = computeGroups(items, charts);
  const sortedCharts = charts.slice().sort((a, b) => a - b);
  const outstandingTotal = Object.values(groups).reduce(
    (sum, g) => sum + g.kept.filter((i) => !appliedSet.has(keyOf(i))).length,
    0
  );
  const scannedWeeks = Math.min(cap, weeks.length);

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
              Back to each chart&apos;s edition · {outstandingTotal} outstanding
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
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-h-[44px]">
              Max lookback
              <select
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                disabled={scanning}
                className="input-field py-1.5 w-auto"
              >
                {CAP_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} weeks</option>
                ))}
              </select>
            </label>
            <button onClick={scan} disabled={scanning} className="btn-secondary text-sm min-h-[44px]">
              {scanning ? "Scanning…" : "Rescan"}
            </button>
          </div>

          {scanning && (
            <div className="card p-4">
              <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Scanning back to chart editions…</span>
                <span className="tabular-nums">{progress.done}/{progress.total} weeks</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-700 dark:bg-navy-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
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
              <p className="text-slate-500 dark:text-slate-400 text-sm">No charts in your active folio.</p>
              <Link href="/" className="text-navy-700 dark:text-navy-300 text-sm font-medium mt-2 inline-block">
                Add charts on the dashboard
              </Link>
            </div>
          )}

          {sortedCharts.map((chart) => {
            const g = groups[chart];
            const visible = outstandingOnly
              ? g.kept.filter((i) => !appliedSet.has(keyOf(i)))
              : g.kept;
            if (outstandingOnly && visible.length === 0) return null;
            const outstanding = g.kept.filter((i) => !appliedSet.has(keyOf(i))).length;

            return (
              <div key={chart} className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">{chart}</span>
                    {names[chart] && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{names[chart]}</span>
                    )}
                    <span className="ml-auto text-2xs text-slate-400 dark:text-slate-500">
                      {outstanding} outstanding
                    </span>
                  </div>
                  <p className="text-2xs mt-1">
                    {g.boundaryReached ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Edition {g.editionDate !== "unknown" ? g.editionDate : "(date n/a)"} · {g.kept.length} correction{g.kept.length !== 1 ? "s" : ""} since
                      </span>
                    ) : g.hadAny ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        Edition not reached in last {scannedWeeks} weeks — list may be incomplete, increase lookback
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">
                        No corrections found in last {scannedWeeks} weeks{scanning ? " (scanning…)" : ""}
                      </span>
                    )}
                  </p>
                </div>
                {visible.length > 0 && (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visible.map((item) => {
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
                                {item.editionDate && (
                                  <span className="ml-2 text-2xs font-sans text-emerald-600 dark:text-emerald-400">edition</span>
                                )}
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
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
