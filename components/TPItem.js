export default function TPItem({ tp }) {
  return (
    <div className="border-l-[3px] border-orange-400 bg-orange-50 rounded-r-lg p-3">
      <div className="text-xs font-semibold text-gray-800">{tp.nmNumber}</div>
      <p className="text-xs text-gray-600 mt-1">
        Charts: {tp.charts}
        {tp.subject && <span> — {tp.subject}</span>}
      </p>
    </div>
  );
}
