"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import CheckHistoryCard from "@/components/CheckHistoryCard";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function HistoryPage() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedResults, setExpandedResults] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/checks");
        const data = await res.json();
        setChecks(data.checks || []);
      } catch {
        setError("Failed to load check history");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  async function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (!expandedResults[id]) {
      setLoadingDetail(id);
      try {
        const res = await fetch(`/api/checks/${id}`);
        const data = await res.json();
        setExpandedResults((prev) => ({ ...prev, [id]: data.results }));
      } catch {
        setError("Failed to load check details");
      } finally {
        setLoadingDetail(null);
      }
    }
  }

  const grouped = {};
  for (const check of checks) {
    const key = `${check.weekYear}-${check.weekNumber}`;
    if (!grouped[key]) {
      grouped[key] = {
        weekYear: check.weekYear,
        weekNumber: check.weekNumber,
        checks: [],
      };
    }
    grouped[key].checks.push(check);
  }
  const weeks = Object.values(grouped);

  return (
    <>
      <NavBar activePage="history" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-brass">
          Check History
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-maritime p-5 animate-pulse">
                <div className="h-4 bg-navy-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-navy-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-signal-red-bg border border-signal-red/30 text-signal-red rounded-lg p-4 text-sm" role="alert">
            {error}
          </div>
        ) : checks.length === 0 ? (
          <div className="card-maritime p-8 text-center">
            <p className="text-sea-slate text-sm">No checks yet.</p>
            <Link href="/" className="text-brass text-sm hover:text-brass-light mt-2 inline-block transition-colors">
              Run your first check from the dashboard
            </Link>
          </div>
        ) : (
          weeks.map((week) => (
            <div key={`${week.weekYear}-${week.weekNumber}`}>
              <h3 className="font-heading text-base font-semibold text-parchment mb-2">
                Week {week.weekNumber}/{week.weekYear}
              </h3>
              <div className="space-y-2">
                {week.checks.map((check) => (
                  <CheckHistoryCard
                    key={check.id}
                    check={check}
                    expanded={expandedId === check.id}
                    expandedResult={expandedResults[check.id] || null}
                    loadingDetail={loadingDetail === check.id}
                    onExpand={handleExpand}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <Footer />
      </div>
    </>
  );
}
