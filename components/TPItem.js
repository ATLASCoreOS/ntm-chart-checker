export default function TPItem({ tp }) {
  return (
    <div className="border-l-[3px] border-amber-500 bg-amber-50 rounded-r-lg p-3">
      <div className="text-xs font-bold text-slate-600">{tp.nmNumber}</div>
      <p className="text-xs text-slate-500 mt-1">
        Charts: {tp.charts}
        {tp.subject && <span> — {tp.subject}</span>}
      </p>
    </div>
  );
}
