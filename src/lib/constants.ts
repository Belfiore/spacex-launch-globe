import type { LaunchSite } from "./types";

// ── Launch Sites ──────────────────────────────────────────────
export const LAUNCH_SITES: Record<string, LaunchSite> = {
  "cape-canaveral-slc40": {
    id: "cape-canaveral-slc40",
    name: "CCSFS SLC-40",
    fullName: "Cape Canaveral Space Force Station SLC-40",
    lat: 28.5618,
    lng: -80.577,
  },
  "ksc-lc39a": {
    id: "ksc-lc39a",
    name: "KSC LC-39A",
    fullName: "Kennedy Space Center Launch Complex 39A",
    lat: 28.608,
    lng: -80.604,
  },
  "vandenberg-slc4e": {
    id: "vandenberg-slc4e",
    name: "VSFB SLC-4E",
    fullName: "Vandenberg Space Force Base SLC-4E",
    lat: 34.632,
    lng: -120.611,
  },
  "boca-chica": {
    id: "boca-chica",
    name: "Starbase",
    fullName: "SpaceX Starbase, Boca Chica",
    lat: 25.9972,
    lng: -97.156,
  },
  "kwajalein": {
    id: "kwajalein",
    name: "Omelek Island",
    fullName: "Kwajalein Atoll Omelek Island",
    lat: 9.0477,
    lng: 167.7431,
  },
};

// ── SpaceX API launchpad ID → site key mapping ───────────────
export const LAUNCHPAD_SITE_MAP: Record<string, string> = {
  "5e9e4501f509094ba4566f84": "cape-canaveral-slc40", // CCSFS SLC 40
  "5e9e4502f509092b78566f87": "ksc-lc39a", // KSC LC 39A
  "5e9e4502f509094188566f88": "vandenberg-slc4e", // VSFB SLC 4E
  "5e9e4502f5090995de566f86": "boca-chica", // Starbase
  "5e9e4501f5090910d4566f83": "kwajalein", // Kwajalein
};

// ── Rocket ID → name mapping ─────────────────────────────────
export const ROCKET_NAMES: Record<string, string> = {
  "5e9d0d95eda69973a809d1ec": "Falcon 9",
  "5e9d0d95eda69974db09d1ed": "Falcon Heavy",
  "5e9d0d96eda699382d09d1ee": "Starship",
  "5e9d0d95eda69955f709d1eb": "Falcon 1",
};

// ── Globe settings ───────────────────────────────────────────
export const GLOBE = {
  RADIUS: 2,
  ATMOSPHERE_RADIUS: 2.12,
  SEGMENTS: 64,
  MIN_ZOOM: 2.1,
  MAX_ZOOM: 12,
  AUTO_ROTATE_SPEED: 0,
  IDLE_TIMEOUT: 5000, // ms before auto-rotate resumes
  // Looking from Mexico (~18°N, -95°W) up toward US launch sites, distance=5
  CAMERA_INITIAL: [-0.41, 1.55, 4.74] as [number, number, number],
  FOV: 45,
};

// ── Colors ───────────────────────────────────────────────────
export const COLORS = {
  background: "#0a0e1a",
  panelBg: "#121829",
  upcoming: "#22d3ee", // cyan-400
  success: "#22c55e", // green-500
  failure: "#ef4444", // red-500
  active: "#f59e0b", // amber-500
  trajectory: "#2dd4bf", // teal-400
  atmosphere: "#93c5fd", // blue-300
  text: "#e2e8f0",
  textMuted: "#94a3b8",
};

// ── Timeline ─────────────────────────────────────────────────
export const TIMELINE = {
  RANGE_MONTHS_PAST: 6,
  RANGE_MONTHS_FUTURE: 6,
  PLAYBACK_TIME_SCALE: 43200, // 12 hours of real time per second of playback (25% of original)
  HEIGHT: 80,
};

export const STATUS_COLORS: Record<string, string> = {
  upcoming: COLORS.upcoming,
  success: COLORS.success,
  failure: COLORS.failure,
};

// ── Site groups for filtering ────────────────────────────────
export interface SiteGroup {
  key: string;
  label: string;
  color: string;
  /** Launch site IDs that belong to this group */
  siteIds: string[];
}

export const SITE_GROUPS: SiteGroup[] = [
  {
    key: "CC",
    label: "Cape Canaveral",
    color: "#22d3ee", // cyan
    siteIds: ["cape-canaveral-slc40", "ksc-lc39a"],
  },
  {
    key: "BC",
    label: "Boca Chica",
    color: "#f59e0b", // amber
    siteIds: ["boca-chica"],
  },
  {
    key: "V",
    label: "Vandenberg",
    color: "#a78bfa", // violet
    siteIds: ["vandenberg-slc4e"],
  },
];

/** Get the accent color for a given launch site ID */
export function getSiteAccentColor(siteId: string): string {
  const group = SITE_GROUPS.find((g) => g.siteIds.includes(siteId));
  return group?.color ?? COLORS.upcoming;
}

/** Get the short site key (CC / BC / V) for a given launch site ID */
export function getSiteKey(siteId: string): string {
  const group = SITE_GROUPS.find((g) => g.siteIds.includes(siteId));
  return group?.key ?? "?";
}

// ── Stage separation & booster return ───────────────────────
/** Fraction along the main arc where first-stage separation occurs */
export const STAGING_PROGRESS = 0.35;

/** Known drone ship / landing zone coordinates */
export const DRONE_SHIP_COORDS = {
  JRTI: { lat: 30.4, lng: -74.0 }, // Just Read the Instructions (Atlantic)
  OCISLY: { lat: 28.4, lng: -76.0 }, // Of Course I Still Love You (Atlantic)
  ASOG: { lat: 33.2, lng: -119.5 }, // A Shortfall of Gravitas (Pacific)
  LZ1: { lat: 28.485, lng: -80.544 }, // Landing Zone 1 (RTLS)
  LZ2: { lat: 28.485, lng: -80.54 }, // Landing Zone 2 (RTLS)
};

// ── Cinematic camera phases ─────────────────────────────────
export const CINEMATIC_PHASES = {
  liftoff: {
    distance: 2.45,
    elevation: 4,
    driftSpeed: 0,
    targetT: 0.05,
    duration: 8,
  },
  "pitch-over": {
    distance: 2.6,
    elevation: 6,
    driftSpeed: 0.015,
    targetT: 0.15,
    duration: 10,
  },
  downrange: {
    distance: 2.9,
    elevation: 10,
    driftSpeed: 0.01,
    targetT: 0.35,
    duration: 12,
  },
  orbital: {
    distance: 3.6,
    elevation: 16,
    driftSpeed: 0.008,
    targetT: 0.5,
    duration: 15,
  },
} as const;

/** Pause duration (ms) at each launch during sequential playback before auto-advancing */
export const SEQUENTIAL_DWELL_MS = 20000;
