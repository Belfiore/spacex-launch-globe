"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LAUNCHPAD_SITE_MAP, LAUNCH_SITES, ROCKET_NAMES } from "@/lib/constants";
import type { Launch, LaunchSite } from "@/lib/types";
import { computeJellyfish } from "@/lib/jellyfish";
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
 * Merge API launches into the database, avoiding duplicates.
 * API data fills gaps but doesn't overwrite enriched database entries.
 */
function mergeApiLaunches(base: Launch[], apiLaunches: Launch[]): Launch[] {
  const merged = [...base];
  for (const apiL of apiLaunches) {
    // Check if this launch already exists in the database
    const exists = merged.some((l) => {
      if (l.id === apiL.id) return true;
      // Same day, same rocket type, similar name
      const timeDiff = Math.abs(l.dateUnix - apiL.dateUnix);
      if (timeDiff < 86400) {
        const lName = l.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const aName = apiL.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (lName === aName || lName.includes(aName) || aName.includes(lName)) return true;
        if (l.rocketType === apiL.rocketType && l.launchSite.id === apiL.launchSite.id) return true;
      }
      return false;
    });
    if (!exists) {
      merged.push(apiL);
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
      // Merge enrichment data from historical into existing record
      const updates: Partial<Launch> = {};
      if (hist.flightHistory) updates.flightHistory = hist.flightHistory;
      if (hist.boosterReturn) updates.boosterReturn = hist.boosterReturn;
      if (hist.webcastUrl && !merged[idx].webcastUrl) updates.webcastUrl = hist.webcastUrl;
      if (hist.details && !merged[idx].details) updates.details = hist.details;
      if (hist.payloadOrbit && !merged[idx].payloadOrbit) updates.payloadOrbit = hist.payloadOrbit;
      if (Object.keys(updates).length > 0) {
        merged[idx] = { ...merged[idx], ...updates };
      }
    }
  }

  return merged.sort((a, b) => a.dateUnix - b.dateUnix);
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

        // Supplement with live API data to fill gaps and get real upcoming launches
        try {
          const [upcoming, recent] = await Promise.all([
            fetchUpcomingLaunches(),
            fetchRecentLaunches(),
          ]);
          if (upcoming.length > 0 || recent.length > 0) {
            base = mergeApiLaunches(base, [...recent, ...upcoming]);
            console.log(
              `[SpaceX Data] Supplemented with ${upcoming.length} upcoming + ${recent.length} recent from API`
            );
          }
        } catch {
          // API supplement is optional — database still works without it
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
    return () => {
      cancelled = true;
    };
  }, [setLaunches, setLoading, setAvailableYears]);

  return { launches, loading };
}
