import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAvailableWeeks } from "@/lib/scraper";

// Cache available weeks for 1 hour (they only change weekly on Thursdays)
let cachedWeeks = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const cacheHeader = { "Cache-Control": "public, max-age=3600" };
    if (cachedWeeks && now - cachedAt < CACHE_TTL) {
      return NextResponse.json({ weeks: cachedWeeks }, { headers: cacheHeader });
    }

    const weeks = await fetchAvailableWeeks();
    cachedWeeks = weeks;
    cachedAt = now;

    return NextResponse.json({ weeks }, { headers: cacheHeader });
  } catch (error) {
    console.error("Failed to fetch available weeks:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch available weeks", weeks: [] },
      { status: 502 }
    );
  }
}
