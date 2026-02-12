"use client";

// Clean up raw PDF-extracted NtM correction text for readable display.
function formatExcerpt(raw) {
  if (!raw) return "";
  let text = raw;

  // Remove page markers like "Wk08/26\nII\n2\n.40" or "Wk08/26 II 2.9"
  text = text.replace(/Wk\d{2}\/\d{2}\s*\n?\s*II\s*\n?[\d\s.]*\n?/g, "");

  // Remove continuation headers from merged notice blocks
  text = text.replace(/\n\d{3,5}[^\n]*\(continued\)[^\n]*/gi, "\n");

  // Join sub-item references with the following line: "(a)\nabove" → "(a) above"
  text = text.replace(/(\([a-z]\))\s*\n\s*/g, "$1 ");

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

  // Separate depth measurements concatenated with coordinates from PDF table extraction:
  // "8·8m52° 29'·88N." → "8·8m   52° 29'·88N." and "8m52°" → "8m   52°"
  text = text.replace(/(\d+[·.]?\d*m)(\d{1,3}°)/g, "$1   $2");

  // Separate concatenated table column headers: "DepthPosition" → "Depth   Position"
  // Require 3+ lowercase chars per part to avoid splitting names like "McGregor"
  text = text.replace(/\b([A-Z][a-z]{3,})([A-Z][a-z]{3,})\b/g, "$1   $2");

  // Remove stray page number fragments (lines that are just a decimal like ".99" or "2.99")
  text = text.replace(/\n\s*\.?\d{1,2}\.\d{1,2}\s*$/g, "");
  text = text.replace(/\n\s*\.\d{1,2}\s*$/g, "");

  // Collapse multiple spaces, split into lines
  text = text.replace(/[ \t]{2,}/g, " ");
  let lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Visual formatting: structured indentation for instructions and sub-items
  const result = [];
  let inInstruction = false;
  let afterSubItem = false;

  for (const line of lines) {
    const isInstruction = /^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(line);
    const isChartRef = /^Chart\s+\d/.test(line);
    const isSubItem = /^\([a-z]\)/.test(line);

    // Blank line before instructions and chart refs
    if ((isInstruction || isChartRef) && result.length > 0) {
      result.push("");
    }

    if (isInstruction) {
      result.push(line);
      inInstruction = true;
      afterSubItem = false;
    } else if (isChartRef) {
      result.push(line);
      inInstruction = false;
      afterSubItem = false;
    } else if (isSubItem) {
      // Blank line between consecutive sub-items for visual separation
      if (afterSubItem && result.length > 0) {
        result.push("");
      }
      result.push("    " + line);
      afterSubItem = true;
    } else if (afterSubItem) {
      // Detail line within a sub-item (e.g. "depth, 9.8")
      result.push("        " + line);
    } else if (inInstruction) {
      // Direct content under an instruction (no sub-items)
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

import PDFBlockViewer from "./PDFBlockViewer";
import CorrectionPDFView from "./CorrectionPDFView";
import { useState, useCallback } from "react";

export default function CorrectionItem({ correction, chartNumber, sectionIIUrl }) {
  const { subject, source, previousUpdate, datum, body } = parseExcerpt(correction.excerpt);
  const bodySections = parseBodySections(body);
  const hasSubSections = bodySections.length > 1 || (bodySections.length === 1 && bodySections[0].chartRef);

  const hasPdfPage = sectionIIUrl && correction.pdfPage;
  const [showText, setShowText] = useState(!hasPdfPage);
  const handlePdfError = useCallback(() => setShowText(true), []);

  return (
    <div className="border border-red-100 rounded-lg overflow-hidden bg-white">
      {/* NM number header */}
      <div className="bg-red-50/60 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-red-800 font-mono">
            NM {correction.nmNumber}
          </span>
          {correction.isPdfBlock && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-2xs font-medium shrink-0">
              Block
            </span>
          )}
        </div>
        {hasPdfPage && (
          <button
            onClick={() => setShowText(!showText)}
            className="btn-secondary text-2xs py-0.5 px-2"
          >
            {showText ? "NtM page" : "Text view"}
          </button>
        )}
      </div>

      {/* PDF page view */}
      {hasPdfPage && !showText && (
        <CorrectionPDFView
          sectionIIUrl={sectionIIUrl}
          pageNumber={correction.pdfPage}
          chartNumber={chartNumber}
          nmNumber={correction.nmNumber}
          onError={handlePdfError}
        />
      )}

      {/* Text view */}
      {showText && (
        <>
          {(subject || source || previousUpdate) && (
            <div className="px-4 py-2.5 border-t border-red-50 space-y-0.5">
              {subject && (
                <p className="text-xs font-semibold text-slate-800">{subject}</p>
              )}
              {(source || (previousUpdate && !hasSubSections)) && (
                <div className="flex flex-wrap gap-x-4 text-2xs text-slate-500">
                  {source && (
                    <span><span className="font-medium text-slate-400">Source</span> {source}</span>
                  )}
                  {previousUpdate && !hasSubSections && (
                    <span><span className="font-medium text-slate-400">Prev update</span> {previousUpdate}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {body && !hasSubSections && (
            <div className="px-4 py-3 border-t border-red-50">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
                {body}
              </pre>
            </div>
          )}

          {hasSubSections && bodySections.map((section, i) => (
            <div key={i} className="border-t border-red-50">
              {section.chartRef && (
                <div className="px-4 py-1.5 bg-slate-50 flex flex-wrap items-baseline gap-x-3">
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    Chart {section.chartRef}
                  </span>
                  {section.panel && (
                    <span className="text-2xs text-slate-500">{section.panel}</span>
                  )}
                  {(section.previousUpdate || section.datum) && (
                    <span className="text-2xs text-slate-400">
                      {section.previousUpdate && `Prev: ${section.previousUpdate}`}
                      {section.previousUpdate && section.datum && " · "}
                      {section.datum}
                    </span>
                  )}
                </div>
              )}
              {section.text && (
                <div className="px-4 py-2.5">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
                    {section.text}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {!subject && !body && correction.excerpt && (
            <div className="px-4 py-3">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words font-[inherit] leading-relaxed m-0">
                {correction.excerpt}
              </pre>
            </div>
          )}
        </>
      )}

      {correction.blockUrl && (
        <PDFBlockViewer
          blockUrl={correction.blockUrl}
          blockFilename={correction.blockFilename}
        />
      )}
    </div>
  );
}
