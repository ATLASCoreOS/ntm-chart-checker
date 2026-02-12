/**
 * Lightweight structured logger for server-side timing and diagnostics.
 * Outputs JSON-structured logs for easy parsing in Vercel/production.
 */

export function log(level, message, data) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (data !== undefined) {
    entry.data = data;
  }

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function perf(label, ms) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: "perf", label, ms }));
}
