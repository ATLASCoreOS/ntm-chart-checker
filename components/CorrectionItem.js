export default function CorrectionItem({ correction }) {
  return (
    <div className="border-l-3 border-signal-red bg-signal-red-bg rounded-r-lg p-3">
      <div className="text-xs font-bold text-parchment mb-1">
        NM {correction.nmNumber}
        {correction.isPdfBlock && (
          <span className="ml-2 px-1.5 py-0.5 bg-signal-red/20 text-signal-red rounded text-[10px]">
            Block PDF
          </span>
        )}
      </div>
      <p className="text-xs text-parchment-muted whitespace-pre-wrap break-words">
        {correction.excerpt}
      </p>
    </div>
  );
}
