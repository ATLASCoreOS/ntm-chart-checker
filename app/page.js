"use client";

import { useState, useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import ChartManager from "@/components/ChartManager";
import RunButton from "@/components/RunButton";
import ResultsSummary from "@/components/ResultsSummary";
import ChartResult from "@/components/ChartResult";
import SourceCard from "@/components/SourceCard";
import Footer from "@/components/Footer";

export default function Dashboard() {
  const [charts, setCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Load folio on mount
  useEffect(() => {
    async function loadFolio() {
      try {
        const res = await fetch("/api/folio");
        const data = await res.json();
        setCharts(data.charts || []);
      } catch {
        setError("Failed to load chart folio");
      } finally {
        setChartsLoading(false);
      }
    }
    loadFolio();
  }, []);

  // Save folio to server
  const saveFolio = useCallback(
    async (newCharts) => {
      const prev = charts;
      setCharts(newCharts);
      try {
        await fetch("/api/folio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ charts: newCharts }),
        });
      } catch {
        setCharts(prev);
        setError("Failed to save charts");
      }
    },
    [charts]
  );

  // Run check
  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", { method: "POST" });
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
    setCooldownSeconds(30);
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

      <div className="space-y-4">
        <ChartManager
          charts={charts}
          chartsLoading={chartsLoading}
          onChartsChange={saveFolio}
        />

        <RunButton
          onRun={runCheck}
          loading={loading}
          disabled={charts.length === 0}
          cooldown={cooldown}
          cooldownSeconds={cooldownSeconds}
        />

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm"
            role="alert"
          >
            Error: {error}
          </div>
        )}

        {result && (
          <>
            <ResultsSummary result={result} />

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Chart-by-Chart
              </h2>
              <div className="space-y-2">
                {result.charts.map((chart) => (
                  <ChartResult
                    key={chart}
                    chart={chart}
                    corrections={result.corrections[chart] || []}
                    tpNotices={result.tpNotices[chart] || []}
                    tpInForce={result.tpInForce?.[chart] || []}
                  />
                ))}
              </div>
            </div>

            <SourceCard sourceUrl={result.sourceUrl} />
          </>
        )}

        <Footer />
      </div>
    </>
  );
}
