"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LAUNCHPAD_SITE_MAP, LAUNCH_SITES, ROCKET_NAMES } from "@/lib/constants";
import type { Launch, LaunchSite } from "@/lib/types";
import fallbackData from "@/data/fallbackLaunches.json";

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

function loadFallbackData(): Launch[] {
  return (fallbackData as Launch[]).sort((a, b) => a.dateUnix - b.dateUnix);
}

export function useSpaceXData() {
  const setLaunches = useAppStore((s) => s.setLaunches);
  const setLoading = useAppStore((s) => s.setLoading);
  const launches = useAppStore((s) => s.launches);
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchSpaceXData();
        if (!cancelled) {
          if (data.length > 0) {
            setLaunches(data);
          } else {
            setLaunches(loadFallbackData());
          }
        }
      } catch {
        if (!cancelled) {
          console.warn("SpaceX API unavailable, using fallback data");
          setLaunches(loadFallbackData());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setLaunches, setLoading]);

  return { launches, loading };
}
