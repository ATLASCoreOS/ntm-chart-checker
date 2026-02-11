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

  // Group checks by week
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

      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Check History
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm" role="alert">
            {error}
          </div>
        ) : checks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <p className="text-slate-500 text-sm">No checks yet.</p>
            <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Run your first check from the dashboard
            </Link>
          </div>
        ) : (
          weeks.map((week) => (
            <div key={`${week.weekYear}-${week.weekNumber}`}>
              <h3 className="text-base font-semibold text-navy mb-2">
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
