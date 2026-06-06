import prisma from "./db";

// DB-backed fixed-window rate limiter. Each (key, time-bucket) is its own row,
// so concurrent requests just race on an atomic increment — no read-modify-write.
// Returns { ok, retryAfter }. Fails open (ok:true) if the DB is unreachable, so
// a limiter outage never locks users out of auth.
export async function rateLimit({ key, limit, windowSec }) {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const fullKey = `${key}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowSec * 1000);

  try {
    const row = await prisma.rateHit.upsert({
      where: { key: fullKey },
      update: { count: { increment: 1 } },
      create: { key: fullKey, count: 1, expiresAt },
    });
    return {
      ok: row.count <= limit,
      retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    };
  } catch {
    return { ok: true, retryAfter: 0 };
  }
}

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
