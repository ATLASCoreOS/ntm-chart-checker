export default function TPItem({ tp }) {
  return (
    <div className="border border-amber-100 dark:border-amber-900 rounded-lg overflow-hidden">
      <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-2">
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-mono">
          {tp.nmNumber}
        </span>
      </div>
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 space-y-1">
        {tp.subject && (
          <p className="text-2xs text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">Subject</span>
            {tp.subject}
          </p>
        )}
        <p className="text-2xs text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">Charts</span>
          <span className="font-mono">{tp.charts}</span>
        </p>
      </div>
    </div>
  );
}
