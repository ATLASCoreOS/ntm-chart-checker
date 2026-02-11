export default function CorrectionItem({ correction }) {
  // Parse the excerpt: first line is typically the NM title/subject,
  // remainder is the chart-specific correction detail
  const lines = (correction.excerpt || "").split("\n").filter(Boolean);
  let title = "";
  let detail = "";

  if (lines.length > 0) {
    // First line usually contains NM number + subject (e.g. "759    ENGLAND - East Coast - ...")
    title = lines[0].replace(/^\d+\*?\s+/, "").trim();
    detail = lines.slice(1).join("\n").trim();
  }

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      <div className="bg-red-50 px-4 py-2.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-red-800">
          NM {correction.nmNumber}
        </span>
        {correction.isPdfBlock && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium shrink-0">
            Block Correction
          </span>
        )}
      </div>
      {title && (
        <div className="px-4 py-2 border-t border-red-100">
          <p className="text-xs font-medium text-gray-700">{title}</p>
        </div>
      )}
      {detail && (
        <div className="px-4 py-3 border-t border-red-100 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
            {detail}
          </pre>
        </div>
      )}
      {!title && !detail && correction.excerpt && (
        <div className="px-4 py-3 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
            {correction.excerpt}
          </pre>
        </div>
      )}
    </div>
  );
}
