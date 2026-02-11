export default function TPItem({ tp }) {
  return (
    <div className="border-l-3 border-signal-amber bg-signal-amber-bg rounded-r-lg p-3">
      <div className="text-xs font-bold text-parchment">{tp.nmNumber}</div>
      <p className="text-xs text-parchment-muted mt-1">
        Charts: {tp.charts}
        {tp.subject && <span> — {tp.subject}</span>}
      </p>
    </div>
  );
}
