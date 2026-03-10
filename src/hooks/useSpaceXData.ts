"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LAUNCHPAD_SITE_MAP, LAUNCH_SITES, ROCKET_NAMES } from "@/lib/constants";
import type { Launch, LaunchSite } from "@/lib/types";
import { computeJellyfish } from "@/lib/jellyfish";
import { fetchLL2Upcoming, fetchLL2Recent, fetchLL2Range } from "@/lib/launchLibrary2";
import fallbackData from "@/data/fallbackLaunches.json";
import { HISTORICAL_LAUNCHES } from "@/data/historicalLaunches";

// ── Try to import the comprehensive database ────────────────
let launchDatabase: Launch[] | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  launchDatabase = require("@/data/launchDatabase.json") as Launch[];
} catch {
  // Database not yet assembled — will fall back to API + fallback
}

// ── SpaceX API types ─────────────────────────────────────────
interface SpaceXLaunch {
  id: string;
  name: string;
  date_utc: string;
  date_unix: number;
  upcoming: boolean;
  success: boolean | null;
  rocket: string;
  launchpad: string;
  details: string | null;
  links?: {
    patch?: {
      small?: string;
      large?: string;
    };
    webcast?: string;
    youtube_id?: string;
  };
  payloads?: string[];
}

interface SpaceXLaunchpad {
  id: string;
  name: string;
  full_name: string;
  latitude: number;
  longitude: number;
}

function getStatus(launch: SpaceXLaunch): "upcoming" | "success" | "failure" {
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  if (launch.success === false) return "failure";
  // If success is null but not upcoming, treat as success (historical)
  return "success";
}

function getLaunchSite(
  launchpadId: string,
  launchpads: SpaceXLaunchpad[]
): LaunchSite {
  const siteKey = LAUNCHPAD_SITE_MAP[launchpadId];
  if (siteKey && LAUNCH_SITES[siteKey]) {
    return LAUNCH_SITES[siteKey];
  }

  // Try to find in launchpads data
  const pad = launchpads.find((p) => p.id === launchpadId);
  if (pad) {
    return {
      id: launchpadId,
      name: pad.name,
      fullName: pad.full_name,
      lat: pad.latitude,
      lng: pad.longitude,
    };
  }

  // Default to Cape Canaveral
  return LAUNCH_SITES["cape-canaveral-slc40"];
}

async function fetchSpaceXData(): Promise<Launch[]> {
  const [launchesRes, launchpadsRes] = await Promise.all([
    fetch("https://api.spacexdata.com/v5/launches"),
    fetch("https://api.spacexdata.com/v4/launchpads"),
  ]);

  if (!launchesRes.ok || !launchpadsRes.ok) {
    throw new Error("SpaceX API unavailable");
  }

  const rawLaunches: SpaceXLaunch[] = await launchesRes.json();
  const launchpads: SpaceXLaunchpad[] = await launchpadsRes.json();

  // Filter to recent and upcoming launches (last 12 months + future)
  const cutoff = Date.now() - 12 * 30 * 24 * 60 * 60 * 1000;

  return rawLaunches
    .filter((l) => l.date_unix * 1000 >= cutoff)
    .map((l) => ({
      id: l.id,
      name: l.name,
      dateUtc: l.date_utc,
      dateUnix: l.date_unix,
      launchSite: getLaunchSite(l.launchpad, launchpads),
      status: getStatus(l),
      rocketType: ROCKET_NAMES[l.rocket] ?? "Unknown",
      missionPatch: l.links?.patch?.small ?? undefined,
      details: l.details ?? undefined,
      webcastUrl: l.links?.webcast ?? undefined,
    }))
    .sort((a, b) => a.dateUnix - b.dateUnix);
}

/**
 * Correct launch statuses based on actual dates.
 * The static database can have stale statuses:
 * - Past launches marked "upcoming" → correct to "success" (safe default)
 * - Future launches marked "success"/"failure" → correct to "upcoming"
 */
function correctStatuses(launches: Launch[]): Launch[] {
  const now = Date.now();
  return launches.map((l) => {
    const launchTime = new Date(l.dateUtc).getTime();
    if (launchTime > now && l.status !== "upcoming") {
      // Future launch incorrectly marked as success/failure
      return { ...l, status: "upcoming" as const, launchStatus: "upcoming" as const };
    }
    if (launchTime <= now && l.status === "upcoming") {
      // Past launch still marked as upcoming — assume success
      return { ...l, status: "success" as const, launchStatus: "success" as const };
    }
    return l;
  });
}

/**
 * Fetch upcoming launches from SpaceX API to supplement the static database.
 * This ensures we always have real upcoming launches even when the database is stale.
 */
async function fetchUpcomingLaunches(): Promise<Launch[]> {
  try {
    const [launchesRes, launchpadsRes] = await Promise.all([
      fetch("https://api.spacexdata.com/v5/launches/upcoming"),
      fetch("https://api.spacexdata.com/v4/launchpads"),
    ]);
    if (!launchesRes.ok || !launchpadsRes.ok) return [];
    const rawLaunches: SpaceXLaunch[] = await launchesRes.json();
    const launchpads: SpaceXLaunchpad[] = await launchpadsRes.json();
    return rawLaunches.map((l) => ({
      id: l.id,
      name: l.name,
      dateUtc: l.date_utc,
      dateUnix: l.date_unix,
      launchSite: getLaunchSite(l.launchpad, launchpads),
      status: "upcoming" as const,
      rocketType: ROCKET_NAMES[l.rocket] ?? "Falcon 9",
      missionPatch: l.links?.patch?.small ?? undefined,
      details: l.details ?? undefined,
      webcastUrl: l.links?.webcast ?? undefined,
    }));
  } catch {
    console.warn("[SpaceX Data] Could not fetch upcoming launches from API");
    return [];
  }
}

/**
 * Fetch recent past launches from SpaceX API to fill data gaps.
 * Gets launches from the last 6 months to supplement any gaps in the static database.
 */
async function fetchRecentLaunches(): Promise<Launch[]> {
  try {
    const [launchesRes, launchpadsRes] = await Promise.all([
      fetch("https://api.spacexdata.com/v5/launches/past"),
      fetch("https://api.spacexdata.com/v4/launchpads"),
    ]);
    if (!launchesRes.ok || !launchpadsRes.ok) return [];
    const rawLaunches: SpaceXLaunch[] = await launchesRes.json();
    const launchpads: SpaceXLaunchpad[] = await launchpadsRes.json();
    // Only keep last 6 months of past launches
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    return rawLaunches
      .filter((l) => l.date_unix * 1000 >= sixMonthsAgo)
      .map((l) => ({
        id: l.id,
        name: l.name,
        dateUtc: l.date_utc,
        dateUnix: l.date_unix,
        launchSite: getLaunchSite(l.launchpad, launchpads),
        status: getStatus(l),
        rocketType: ROCKET_NAMES[l.rocket] ?? "Falcon 9",
        missionPatch: l.links?.patch?.small ?? undefined,
        details: l.details ?? undefined,
        webcastUrl: l.links?.webcast ?? undefined,
      }));
  } catch {
    console.warn("[SpaceX Data] Could not fetch recent launches from API");
    return [];
  }
}

/**
 * Find matching launch index by ID or fuzzy name+date match.
 */
function findMergeMatch(merged: Launch[], candidate: Launch): number {
  for (let i = 0; i < merged.length; i++) {
    const l = merged[i];
    if (l.id === candidate.id) return i;
    const timeDiff = Math.abs(l.dateUnix - candidate.dateUnix);
    if (timeDiff < 86400) {
      const lName = l.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const aName = candidate.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (lName === aName || lName.includes(aName) || aName.includes(lName)) return i;
      if (l.rocketType === candidate.rocketType && l.launchSite.id === candidate.launchSite.id) return i;
    }
  }
  return -1;
}

/**
 * Merge API launches into the database.
 * - New launches (no match) are added
 * - Existing matches get enriched with API data that fills gaps
 *   (API data supplements but doesn't overwrite existing enriched fields)
 */
function mergeApiLaunches(base: Launch[], apiLaunches: Launch[]): Launch[] {
  const merged = [...base];
  for (const apiL of apiLaunches) {
    const idx = findMergeMatch(merged, apiL);
    if (idx === -1) {
      // No match — add as new entry
      merged.push(apiL);
    } else {
      // Match found — enrich existing entry with API data that fills gaps
      const existing = merged[idx];
      const updates: Partial<Launch> = {};

      // Fill missing fields from API data
      if (!existing.payloadOrbit && apiL.payloadOrbit) updates.payloadOrbit = apiL.payloadOrbit;
      if (!existing.details && apiL.details) updates.details = apiL.details;
      if (!existing.missionPatch && apiL.missionPatch) updates.missionPatch = apiL.missionPatch;
      if (!existing.boosterReturn && apiL.boosterReturn) updates.boosterReturn = apiL.boosterReturn;
      if (!existing.cores && apiL.cores) updates.cores = apiL.cores;
      if (!existing.landingMode && apiL.landingMode) updates.landingMode = apiL.landingMode;
      if (!existing.landingZone && apiL.landingZone) updates.landingZone = apiL.landingZone;
      if (existing.landingAttempted == null && apiL.landingAttempted != null) updates.landingAttempted = apiL.landingAttempted;
      if (existing.landingSuccess == null && apiL.landingSuccess != null) updates.landingSuccess = apiL.landingSuccess;
      if (!existing.vehicleVariant && apiL.vehicleVariant) updates.vehicleVariant = apiL.vehicleVariant;
      if (!existing.family && apiL.family) updates.family = apiL.family;
      if (!existing.failureSummary && apiL.failureSummary) updates.failureSummary = apiL.failureSummary;
      if (existing.isStarlink == null && apiL.isStarlink != null) updates.isStarlink = apiL.isStarlink;
      if (existing.isCrewed == null && apiL.isCrewed != null) updates.isCrewed = apiL.isCrewed;

      // Update status from LL2 if more accurate (LL2 has granular statuses)
      if (apiL.launchStatus && apiL.launchStatus !== "unknown") {
        if (!existing.launchStatus || existing.launchStatus === "unknown") {
          updates.launchStatus = apiL.launchStatus;
          updates.status = apiL.status;
        }
      }

      if (Object.keys(updates).length > 0) {
        merged[idx] = { ...existing, ...updates };
      }
    }
  }
  return merged;
}

/** Enrich launches with jellyfish potential data */
function enrichWithJellyfish(launches: Launch[]): Launch[] {
  return launches.map((l) => {
    if (l.jellyfish) return l; // already has jellyfish data
    const jf = computeJellyfish(l.dateUtc, l.launchSite.lat, l.launchSite.lng);
    return jf.potential !== "none" ? { ...l, jellyfish: jf } : l;
  });
}

function loadFallbackData(): Launch[] {
  return (fallbackData as Launch[]).sort((a, b) => a.dateUnix - b.dateUnix);
}

/**
 * Find matching launch by ID first, then by name+date similarity.
 * Historical launches use custom IDs (fh-demo, starship-flight1) while
 * database uses API IDs or supplemental IDs, so we need fuzzy matching.
 */
function findMatchIndex(merged: Launch[], hist: Launch): number {
  // 1. Exact ID match
  const idIdx = merged.findIndex((l) => l.id === hist.id);
  if (idIdx !== -1) return idIdx;

  // 2. Same-day (±1 day) + similar name match (handles different ID schemes)
  const histUnix = hist.dateUnix;
  const histNameLower = hist.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const DAY_SECS = 86400;

  for (let i = 0; i < merged.length; i++) {
    const l = merged[i];
    const timeDiff = Math.abs(l.dateUnix - histUnix);
    if (timeDiff > DAY_SECS * 1.5) continue; // within ~1.5 days

    const lNameLower = l.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Exact name match (ignoring punctuation/case)
    if (lNameLower === histNameLower) return i;
    // One name contains the other (e.g., "FH Demo Mission" vs "Falcon Heavy Demo")
    if (lNameLower.includes(histNameLower) || histNameLower.includes(lNameLower)) return i;
    // Same rocket type on same day with same site
    if (l.rocketType === hist.rocketType && l.launchSite.id === hist.launchSite.id && timeDiff < DAY_SECS) {
      return i;
    }
  }

  return -1;
}

/** Merge API/fallback data with historical launches. Historical enrichments take precedence. */
function mergeWithHistorical(baseLaunches: Launch[]): Launch[] {
  const merged = [...baseLaunches];

  for (const hist of HISTORICAL_LAUNCHES) {
    const idx = findMatchIndex(merged, hist);

    if (idx === -1) {
      // No match found — add as new entry
      merged.push(hist);
    } else {
      // Merge enrichment data from historical into existing record.
      // Historical data is hand-curated and ALWAYS takes precedence.
      const updates: Partial<Launch> = {};
      if (hist.flightHistory) updates.flightHistory = hist.flightHistory;
      if (hist.boosterReturn) updates.boosterReturn = hist.boosterReturn;
      if (hist.boosterReturns) updates.boosterReturns = hist.boosterReturns;
      if (hist.webcastUrl && !merged[idx].webcastUrl) updates.webcastUrl = hist.webcastUrl;
      if (hist.details && !merged[idx].details) updates.details = hist.details;
      if (hist.payloadOrbit && !merged[idx].payloadOrbit) updates.payloadOrbit = hist.payloadOrbit;
      // Historical overrides for status fields (hand-verified data)
      if (hist.launchStatus) updates.launchStatus = hist.launchStatus;
      if (hist.failureCategory) updates.failureCategory = hist.failureCategory;
      if (hist.failureSummary) updates.failureSummary = hist.failureSummary;
      if (hist.failureDetail) updates.failureDetail = hist.failureDetail;
      if (hist.exploded != null) updates.exploded = hist.exploded;
      if (hist.explosionPhase !== undefined) updates.explosionPhase = hist.explosionPhase;
      if (hist.cores) updates.cores = hist.cores;
      if (hist.landingZone) updates.landingZone = hist.landingZone;
      if (Object.keys(updates).length > 0) {
        merged[idx] = { ...merged[idx], ...updates };
      }
    }
  }

  return merged.sort((a, b) => a.dateUnix - b.dateUnix);
}

/**
 * Detect months with suspiciously few launches in the database.
 * SpaceX typically launches 5-10+ times per month, so <3 is a gap.
 * Returns date ranges to fill from LL2.
 */
function detectDataGaps(launches: Launch[]): { start: string; end: string }[] {
  const gaps: { start: string; end: string }[] = [];
  const now = new Date();
  // Only check the last 18 months — older gaps are less important
  const cutoff = new Date(now.getFullYear() - 1, now.getMonth() - 6, 1);

  // Count launches per month
  const monthCounts = new Map<string, number>();
  for (const l of launches) {
    const d = new Date(l.dateUtc);
    if (d < cutoff || d > now) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  // Find months with < 3 launches (strong indicator of a data gap)
  const curMonth = now.getFullYear() * 12 + now.getMonth();
  const cutoffMonth = cutoff.getFullYear() * 12 + cutoff.getMonth();

  for (let m = cutoffMonth; m <= curMonth; m++) {
    const year = Math.floor(m / 12);
    const month = m % 12;
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const count = monthCounts.get(key) ?? 0;

    if (count < 3) {
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      // End of month
      const endDate = new Date(year, month + 1, 0);
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
      gaps.push({ start, end });
    }
  }

  return gaps;
}

/** Compute unique years from launches and set in store */
function computeAvailableYears(launches: Launch[]): number[] {
  const years = new Set<number>();
  for (const l of launches) {
    years.add(new Date(l.dateUtc).getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a); // descending
}

export function useSpaceXData() {
  const setLaunches = useAppStore((s) => s.setLaunches);
  const setLoading = useAppStore((s) => s.setLoading);
  const setAvailableYears = useAppStore((s) => s.setAvailableYears);
  const launches = useAppStore((s) => s.launches);
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let base: Launch[];

        if (launchDatabase && launchDatabase.length > 0) {
          // ── Primary: comprehensive database ────────────────
          base = launchDatabase;
          console.log(
            `[SpaceX Data] Loaded ${base.length} launches from comprehensive database`
          );
        } else {
          // ── Fallback: live API or static fallback ──────────
          try {
            base = await fetchSpaceXData();
            if (base.length === 0) throw new Error("Empty API response");
            console.log(
              `[SpaceX Data] Loaded ${base.length} launches from SpaceX API`
            );
          } catch {
            console.warn(
              "[SpaceX Data] API unavailable, using fallback data"
            );
            base = loadFallbackData();
          }
        }

        // Correct stale statuses (future marked success, past marked upcoming)
        base = correctStatuses(base);

        // ── Supplement with live API data ───────────────────────
        // Priority 1: Launch Library 2 (actively maintained, rich data)
        // Priority 2: SpaceX API v5 (stale since Oct 2022, basic data)
        try {
          const [ll2Upcoming, ll2Recent] = await Promise.all([
            fetchLL2Upcoming(),
            fetchLL2Recent(),
          ]);
          if (ll2Upcoming.length > 0 || ll2Recent.length > 0) {
            base = mergeApiLaunches(base, [...ll2Recent, ...ll2Upcoming]);
            console.log(
              `[SpaceX Data] LL2: +${ll2Upcoming.length} upcoming, +${ll2Recent.length} recent`
            );
          }
        } catch {
          console.warn("[SpaceX Data] LL2 unavailable, trying SpaceX API fallback");
        }

        // ── Fill data gaps from LL2 ────────────────────────────
        // Detect months with suspiciously few launches and fetch from LL2
        try {
          const gaps = detectDataGaps(base);
          if (gaps.length > 0) {
            console.log(`[SpaceX Data] Detected ${gaps.length} data gap(s): ${gaps.map(g => g.start).join(", ")}`);
            // Fetch at most 2 gap ranges to respect rate limits
            const gapFetches = gaps.slice(0, 2).map((g) => fetchLL2Range(g.start, g.end));
            const gapResults = await Promise.all(gapFetches);
            for (const gapLaunches of gapResults) {
              if (gapLaunches.length > 0) {
                base = mergeApiLaunches(base, gapLaunches);
                console.log(`[SpaceX Data] Gap fill: +${gapLaunches.length} launches`);
              }
            }
          }
        } catch {
          // Gap fill is optional — don't fail the whole load
        }

        // Fallback: SpaceX API v5 (stale but may still have some useful data)
        try {
          const [upcoming, recent] = await Promise.all([
            fetchUpcomingLaunches(),
            fetchRecentLaunches(),
          ]);
          if (upcoming.length > 0 || recent.length > 0) {
            base = mergeApiLaunches(base, [...recent, ...upcoming]);
            console.log(
              `[SpaceX Data] SpaceX API: +${upcoming.length} upcoming, +${recent.length} recent`
            );
          }
        } catch {
          // SpaceX API supplement is optional
        }

        if (!cancelled) {
          const enriched = enrichWithJellyfish(base);
          const merged = mergeWithHistorical(enriched);
          setLaunches(merged);
          setAvailableYears(computeAvailableYears(merged));
        }
      } catch (err) {
        console.error("[SpaceX Data] Error loading data:", err);
        if (!cancelled) {
          const merged = mergeWithHistorical(
            enrichWithJellyfish(loadFallbackData())
          );
          setLaunches(merged);
          setAvailableYears(computeAvailableYears(merged));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // ── Periodic refresh for upcoming launches ────────────────
    // Re-fetch upcoming data every 30 minutes to keep it fresh.
    // Uses the LL2 cache (6h TTL) so most refreshes are instant.
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
    const refreshTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const ll2Upcoming = await fetchLL2Upcoming();
        if (ll2Upcoming.length > 0 && !cancelled) {
          const currentLaunches = useAppStore.getState().launches;
          const updated = mergeApiLaunches(currentLaunches, ll2Upcoming);
          const corrected = correctStatuses(updated);
          setLaunches(corrected.sort((a, b) => a.dateUnix - b.dateUnix));
          console.log(`[SpaceX Data] Refreshed upcoming: ${ll2Upcoming.length} launches`);
        }
      } catch {
        // Silent refresh failure — existing data is fine
      }
    }, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
    };
  }, [setLaunches, setLoading, setAvailableYears]);

  return { launches, loading };
}
