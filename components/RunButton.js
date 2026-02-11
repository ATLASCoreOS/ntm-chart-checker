"use client";

export default function RunButton({ onRun, loading, disabled, cooldown, cooldownSeconds }) {
  let text = "Run Check";
  if (loading) text = "Checking UKHO bulletin...";
  else if (cooldown) text = `Check again in ${cooldownSeconds}s`;
  else if (disabled) text = "Add charts to check";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <button
        onClick={onRun}
        disabled={disabled || loading || cooldown}
        className="w-full py-3 bg-navy text-white font-medium text-sm rounded-md hover:bg-navy-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        )}
        {text}
      </button>

      {loading && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-navy rounded-full animate-progress" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Fetching and parsing the latest weekly NtM bulletin...
          </p>
        </div>
      )}
    </div>
  );
}
