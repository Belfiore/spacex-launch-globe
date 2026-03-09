import type { OMMRecord } from "./types";

/**
 * Fetch Starlink satellite orbital data from our API proxy.
 * Uses in-memory caching to avoid redundant fetches.
 */

let cachedRecords: OMMRecord[] | null = null;
let fetchedAt = 0;
const REFETCH_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function fetchStarlinkData(): Promise<OMMRecord[]> {
  const now = Date.now();

  // Return cached data if fresh enough
  if (cachedRecords && now - fetchedAt < REFETCH_INTERVAL_MS) {
    return cachedRecords;
  }

  try {
    const res = await fetch("/api/starlink");
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data: OMMRecord[] = await res.json();

    // Filter out any invalid records
    const valid = data.filter(
      (r) =>
        r.OBJECT_NAME &&
        typeof r.MEAN_MOTION === "number" &&
        typeof r.INCLINATION === "number" &&
        r.MEAN_MOTION > 0
    );

    cachedRecords = valid;
    fetchedAt = Date.now();

    console.log(
      `[Starlink] Loaded ${valid.length} satellites (${data.length - valid.length} filtered)`
    );

    return valid;
  } catch (err) {
    console.error("[Starlink] Fetch error:", err);
    // Return stale cache if available
    if (cachedRecords) return cachedRecords;
    throw err;
  }
}

/** Get data freshness in hours */
export function getDataAge(): number {
  if (!fetchedAt) return Infinity;
  return (Date.now() - fetchedAt) / (60 * 60 * 1000);
}

/** Get cached count */
export function getCachedCount(): number {
  return cachedRecords?.length ?? 0;
}
