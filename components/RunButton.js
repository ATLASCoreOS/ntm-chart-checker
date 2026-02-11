"use client";

export default function RunButton({ onRun, loading, disabled, cooldown, cooldownSeconds }) {
  let text = "Run Check Now";
  if (loading) text = "Checking UKHO bulletin...";
  else if (cooldown) text = `Check again in ${cooldownSeconds}s`;
  else if (disabled) text = "Add charts to check";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <button
        onClick={onRun}
        disabled={disabled || loading || cooldown}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-base rounded-xl hover:from-blue-700 hover:to-blue-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        )}
        {text}
      </button>

      {loading && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-blue-500 rounded-full animate-progress" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Fetching and parsing the latest weekly NtM bulletin from msi.admiralty.co.uk...
          </p>
        </div>
      )}
    </div>
  );
}
