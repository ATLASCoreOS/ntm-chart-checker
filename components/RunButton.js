"use client";

export default function RunButton({ onRun, loading, disabled, cooldown, cooldownSeconds }) {
  let text = "Run Check Now";
  if (loading) text = "Checking UKHO bulletin...";
  else if (cooldown) text = `Check again in ${cooldownSeconds}s`;
  else if (disabled) text = "Add charts to check";

  return (
    <div className="card-admiralty p-5">
      <button
        onClick={onRun}
        disabled={disabled || loading || cooldown}
        className="w-full py-4 bg-brass text-navy-900 font-semibold text-base rounded-md hover:bg-brass-light hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(201,169,98,0.3)] disabled:bg-brass-muted disabled:text-navy-700 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        )}
        {text}
      </button>

      {loading && (
        <div className="mt-3">
          <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-brass rounded-full animate-progress" />
          </div>
          <p className="text-xs text-sea-slate mt-2">
            Fetching and parsing the latest weekly NtM bulletin from msi.admiralty.co.uk...
          </p>
        </div>
      )}
    </div>
  );
}
