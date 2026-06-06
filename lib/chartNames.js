// Chart number -> title lookup, backed by the bundled UKHO catalog
// (lib/chart-names.json, ~3,984 entries). Server-side only — do NOT import
// from a client component, or the 161 KB JSON ends up in the browser bundle.
// Clients should use the /api/charts search endpoint instead.
import chartNames from "./chart-names.json";

export function getChartName(num) {
  return chartNames[String(num)] || null;
}

export function chartExists(num) {
  return Object.prototype.hasOwnProperty.call(chartNames, String(num));
}

// Typeahead search: match by chart-number prefix or title substring.
// Number-prefix matches are ranked first so "153" surfaces 1530, 1531, …
export function searchCharts(q, limit = 10) {
  const query = String(q || "").trim().toLowerCase();
  if (!query) return [];

  const prefix = [];
  const contains = [];
  for (const [num, name] of Object.entries(chartNames)) {
    if (num.startsWith(query)) {
      prefix.push({ number: parseInt(num, 10), name });
    } else if (name.toLowerCase().includes(query)) {
      contains.push({ number: parseInt(num, 10), name });
    }
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, limit);
}
