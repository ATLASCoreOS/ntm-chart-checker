"use client";

export default function ResultsSummary({ result }) {
  const { weekInfo, totalCorrections, totalTP, charts, pdfCount, durationMs, checkedAt, weeklyNtmFile, allBlockChartNums, matchingBlocks } = result;

  const date = new Date(checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Results
      </h2>

      <span className="inline-block px-3 py-1 bg-slate-200 rounded-full text-sm font-bold text-slate-700 mb-2">
        Week {weekInfo.week}/{weekInfo.year} — {weeklyNtmFile || "unknown"}
      </span>

      <p className="text-xs text-slate-400 mb-4">
        Checked: {date} &bull; {pdfCount} PDFs &bull; {(durationMs / 1000).toFixed(1)}s
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatBox
          value={totalCorrections}
          label="New Correct."
          color={totalCorrections === 0 ? "green" : "amber"}
        />
        <StatBox
          value={totalTP}
          label="T&P In Force"
          color={totalTP === 0 ? "green" : "amber"}
        />
        <StatBox value={charts.length} label="Charts Checked" color="blue" />
      </div>

      {matchingBlocks && matchingBlocks.length > 0 ? (
        <p className="text-xs text-red-600 font-bold">
          Chart block PDFs match your folio: {matchingBlocks.join(", ")}
        </p>
      ) : allBlockChartNums && allBlockChartNums.length > 0 ? (
        <p className="text-xs text-slate-400">
          No chart block correction PDFs match your folio. Blocks issued for:{" "}
          {allBlockChartNums.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function StatBox({ value, label, color }) {
  const bg = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  }[color];

  return (
    <div className={`rounded-xl p-4 text-center ${bg}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase font-semibold mt-1">{label}</div>
    </div>
  );
}
