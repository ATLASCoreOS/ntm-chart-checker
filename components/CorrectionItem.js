export default function CorrectionItem({ correction }) {
  return (
    <div className="border-l-[3px] border-red-400 bg-red-50 rounded-r-lg p-3">
      <div className="text-xs font-semibold text-gray-800 mb-1">
        NM {correction.nmNumber}
        {correction.isPdfBlock && (
          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">
            Block PDF
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
        {correction.excerpt}
      </p>
    </div>
  );
}
