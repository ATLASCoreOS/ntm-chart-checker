// Clean up raw PDF-extracted NtM correction text for readable display.
function formatExcerpt(raw) {
  if (!raw) return "";
  let text = raw;

  // Join Admiralty depth subscripts: "9\n8" (meaning 9.8m) → "9.8"
  text = text.replace(/(\d)\n(\d)(?=[^0-9]|$)/gm, "$1.$2");

  // Space between depth and parenthetical ref: "7.9(a)" → "7.9 (a)"
  text = text.replace(/(\d\.\d)(\()/g, "$1 $2");

  // Join comma-starting lines to previous line
  text = text.replace(/\n\s*,\s*/g, ", ");

  // Join coordinate lines (leading whitespace + degrees) to previous line
  text = text.replace(/\n\s+(\d{1,3}°)/g, " $1");

  // Collapse multiple spaces, trim lines
  text = text.replace(/[ \t]{2,}/g, " ");
  let lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Truncate at the next NM entry (line like "764*  ENGLAND - ...")
  const nextNmIdx = lines.findIndex((l, i) => i > 0 && /^\d+\*?\s{2,}[A-Z]/.test(l));
  if (nextNmIdx > 0) lines = lines.slice(0, nextNmIdx);

  // Add blank line before instruction keywords and chart refs for readability
  const result = [];
  for (const line of lines) {
    if (/^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(line) && result.length > 0) {
      result.push("");
    }
    if (/^Chart\s+\d/.test(line) && result.length > 0) {
      result.push("");
    }
    // Indent sub-items: (a), (b), etc.
    if (/^\([a-z]\)/.test(line)) {
      result.push("    " + line);
    } else {
      result.push(line);
    }
  }

  return result.join("\n").trim();
}

export default function CorrectionItem({ correction }) {
  const formatted = formatExcerpt(correction.excerpt);
  const lines = formatted.split("\n").filter(Boolean);
  let title = "";
  let detail = "";

  if (lines.length > 0) {
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
