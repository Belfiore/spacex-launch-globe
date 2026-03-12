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
  // Looking from the Atlantic (SE of US) toward the East Coast, distance~5
  CAMERA_INITIAL: [-2.0, 2.5, 3.8] as [number, number, number],
  /** Zoomed-out overview — whole Earth visible, used during intro modal */
  CAMERA_OVERVIEW: [-3, 4, 7] as [number, number, number],
  FOV: 45,
  /** Central USA (Kansas) — orbit center so camera pivots around launch sites */
  USA_CENTER_LAT: 39.8,
  USA_CENTER_LNG: -98.5,
  /** Orbit target offset: 0 = globe center, 1 = surface. 0.3 keeps orbit natural */
  ORBIT_TARGET_OFFSET: 0.3,
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
  MOBILE_HEIGHT: 60,
};

export const STATUS_COLORS: Record<string, string> = {
  upcoming: COLORS.upcoming,
  success: COLORS.success,
  failure: COLORS.failure,
  partial_failure: COLORS.active, // amber for partial failures
  prelaunch_failure: COLORS.failure,
  scrubbed: COLORS.upcoming,
  unknown: "#64748b",
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
  {
    key: "OI",
    label: "Omelek Island",
    color: "#fb923c", // orange
    siteIds: ["kwajalein"],
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

/** Get average lat/lng center for a SITE_GROUP key (e.g., "CC", "BC") */
export function getSiteGroupCenter(key: string): { lat: number; lng: number } | null {
  const group = SITE_GROUPS.find((g) => g.key === key);
  if (!group) return null;
  const sites = group.siteIds
    .map((id) => LAUNCH_SITES[id])
    .filter(Boolean);
  if (sites.length === 0) return null;
  const lat = sites.reduce((sum, s) => sum + s.lat, 0) / sites.length;
  const lng = sites.reduce((sum, s) => sum + s.lng, 0) / sites.length;
  return { lat, lng };
}

// ── Stage separation & booster return ───────────────────────
/** Fraction along the main arc where first-stage separation occurs */
export const STAGING_PROGRESS = 0.35;

/** Known drone ship / landing zone coordinates */
export const DRONE_SHIP_COORDS = {
  // ── Atlantic (Florida / Cape Canaveral operations) ──
  OCISLY: { lat: 28.4, lng: -76.0 }, // Of Course I Still Love You — Atlantic (retired ~2023)
  ASOG: { lat: 28.8, lng: -75.5 }, // A Shortfall of Gravitas — Atlantic (primary East Coast ship since 2021)
  // ── Pacific (Vandenberg operations) ──
  JRTI: { lat: 32.5, lng: -118.5 }, // Just Read the Instructions — Pacific (relocated from Atlantic ~2024)
  // ── RTLS Landing Zones ──
  LZ1: { lat: 28.485, lng: -80.544 }, // Landing Zone 1 — Cape Canaveral RTLS
  LZ2: { lat: 28.485, lng: -80.54 }, // Landing Zone 2 — Cape Canaveral RTLS
  LZ4: { lat: 34.633, lng: -120.615 }, // Landing Zone 4 — Vandenberg RTLS
  // ── Starbase ──
  STARBASE_CATCH: { lat: 25.9972, lng: -97.156 }, // Mechazilla catch tower — Boca Chica
};

// ── Earth textures — progressive loading ────────────────────
export const EARTH_TEXTURES = {
  /** Fast-loading 2K texture for initial render */
  LOW_RES: "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
  /** High-res 5400x2700 texture loaded in background (local copy to avoid CORS) */
  HIGH_RES: "/textures/earth-hires.jpg",
} as const;
