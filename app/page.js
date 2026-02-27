"use client";

import { useState, useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import VesselSelector from "@/components/VesselSelector";
import ChartManager from "@/components/ChartManager";
import RunButton from "@/components/RunButton";
import ResultsSummary from "@/components/ResultsSummary";
import ChartResult from "@/components/ChartResult";
import SourceCard from "@/components/SourceCard";
import Footer from "@/components/Footer";

const COOLDOWN_SECONDS = 30;

export default function Dashboard() {
  const [folios, setFolios] = useState([]);
  const [activeFolioId, setActiveFolioId] = useState(null);
  const [foliosLoading, setFoliosLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const activeFolio = folios.find((f) => f.id === activeFolioId);
  const charts = activeFolio?.charts || [];

  useEffect(() => {
    async function loadFolios() {
      try {
        const res = await fetch("/api/folio");
        const data = await res.json();
        setFolios(data.folios || []);
        setActiveFolioId(data.activeFolioId || null);
      } catch {
        setError("Failed to load vessel folios");
      } finally {
        setFoliosLoading(false);
      }
    }
    async function loadWeeks() {
      try {
        const res = await fetch("/api/weeks");
        const data = await res.json();
        setAvailableWeeks(data.weeks || []);
      } catch {
        // Silently fail — user can still check current week
      } finally {
        setWeeksLoading(false);
      }
    }
    loadFolios();
    loadWeeks();
  }, []);

  const switchFolio = useCallback(
    async (folioId) => {
      setActiveFolioId(folioId);
      setResult(null);
      try {
        await fetch("/api/folio/active", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folioId }),
        });
      } catch {
        setError("Failed to switch vessel");
      }
    },
    []
  );

  const saveFolio = useCallback(
    async (newCharts) => {
      if (!activeFolioId) return;
      const prev = folios;
      setFolios((f) =>
        f.map((fo) =>
          fo.id === activeFolioId ? { ...fo, charts: newCharts } : fo
        )
      );
      try {
        await fetch("/api/folio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folioId: activeFolioId, charts: newCharts }),
        });
      } catch {
        setFolios(prev);
        setError("Failed to save charts");
      }
    },
    [activeFolioId, folios]
  );

  const addFolio = useCallback(
    async (vesselName) => {
      try {
        const res = await fetch("/api/folio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vesselName, charts: [] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFolios((prev) => [...prev, data]);
        setActiveFolioId(data.id);
        setResult(null);
      } catch (err) {
        setError(err.message || "Failed to add vessel");
      }
    },
    []
  );

  const renameFolio = useCallback(
    async (folioId, vesselName) => {
      setFolios((prev) =>
        prev.map((f) => (f.id === folioId ? { ...f, vesselName } : f))
      );
      try {
        await fetch("/api/folio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folioId, vesselName }),
        });
      } catch {
        setError("Failed to rename vessel");
      }
    },
    []
  );

  const deleteFolio = useCallback(
    async (folioId) => {
      try {
        const res = await fetch("/api/folio", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folioId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFolios((prev) => prev.filter((f) => f.id !== folioId));
        if (activeFolioId === folioId) {
          setActiveFolioId(data.activeFolioId);
          setResult(null);
        }
      } catch (err) {
        setError(err.message || "Failed to delete vessel");
      }
    },
    [activeFolioId]
  );

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const fetchOptions = { method: "POST" };
      if (selectedWeek) {
        fetchOptions.headers = { "Content-Type": "application/json" };
        fetchOptions.body = JSON.stringify({
          year: selectedWeek.year,
          week: selectedWeek.week,
        });
      }
      const res = await fetch("/api/check", fetchOptions);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Check failed");
      setResult(data);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setCooldown(true);
    setCooldownSeconds(COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <>
      <NavBar activePage="dashboard" />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <VesselSelector
            folios={folios}
            activeFolioId={activeFolioId}
            loading={foliosLoading}
            onSwitch={switchFolio}
            onAdd={addFolio}
            onRename={renameFolio}
            onDelete={deleteFolio}
          />

          <ChartManager
            charts={charts}
            chartsLoading={foliosLoading}
            onChartsChange={saveFolio}
          />

          <RunButton
            onRun={runCheck}
            loading={loading}
            disabled={charts.length === 0}
            cooldown={cooldown}
            cooldownSeconds={cooldownSeconds}
            availableWeeks={availableWeeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            weeksLoading={weeksLoading}
          />

          {error && (
            <div
              className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in"
              role="alert"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              <ResultsSummary result={result} />

              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Chart-by-Chart Results
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {result.charts.map((chart) => (
                    <ChartResult
                      key={chart}
                      chart={chart}
                      corrections={result.corrections[chart] || []}
                      tpNotices={result.tpNotices[chart] || []}
                      tpInForce={result.tpInForce?.[chart] || []}
                      sectionIIUrl={result.sectionIIUrl}
                    />
                  ))}
                </div>
              </div>

              <SourceCard sourceUrl={result.sourceUrl} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
