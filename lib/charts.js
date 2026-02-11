export const DEFAULT_CHARTS = [1491, 1534, 1535, 1543, 2052];

export function validateCharts(input) {
  if (!Array.isArray(input)) return [];

  const valid = input
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n) && n > 0 && n <= 99999);

  // Deduplicate and sort
  return [...new Set(valid)].sort((a, b) => a - b);
}
