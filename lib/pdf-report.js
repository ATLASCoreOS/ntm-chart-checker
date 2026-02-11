import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const NAVY = "#1a2b4a";
const RED = "#dc2626";
const ORANGE = "#ea580c";
const GREEN = "#16a34a";
const BLUE = "#2563eb";
const WHITE = "#FFFFFF";
const BLACK = "#111827";
const GRAY_400 = "#9ca3af";
const GRAY_500 = "#6b7280";
const GRAY_600 = "#4b5563";
const GRAY_200 = "#e5e7eb";
const GRAY_100 = "#f3f4f6";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BLACK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: WHITE,
  },
  headerBar: {
    backgroundColor: NAVY,
    padding: 16,
    marginBottom: 2,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: WHITE,
    letterSpacing: 0.5,
  },
  accentLine: {
    height: 2,
    backgroundColor: NAVY,
    marginHorizontal: -40,
    opacity: 0.3,
  },
  headerMeta: {
    backgroundColor: GRAY_100,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginHorizontal: -40,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerMetaText: {
    fontSize: 9,
    color: GRAY_500,
  },
  headerMetaBold: {
    fontSize: 9,
    color: BLACK,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: BLACK,
    marginBottom: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    marginRight: 6,
  },
  statBoxLast: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    marginRight: 0,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  statLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 3,
    color: GRAY_500,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY_200,
    marginVertical: 10,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
  },
  chartBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  clearBadge: {
    backgroundColor: "#f0fdf4",
    color: GREEN,
  },
  correctionBadge: {
    backgroundColor: "#fef2f2",
    color: RED,
  },
  tpBadge: {
    backgroundColor: "#fff7ed",
    color: ORANGE,
  },
  clearText: {
    fontSize: 9,
    color: GREEN,
    marginBottom: 4,
  },
  correctionItem: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
    backgroundColor: "#fef2f2",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  correctionNm: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: RED,
    marginBottom: 3,
  },
  correctionExcerpt: {
    fontSize: 8,
    color: GRAY_600,
    lineHeight: 1.4,
  },
  tpItem: {
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    backgroundColor: "#fff7ed",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  tpInForceItem: {
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    backgroundColor: "#eff6ff",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  tpNm: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
    marginBottom: 2,
  },
  tpDetail: {
    fontSize: 8,
    color: GRAY_600,
    lineHeight: 1.3,
  },
  subSectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
  },
  footerLine: {
    height: 1,
    backgroundColor: GRAY_200,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: GRAY_400,
  },
  footerPage: {
    fontSize: 7,
    color: GRAY_400,
  },
});

function getStatColor(color) {
  const map = {
    green: { bg: "#f0fdf4", border: "#bbf7d0", text: GREEN },
    red: { bg: "#fef2f2", border: "#fecaca", text: RED },
    orange: { bg: "#fff7ed", border: "#fed7aa", text: ORANGE },
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: BLUE },
    neutral: { bg: GRAY_100, border: GRAY_200, text: BLACK },
  };
  return map[color] || map.neutral;
}

function StatBoxPDF({ value, label, color, last }) {
  const c = getStatColor(color);
  return (
    <View style={[last ? s.statBoxLast : s.statBox, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.statValue, { color: c.text }]}>{String(value)}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function formatExcerpt(raw) {
  if (!raw) return "";
  let text = raw;
  // Remove page markers like "Wk08/26\nII\n2\n.40"
  text = text.replace(/Wk\d{2}\/\d{2}\s*\n?\s*II\s*\n?[\d\s.]*\n?/g, "");

  text = text.replace(/(\d)\n(\d)(?=[^0-9]|$)/gm, "$1.$2");

  // Handle concatenated depth subscripts: "depth, 98" → "depth, 9.8"
  text = text.replace(/(depth,?\s+)(\d)(\d)(?=[\s,.)(\n]|$)/gi, "$1$2.$3");

  text = text.replace(/(\d\.\d)(\()/g, "$1 $2");
  text = text.replace(/\n\s*,\s*/g, ", ");
  text = text.replace(/,[ \t]*\n\s*/g, ", ");
  text = text.replace(/\n\s+(\d{1,3}°)/g, " $1");
  text = text.replace(/[ \t]{2,}/g, " ");
  let lines = text.split("\n").map(l => l.trim()).filter(Boolean);
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

function parseExcerpt(raw) {
  const formatted = formatExcerpt(raw);
  if (!formatted) return { subject: "", source: "", previousUpdate: "", datum: "", body: "" };

  const lines = formatted.split("\n");

  let bodyStart = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/^(Insert|Delete|Move|Amend|Add|Remove|Substitute|Replace)\s/i.test(lines[i].trim())) {
      bodyStart = i;
      break;
    }
  }

  const headerLines = lines.slice(0, bodyStart);
  const bodyLines = lines.slice(bodyStart);

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

    if (/^Chart\s+\d/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch) previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch) datum = datumMatch[0].trim();
      continue;
    }

    if (/\[\s*previous update/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch) previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch) datum = datumMatch[0].trim();
      continue;
    }

    if (/^(ETRS89|WGS84|ED50|OSGB36)/i.test(trimmed)) {
      datum = trimmed.trim();
      continue;
    }

    extraLines.push(line);
  }

  const allBody = [...extraLines, ...bodyLines].join("\n").trim();

  return { subject, source, previousUpdate, datum, body: allBody };
}

function parseBodySections(bodyText) {
  if (!bodyText) return [];

  const lines = bodyText.split("\n");
  const sections = [];
  let current = { chartRef: "", panel: "", previousUpdate: "", datum: "", lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^Chart\s+\S+/i.test(trimmed)) {
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

    if (current.lines.length === 0 && /\[\s*previous update/i.test(trimmed)) {
      const prevMatch = trimmed.match(/\[\s*previous update\s+([^\]]+)\]/i);
      if (prevMatch && !current.previousUpdate) current.previousUpdate = prevMatch[1].trim();
      const datumMatch = trimmed.match(/(ETRS89|WGS84|ED50|OSGB36)\s*(DATUM)?/i);
      if (datumMatch && !current.datum) current.datum = datumMatch[0].trim();
      continue;
    }

    if (current.lines.length === 0 && /^(ETRS89|WGS84|ED50|OSGB36)/i.test(trimmed)) {
      if (!current.datum) current.datum = trimmed;
      continue;
    }

    current.lines.push(line);
  }

  const lastText = current.lines.join("\n").trim();
  if (lastText || current.chartRef) {
    sections.push({ ...current, text: lastText });
  }

  return sections;
}

function ChartSection({ chart, corrections, tpNotices, tpInForce }) {
  const hasFindings = corrections.length > 0 || tpNotices.length > 0 || tpInForce.length > 0;

  let badgeText = "CLEAR";
  let badgeStyle = s.clearBadge;
  if (corrections.length > 0) {
    badgeText = `${corrections.length} CORRECTION${corrections.length > 1 ? "S" : ""}`;
    badgeStyle = s.correctionBadge;
  } else if (tpNotices.length > 0 || tpInForce.length > 0) {
    badgeText = `${tpNotices.length + tpInForce.length} T&P`;
    badgeStyle = s.tpBadge;
  }

  return (
    <View wrap={false}>
      <View style={s.chartHeader}>
        <Text style={s.chartTitle}>Chart {chart}</Text>
        <Text style={[s.chartBadge, badgeStyle]}>{badgeText}</Text>
      </View>

      {!hasFindings && (
        <Text style={s.clearText}>No corrections or T&P notices for this chart.</Text>
      )}

      {corrections.length > 0 &&
        corrections.map((corr, i) => {
          const { subject, source, previousUpdate, datum, body } = parseExcerpt(corr.excerpt);
          const bodySections = parseBodySections(body);
          const hasSubSections = bodySections.length > 1 || (bodySections.length === 1 && bodySections[0].chartRef);
          return (
            <View key={`corr-${i}`} style={s.correctionItem} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={s.correctionNm}>NM {corr.nmNumber}</Text>
                  {datum && !hasSubSections && (
                    <Text style={{ fontSize: 6, color: GRAY_500, marginLeft: 6 }}>{datum}</Text>
                  )}
                </View>
                {corr.isPdfBlock && (
                  <Text style={{ fontSize: 7, color: RED, fontFamily: "Helvetica-Bold" }}>
                    Block Correction
                  </Text>
                )}
              </View>
              {subject && (
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GRAY_600, marginBottom: 1 }}>
                  {subject}
                </Text>
              )}
              {(source || (previousUpdate && !hasSubSections)) && (
                <Text style={{ fontSize: 7, color: GRAY_500, marginBottom: 3 }}>
                  {source ? `Source: ${source}` : ""}
                  {source && previousUpdate && !hasSubSections ? "  ·  " : ""}
                  {previousUpdate && !hasSubSections ? `Prev: ${previousUpdate}` : ""}
                </Text>
              )}
              {body && !hasSubSections && (
                <Text style={s.correctionExcerpt}>{body}</Text>
              )}
              {hasSubSections && bodySections.map((section, j) => (
                <View key={`sub-${j}`} style={{ marginTop: j > 0 ? 4 : 2 }}>
                  {section.chartRef && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BLACK }}>
                        Chart {section.chartRef}
                      </Text>
                      {section.panel && (
                        <Text style={{ fontSize: 7, color: GRAY_500, marginLeft: 4 }}>
                          {section.panel}
                        </Text>
                      )}
                      {(section.previousUpdate || section.datum) && (
                        <Text style={{ fontSize: 6, color: GRAY_500, marginLeft: 6 }}>
                          {section.previousUpdate ? `Prev: ${section.previousUpdate}` : ""}
                          {section.previousUpdate && section.datum ? "  ·  " : ""}
                          {section.datum || ""}
                        </Text>
                      )}
                    </View>
                  )}
                  {section.text && (
                    <Text style={s.correctionExcerpt}>{section.text}</Text>
                  )}
                </View>
              ))}
              {!subject && !body && corr.excerpt && (
                <Text style={s.correctionExcerpt}>{corr.excerpt}</Text>
              )}
            </View>
          );
        })}

      {tpNotices.length > 0 && (
        <View>
          <Text style={[s.subSectionTitle, { color: ORANGE }]}>
            New T&amp;P Notices This Week
          </Text>
          {tpNotices.map((tp, i) => (
            <View key={`tp-${i}`} style={s.tpItem} wrap={false}>
              <Text style={s.tpNm}>{tp.nmNumber}</Text>
              {tp.subject && (
                <View style={{ flexDirection: "row", marginBottom: 1 }}>
                  <Text style={{ fontSize: 8, color: GRAY_500, fontFamily: "Helvetica-Bold" }}>Subject: </Text>
                  <Text style={s.tpDetail}>{tp.subject}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 8, color: GRAY_500, fontFamily: "Helvetica-Bold" }}>Charts: </Text>
                <Text style={s.tpDetail}>{tp.charts}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {tpInForce.length > 0 && (
        <View>
          <Text style={[s.subSectionTitle, { color: BLUE }]}>
            T&amp;P Notices In Force ({tpInForce.length})
          </Text>
          {tpInForce.map((tp, i) => (
            <View key={`tpif-${i}`} style={s.tpInForceItem} wrap={false}>
              <Text style={s.tpNm}>{tp.nmNumber}</Text>
              {tp.subject && (
                <View style={{ flexDirection: "row", marginBottom: 1 }}>
                  <Text style={{ fontSize: 8, color: GRAY_500, fontFamily: "Helvetica-Bold" }}>Subject: </Text>
                  <Text style={s.tpDetail}>{tp.subject}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 8, color: GRAY_500, fontFamily: "Helvetica-Bold" }}>Charts: </Text>
                <Text style={s.tpDetail}>{tp.charts}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.divider} />
    </View>
  );
}

export function NtMReport({ result, userName, generatedAt }) {
  const {
    weekInfo,
    totalCorrections,
    totalTP,
    totalTPInForce,
    charts,
    checkedAt,
    weeklyNtmFile,
    sourceUrl,
  } = result;

  const checkDate = new Date(checkedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const genDate = new Date(generatedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <Text style={s.headerTitle}>
            WEEKLY NtM CHART CORRECTION REPORT
          </Text>
        </View>

        <View style={s.accentLine} />

        <View style={s.headerMeta}>
          <View>
            <Text style={s.headerMetaBold}>
              Week {String(weekInfo.week).padStart(2, "0")}/{weekInfo.year}
            </Text>
            <Text style={s.headerMetaText}>
              Source: {weeklyNtmFile || "unknown"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.headerMetaBold}>
              {userName || ""}
            </Text>
            <Text style={s.headerMetaText}>
              Checked: {checkDate}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Summary</Text>

        <View style={s.statsRow}>
          <StatBoxPDF
            value={totalCorrections}
            label="Corrections"
            color={totalCorrections === 0 ? "green" : "red"}
          />
          <StatBoxPDF
            value={totalTP}
            label="New T&P"
            color={totalTP === 0 ? "green" : "orange"}
          />
          <StatBoxPDF
            value={totalTPInForce || 0}
            label="T&P In Force"
            color={(totalTPInForce || 0) === 0 ? "green" : "blue"}
          />
          <StatBoxPDF
            value={charts.length}
            label="Charts"
            color="neutral"
            last
          />
        </View>

        <View style={s.divider} />

        <Text style={s.sectionTitle}>Chart-by-Chart Results</Text>

        {charts.map((chart) => (
          <ChartSection
            key={chart}
            chart={chart}
            corrections={result.corrections?.[chart] || []}
            tpNotices={result.tpNotices?.[chart] || []}
            tpInForce={result.tpInForce?.[chart] || []}
          />
        ))}

        <View style={s.footer} fixed>
          <View style={s.footerLine} />
          <View style={s.footerRow}>
            <View>
              <Text style={s.footerText}>
                Source: {sourceUrl ? sourceUrl.replace("https://", "") : "msi.admiralty.co.uk/NoticesToMariners/Weekly"}
              </Text>
              <Text style={s.footerText}>
                Crown Copyright applies to all Admiralty NtM content.
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.footerText}>
                Generated: {genDate}
              </Text>
              <Text
                style={s.footerPage}
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
