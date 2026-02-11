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

// Parse formatted excerpt into structured sections for display.
// Header = subject + source (+ standalone prev update / datum when no Chart ref precedes them).
// Body starts at the first Chart reference or action keyword, whichever comes first.
// parseBodySections then handles all chart-level metadata uniformly.
function parseExcerpt(raw) {
  const formatted = formatExcerpt(raw);
  if (!formatted) return { subject: "", source: "", previousUpdate: "", datum: "", body: "" };

  const lines = formatted.split("\n");

  // Find where body begins: first Chart reference or action keyword, whichever comes first
  let bodyStart = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^Chart\s+\d/i.test(trimmed)) {
      bodyStart = i;
      break;
    }
    if (/^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(trimmed)) {
      bodyStart = i;
      break;
    }
  }

  const headerLines = lines.slice(0, bodyStart);
  const bodyLines = lines.slice(bodyStart);

  // Parse header: subject, source, and standalone prev update / datum
  // (only when they appear before any Chart ref — Chart refs trigger bodyStart above)
  let subject = "";
  let source = "";
  let previousUpdate = "";
  let datum = "";
  const extraLines = [];

  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!subject) {
      subject = trimmed.replace(/^\d+\*?\s+/, "").trim();
      continue;
    }

    if (/^Source:/i.test(trimmed)) {
      source = trimmed.replace(/^Source:\s*/i, "").trim();
      continue;
    }

    // Standalone previous update (before any Chart ref)
    if (/\[\s*previous update/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch) previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch) datum = datumMatch[0].trim();
      continue;
    }

    // Standalone datum
    if (/^(ETRS89|WGS84|ED50|OSGB36)/i.test(trimmed)) {
      datum = trimmed.trim();
      continue;
    }

    extraLines.push(line);
  }

  const allBody = [...extraLines, ...bodyLines].join("\n").trim();

  return { subject, source, previousUpdate, datum, body: allBody };
}

// Split the instruction body into chart sub-sections when multiple panels appear.
// Each sub-section gets its own chart ref, panel, previous update, datum, and instructions.
function parseBodySections(bodyText) {
  if (!bodyText) return [];

  const lines = bodyText.split("\n");
  const sections = [];
  let current = { chartRef: "", panel: "", previousUpdate: "", datum: "", lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    // New chart sub-section header
    if (/^Chart\s+\S+/i.test(trimmed)) {
      // Save previous section if it has content
      if (current.lines.length > 0 || current.chartRef) {
        sections.push({ ...current, text: current.lines.join("\n").trim() });
      }

      const refMatch = trimmed.match(/^Chart\s+(\S+)/i);
      const panelMatch = trimmed.match(/\(([^)]+)\)/);
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);

      current = {
        chartRef: refMatch ? refMatch[1] : "",
        panel: panelMatch ? panelMatch[1] : "",
        previousUpdate: prevMatch ? prevMatch[1].trim() : "",
        datum: datumMatch ? datumMatch[0].trim() : "",
        lines: [],
      };
      continue;
    }

    // Previous update on its own line (at start of sub-section before instructions)
    if (current.lines.length === 0 && /\[\s*previous update/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch && !current.previousUpdate) current.previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch && !current.datum) current.datum = datumMatch[0].trim();
      continue;
    }

    // Standalone datum at start of sub-section
    if (current.lines.length === 0 && /^(ETRS89|WGS84|ED50|OSGB36)/i.test(trimmed)) {
      if (!current.datum) current.datum = trimmed;
      continue;
    }

    current.lines.push(line);
  }

  // Push last section
  const lastText = current.lines.join("\n").trim();
  if (lastText || current.chartRef) {
    sections.push({ ...current, text: lastText });
  }

  return sections;
}

export default function CorrectionItem({ correction }) {
  const { subject, source, previousUpdate, datum, body } = parseExcerpt(correction.excerpt);
  const bodySections = parseBodySections(body);
  const hasSubSections = bodySections.length > 1 || (bodySections.length === 1 && bodySections[0].chartRef);

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      {/* NM number header */}
      <div className="bg-red-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-red-800">
            NM {correction.nmNumber}
          </span>
          {datum && !hasSubSections && (
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
          {(source || (previousUpdate && !hasSubSections)) && (
            <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-500">
              {source && (
                <span><span className="font-medium text-gray-400">Source:</span> {source}</span>
              )}
              {previousUpdate && !hasSubSections && (
                <span><span className="font-medium text-gray-400">Prev update:</span> {previousUpdate}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Simple body (no chart sub-sections) */}
      {body && !hasSubSections && (
        <div className="px-4 py-3 border-t border-red-100 bg-white">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
            {body}
          </pre>
        </div>
      )}

      {/* Chart sub-sections */}
      {hasSubSections && bodySections.map((section, i) => (
        <div key={i} className="border-t border-red-100">
          {section.chartRef && (
            <div className="px-4 py-1.5 bg-gray-50 flex flex-wrap items-baseline gap-x-3">
              <span className="text-xs font-semibold text-gray-700">
                Chart {section.chartRef}
              </span>
              {section.panel && (
                <span className="text-[11px] text-gray-500">{section.panel}</span>
              )}
              {(section.previousUpdate || section.datum) && (
                <span className="text-[10px] text-gray-400">
                  {section.previousUpdate && `Prev: ${section.previousUpdate}`}
                  {section.previousUpdate && section.datum && " · "}
                  {section.datum}
                </span>
              )}
            </div>
          )}
          {section.text && (
            <div className="px-4 py-2.5 bg-white">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
                {section.text}
              </pre>
            </div>
          )}
        </div>
      ))}

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
