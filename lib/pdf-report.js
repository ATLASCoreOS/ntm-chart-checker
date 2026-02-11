import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Playfair Display",
  src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtXK-F2qC0s.ttf",
  fontWeight: 700,
});

const NAVY = "#0A1628";
const NAVY_LIGHT = "#162D4A";
const BRASS = "#C9A962";
const PARCHMENT = "#F5F0E8";
const SEA_SLATE = "#8B9DB5";
const SIGNAL_RED = "#C0392B";
const SIGNAL_AMBER = "#D4A017";
const SIGNAL_GREEN = "#27AE60";
const SIGNAL_BLUE = "#2980B9";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const LIGHT_GREY = "#F0F0F0";

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: BLACK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: WHITE,
  },
  // Header
  headerBar: {
    backgroundColor: NAVY,
    padding: 16,
    marginBottom: 2,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
  },
  headerTitle: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    color: PARCHMENT,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  goldLine: {
    height: 2,
    backgroundColor: BRASS,
    marginHorizontal: -40,
  },
  headerMeta: {
    backgroundColor: NAVY_LIGHT,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginHorizontal: -40,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerMetaText: {
    fontSize: 9,
    color: SEA_SLATE,
  },
  headerMetaBold: {
    fontSize: 9,
    color: PARCHMENT,
    fontWeight: 600,
  },
  // Summary section
  sectionTitle: {
    fontFamily: "Playfair Display",
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 3,
    color: "#666666",
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  goldDivider: {
    height: 1,
    backgroundColor: BRASS,
    marginVertical: 12,
  },
  // Chart sections
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
  },
  chartBadge: {
    fontSize: 8,
    fontWeight: 700,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  clearBadge: {
    backgroundColor: "#E8F5E9",
    color: SIGNAL_GREEN,
  },
  correctionBadge: {
    backgroundColor: "#FFEBEE",
    color: SIGNAL_RED,
  },
  tpBadge: {
    backgroundColor: "#FFF8E1",
    color: SIGNAL_AMBER,
  },
  clearText: {
    fontSize: 9,
    color: SIGNAL_GREEN,
    marginBottom: 4,
  },
  // Correction items
  correctionItem: {
    borderLeftWidth: 3,
    borderLeftColor: SIGNAL_RED,
    backgroundColor: "#FFF5F5",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  correctionNm: {
    fontSize: 9,
    fontWeight: 700,
    color: SIGNAL_RED,
    marginBottom: 3,
  },
  correctionExcerpt: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.4,
  },
  // T&P items
  tpItem: {
    borderLeftWidth: 3,
    borderLeftColor: SIGNAL_AMBER,
    backgroundColor: "#FFFDF5",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  tpInForceItem: {
    borderLeftWidth: 3,
    borderLeftColor: SIGNAL_BLUE,
    backgroundColor: "#F5F9FF",
    padding: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  tpNm: {
    fontSize: 9,
    fontWeight: 700,
    color: "#333333",
    marginBottom: 2,
  },
  tpDetail: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.3,
  },
  subSectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
  },
  footerLine: {
    height: 1,
    backgroundColor: BRASS,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#999999",
  },
  footerPage: {
    fontSize: 7,
    color: "#999999",
  },
});

function getStatColor(color) {
  const map = {
    green: { bg: "#E8F5E9", border: "#C8E6C9", text: SIGNAL_GREEN },
    red: { bg: "#FFEBEE", border: "#FFCDD2", text: SIGNAL_RED },
    amber: { bg: "#FFF8E1", border: "#FFECB3", text: SIGNAL_AMBER },
    blue: { bg: "#E3F2FD", border: "#BBDEFB", text: SIGNAL_BLUE },
    neutral: { bg: LIGHT_GREY, border: "#E0E0E0", text: "#333333" },
  };
  return map[color] || map.neutral;
}

function StatBoxPDF({ value, label, color }) {
  const c = getStatColor(color);
  return (
    <View style={[s.statBox, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.statValue, { color: c.text }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
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
        corrections.map((corr, i) => (
          <View key={`corr-${i}`} style={s.correctionItem} wrap={false}>
            <Text style={s.correctionNm}>
              NM {corr.nmNumber}
              {corr.isPdfBlock ? "  [Block PDF]" : ""}
            </Text>
            {corr.excerpt && (
              <Text style={s.correctionExcerpt}>
                {corr.excerpt.length > 500
                  ? corr.excerpt.substring(0, 500) + "..."
                  : corr.excerpt}
              </Text>
            )}
          </View>
        ))}

      {tpNotices.length > 0 && (
        <>
          <Text style={[s.subSectionTitle, { color: SIGNAL_AMBER }]}>
            New T&P Notices This Week
          </Text>
          {tpNotices.map((tp, i) => (
            <View key={`tp-${i}`} style={s.tpItem} wrap={false}>
              <Text style={s.tpNm}>{tp.nmNumber}</Text>
              <Text style={s.tpDetail}>
                Charts: {tp.charts}
                {tp.subject ? ` — ${tp.subject}` : ""}
              </Text>
            </View>
          ))}
        </>
      )}

      {tpInForce.length > 0 && (
        <>
          <Text style={[s.subSectionTitle, { color: SIGNAL_BLUE }]}>
            T&P Notices In Force ({tpInForce.length})
          </Text>
          {tpInForce.map((tp, i) => (
            <View key={`tpif-${i}`} style={s.tpInForceItem} wrap={false}>
              <Text style={s.tpNm}>{tp.nmNumber}</Text>
              <Text style={s.tpDetail}>
                Charts: {tp.charts}
                {tp.subject ? ` — ${tp.subject}` : ""}
              </Text>
            </View>
          ))}
        </>
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
    pdfCount,
    durationMs,
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
        {/* Header bar */}
        <View style={s.headerBar} fixed>
          <Text style={s.headerTitle}>
            WEEKLY NtM CHART CORRECTION REPORT
          </Text>
        </View>

        {/* Gold accent line */}
        <View style={s.goldLine} fixed />

        {/* Metadata row */}
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
              {userName}
            </Text>
            <Text style={s.headerMetaText}>
              Checked: {checkDate}
            </Text>
          </View>
        </View>

        {/* Summary */}
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
            color={totalTP === 0 ? "green" : "amber"}
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
          />
        </View>

        <View style={s.goldDivider} />

        {/* Chart-by-Chart */}
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

        {/* Footer */}
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
