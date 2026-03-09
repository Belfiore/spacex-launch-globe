import { NextResponse } from "next/server";

/**
 * Server-side proxy for CelesTrak Starlink GP data.
 * CelesTrak blocks CORS, so we fetch server-side and relay to the client.
 * Cache response for 2 hours (CelesTrak doesn't update more frequently).
 */

const CELESTRAK_URL =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=JSON";

// In-memory cache
let cachedData: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET() {
  const now = Date.now();

  // Return cached data if fresh
  if (cachedData && now - cachedAt < CACHE_TTL_MS) {
    return new NextResponse(cachedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT",
        "X-Cache-Age": String(Math.round((now - cachedAt) / 1000)),
      },
    });
  }

  try {
    const res = await fetch(CELESTRAK_URL, {
      headers: { Accept: "application/json" },
      // Next.js fetch cache: revalidate every 2 hours
      next: { revalidate: 7200 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    cachedData = text;
    cachedAt = Date.now();

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=7200, s-maxage=7200",
      },
    });
  } catch (err) {
    console.error("[Starlink API] Fetch error:", err);
    // Return stale cache if available
    if (cachedData) {
      return new NextResponse(cachedData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "STALE",
        },
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch Starlink data" },
      { status: 502 }
    );
  }
}
