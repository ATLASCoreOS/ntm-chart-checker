// Clean up raw PDF-extracted NtM correction text for readable display.
function formatExcerpt(raw) {
  if (!raw) return "";
  let text = raw;

  // Remove page markers like "Wk08/26\nII\n2\n.40" or "Wk08/26 II 2.9"
  text = text.replace(/Wk\d{2}\/\d{2}\s*\n?\s*II\s*\n?[\d\s.]*\n?/g, "");

  // Join Admiralty depth subscripts: "9\n8" (meaning 9.8m) → "9.8"
  text = text.replace(/(\d)\n(\d)(?=[^0-9]|$)/gm, "$1.$2");

  // Handle concatenated depth subscripts from PDF extraction:
  // "depth, 98" → "depth, 9.8" and "depth 98" → "depth 9.8"
  text = text.replace(/(depth,?\s+)(\d)(\d)(?=[\s,.)(\n]|$)/gi, "$1$2.$3");

  // Space between depth and parenthetical ref: "7.9(a)" → "7.9 (a)"
  text = text.replace(/(\d\.\d)(\()/g, "$1 $2");

  // Join comma continuations: lines starting with comma, and lines after a trailing comma
  text = text.replace(/\n\s*,\s*/g, ", ");
  text = text.replace(/,[ \t]*\n\s*/g, ", ");

  // Join coordinate lines (leading whitespace + degrees) to previous line
  text = text.replace(/\n\s+(\d{1,3}°)/g, " $1");

  // Collapse multiple spaces, split into lines
  text = text.replace(/[ \t]{2,}/g, " ");
  let lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Visual formatting: blank lines before instructions and chart refs, indent sub-items
  const result = [];
  for (const line of lines) {
    if (/^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(line) && result.length > 0) {
      result.push("");
    }
    if (/^Chart\s+\d/.test(line) && result.length > 0) {
      result.push("");
    }
    if (/^\([a-z]\)/.test(line)) {
      result.push("    " + line);
    } else {
      result.push(line);
    }
  }

  return result.join("\n").trim();
}

// Parse formatted excerpt into structured sections for display
function parseExcerpt(raw) {
  const formatted = formatExcerpt(raw);
  if (!formatted) return { subject: "", source: "", previousUpdate: "", datum: "", body: "" };

  const lines = formatted.split("\n");
  let subject = "";
  let source = "";
  let previousUpdate = "";
  let datum = "";
  const bodyLines = [];
  let headerDone = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && !headerDone) continue;

    // First non-empty line: subject (strip NM number prefix if present)
    if (!subject && !headerDone && trimmed) {
      subject = trimmed.replace(/^\d+\*?\s+/, "").trim();
      continue;
    }

    // Source line
    if (!headerDone && /^Source:/i.test(trimmed)) {
      source = trimmed.replace(/^Source:\s*/i, "").trim();
      continue;
    }

    // Chart reference line — extract metadata then mark header done
    if (!headerDone && /^Chart\s+\d/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch) previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch) datum = datumMatch[0].trim();
      headerDone = true;
      continue;
    }

    // If we hit an action keyword without finding chart ref, mark header done
    if (!headerDone && /^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(trimmed)) {
      headerDone = true;
    }

    if (headerDone) {
      bodyLines.push(line);
    }
  }

  return {
    subject,
    source,
    previousUpdate,
    datum,
    body: bodyLines.join("\n").trim(),
  };
}

export default function CorrectionItem({ correction }) {
  const { subject, source, previousUpdate, datum, body } = parseExcerpt(correction.excerpt);

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      {/* NM number header */}
      <div className="bg-red-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-red-800">
            NM {correction.nmNumber}
          </span>
          {datum && (
            <span className="text-[10px] font-medium text-gray-500 bg-white/70 px-1.5 py-0.5 rounded border border-red-100">
              {datum}
            </span>
          )}
        </div>
        {correction.isPdfBlock && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium shrink-0">
            Block Correction
          </span>
        )}
      </div>

      {/* Subject & metadata */}
      {(subject || source || previousUpdate) && (
        <div className="px-4 py-2 border-t border-red-100 space-y-0.5">
          {subject && (
            <p className="text-xs font-semibold text-gray-800">{subject}</p>
          )}
          {(source || previousUpdate) && (
            <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-500">
              {source && (
                <span><span className="font-medium text-gray-400">Source:</span> {source}</span>
              )}
              {previousUpdate && (
                <span><span className="font-medium text-gray-400">Prev update:</span> {previousUpdate}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instruction body */}
      {body && (
        <div className="px-4 py-3 border-t border-red-100 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
            {body}
          </pre>
        </div>
      )}

      {/* Fallback for unparseable content */}
      {!subject && !body && correction.excerpt && (
        <div className="px-4 py-3 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
            {correction.excerpt}
          </pre>
        </div>
      )}
    </div>
  );
}
