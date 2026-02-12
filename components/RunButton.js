"use client";

import WeekSelector from "./WeekSelector";

export default function RunButton({
  onRun,
  loading,
  disabled,
  cooldown,
  cooldownSeconds,
  availableWeeks = [],
  selectedWeek,
  onWeekChange,
  weeksLoading,
}) {
  const weekLabel = selectedWeek
    ? `Wk ${String(selectedWeek.week).padStart(2, "0")}/${selectedWeek.year}`
    : null;

  let text = "Run Check";
  if (loading) text = weekLabel ? `Checking ${weekLabel}...` : "Checking UKHO bulletin...";
  else if (cooldown) text = `Check again in ${cooldownSeconds}s`;
  else if (disabled) text = "Add charts to check";
  else if (weekLabel) text = `Check ${weekLabel}`;

  const helperText = weekLabel
    ? `Fetching and parsing ${weekLabel} bulletin...`
    : "Fetching and parsing the latest weekly NtM bulletin...";

  return (
    <div className="card p-5">
      <WeekSelector
        availableWeeks={availableWeeks}
        selectedWeek={selectedWeek}
        onWeekChange={onWeekChange}
        disabled={loading || weeksLoading}
      />

      <button
        onClick={onRun}
        disabled={disabled || loading || cooldown}
        className="btn-primary w-full py-3"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {text}
      </button>

      {loading && (
        <div className="mt-4 animate-fade-in">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-navy-700 rounded-full animate-progress" />
          </div>
          <p className="text-2xs text-slate-400 mt-2">{helperText}</p>
        </div>
      )}
    </div>
  );
}
