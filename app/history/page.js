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

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">
            Check History
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2.5" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm" role="alert">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          ) : checks.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500 text-sm">No checks yet.</p>
              <Link href="/" className="text-navy-700 text-sm font-medium hover:text-navy-900 mt-2 inline-block transition-colors">
                Run your first check from the dashboard
              </Link>
            </div>
          ) : (
            weeks.map((week) => (
              <div key={`${week.weekYear}-${week.weekNumber}`}>
                <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
                  Week {String(week.weekNumber).padStart(2, "0")}/{week.weekYear}
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
        </div>
      </main>

      <Footer />
    </>
  );
}
