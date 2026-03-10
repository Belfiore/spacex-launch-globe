/**
 * Launch Library 2 (LL2) Integration
 * https://ll.thespacedevs.com/2.2.0/
 *
 * Free tier: 15 requests/hour. We cache aggressively and batch requests.
 * Used as primary live data source for upcoming + recent SpaceX launches.
 */

import type { Launch, LaunchSite, LandingType, LaunchStatus, BoosterReturn, LaunchCore } from "./types";
import { LAUNCH_SITES, DRONE_SHIP_COORDS } from "./constants";

// ── LL2 API Types ──────────────────────────────────────────────

interface LL2Status {
  id: number;
  name: string;
  abbrev: string;
}

interface LL2Orbit {
  id: number;
  name: string;
  abbrev: string;
}

interface LL2Mission {
  id: number;
  name: string;
  description: string;
  type: string;
  orbit: LL2Orbit | null;
}

interface LL2RocketConfig {
  id: number;
  name: string;
  family: string;
  full_name: string;
  variant: string;
}

interface LL2Rocket {
  id: number;
  configuration: LL2RocketConfig;
}

interface LL2PadLocation {
  id: number;
  name: string;
  country_code: string;
}

interface LL2Pad {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  location: LL2PadLocation;
}

interface LL2LandingType {
  id: number;
  name: string;
  abbrev: string;
}

interface LL2LandingLocation {
  id: number;
  name: string;
  abbrev: string;
}

interface LL2Landing {
  id: number;
  attempt: boolean;
  success: boolean | null;
  description: string;
  downrange_distance: number | null;
  type: LL2LandingType | null;
  location: LL2LandingLocation | null;
}

interface LL2LauncherStage {
  id: number;
  type: string;
  reused: boolean | null;
  launcher_flight_number: number | null;
  launcher: {
    id: number;
    serial_number: string;
    flights: number;
  } | null;
  landing: LL2Landing | null;
  turn_around_time_days: number | null;
}

interface LL2Program {
  id: number;
  name: string;
  agencies: { name: string }[];
}

interface LL2Launch {
  id: string;
  url: string;
  slug: string;
  name: string;
  status: LL2Status;
  last_updated: string;
  net: string; // ISO 8601 launch time
  window_start: string;
  window_end: string;
  probability: number | null;
  holdreason: string;
  failreason: string;
  hashtag: string | null;
  launch_service_provider: {
    id: number;
    name: string;
    type: string;
  };
  rocket: LL2Rocket;
  mission: LL2Mission | null;
  pad: LL2Pad;
  webcast_live: boolean;
  image: string | null;
  program: LL2Program[];
  launcher_stage?: LL2LauncherStage[];
}

interface LL2Response {
  count: number;
  next: string | null;
  previous: string | null;
  results: LL2Launch[];
}

// ── Constants ──────────────────────────────────────────────────

const LL2_BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const SPACEX_PROVIDER_ID = 121; // SpaceX LSP ID in LL2

// LL2 pad ID → internal site key
const LL2_PAD_MAP: Record<number, string> = {
  80: "cape-canaveral-slc40", // SLC-40
  87: "ksc-lc39a",           // LC-39A
  16: "vandenberg-slc4e",    // SLC-4E
  188: "boca-chica",         // Orbital Launch Pad 1 (Starbase)
  235: "boca-chica",         // Orbital Launch Pad 2 (Starbase)
  187: "boca-chica",         // Suborbital Pad B (Starbase)
  111: "boca-chica",         // Suborbital Pad A (Starbase, demolished)
  143: "kwajalein",          // Omelek Island (Falcon 1)
};

// LL2 status ID → our status mapping
function mapLL2Status(status: LL2Status): { status: "upcoming" | "success" | "failure"; launchStatus: LaunchStatus } {
  switch (status.id) {
    case 3: // Launch Successful
      return { status: "success", launchStatus: "success" };
    case 4: // Launch Failure
      return { status: "failure", launchStatus: "failure" };
    case 7: // Partial Failure
      return { status: "failure", launchStatus: "partial_failure" };
    case 1: // Go for Launch
    case 2: // TBD
    case 6: // In Flight
    case 8: // TBC
      return { status: "upcoming", launchStatus: "upcoming" };
    case 5: // On Hold
      return { status: "upcoming", launchStatus: "scrubbed" };
    default:
      return { status: "upcoming", launchStatus: "unknown" };
  }
}

// LL2 rocket name → our rocket type
function mapRocketType(config: LL2RocketConfig): string {
  const name = config.name.toLowerCase();
  if (name.includes("falcon heavy")) return "Falcon Heavy";
  if (name.includes("falcon 9")) return "Falcon 9";
  if (name.includes("falcon 1")) return "Falcon 1";
  if (name.includes("starship")) return "Starship";
  // Use the config name directly as fallback
  return config.name;
}

// LL2 landing location abbrev → drone ship / landing zone coords
const LANDING_COORDS: Record<string, { lat: number; lng: number }> = {
  "ASOG": DRONE_SHIP_COORDS.ASOG,
  "OCISLY": DRONE_SHIP_COORDS.OCISLY,
  "JRTI": DRONE_SHIP_COORDS.JRTI,
  "LZ-1": DRONE_SHIP_COORDS.LZ1,
  "LZ-2": DRONE_SHIP_COORDS.LZ2,
  "LZ-4": DRONE_SHIP_COORDS.LZ4,
  // Starbase tower catch
  "OLP1": DRONE_SHIP_COORDS.STARBASE_CATCH,
  "OLP2": DRONE_SHIP_COORDS.STARBASE_CATCH,
};

function mapLandingType(ll2Type: LL2LandingType | null, locationAbbrev: string | null): LandingType {
  if (!ll2Type) return "expended";
  const abbrev = ll2Type.abbrev;
  if (abbrev === "ASDS") return "ASDS";
  if (abbrev === "RTLS") return "RTLS";
  if (locationAbbrev === "OLP1" || locationAbbrev === "OLP2") return "catch";
  if (abbrev === "Ocean" || abbrev === "ocean") return "ocean";
  return "expended";
}

function mapBoosterReturn(stage: LL2LauncherStage): BoosterReturn | null {
  const landing = stage.landing;
  if (!landing || !landing.attempt) return null;

  const locationAbbrev = landing.location?.abbrev ?? null;
  const landingType = mapLandingType(landing.type, locationAbbrev);

  if (landingType === "expended") return null;

  // Determine landing coordinates
  let coords = locationAbbrev ? LANDING_COORDS[locationAbbrev] : null;

  if (!coords) {
    // Fallback: estimate from downrange distance and pad location
    if (landing.type?.abbrev === "ASDS" && landing.downrange_distance) {
      // Generic Atlantic drone ship position (rough estimate)
      coords = DRONE_SHIP_COORDS.ASOG;
    } else if (landing.type?.abbrev === "RTLS") {
      // RTLS returns to near launch site — use LZ-1 as default for Cape
      coords = DRONE_SHIP_COORDS.LZ1;
    }
  }

  if (!coords) return null;

  return {
    landingType,
    landingCoords: { lat: coords.lat, lng: coords.lng },
  };
}

function getLaunchSite(pad: LL2Pad): LaunchSite {
  const siteKey = LL2_PAD_MAP[pad.id];
  if (siteKey && LAUNCH_SITES[siteKey]) {
    return LAUNCH_SITES[siteKey];
  }

  // Fallback: construct from pad data
  const lat = parseFloat(pad.latitude);
  const lng = parseFloat(pad.longitude);

  // Try to match by coordinates to known sites
  for (const [key, site] of Object.entries(LAUNCH_SITES)) {
    if (Math.abs(site.lat - lat) < 0.05 && Math.abs(site.lng - lng) < 0.05) {
      return LAUNCH_SITES[key];
    }
  }

  return {
    id: `ll2-pad-${pad.id}`,
    name: pad.name,
    fullName: `${pad.name}, ${pad.location.name}`,
    lat,
    lng,
  };
}

// ── Rate Limiting ──────────────────────────────────────────────

/**
 * Simple in-memory rate limiter for the free LL2 tier (15 req/hour).
 * Tracks request timestamps and delays if we're approaching the limit.
 */
const requestTimestamps: number[] = [];
const RATE_LIMIT = 14; // Stay below 15 to be safe
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();

  // Clean old timestamps
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_WINDOW_MS) {
    requestTimestamps.shift();
  }

  // Check if we're at the limit
  if (requestTimestamps.length >= RATE_LIMIT) {
    const oldestInWindow = requestTimestamps[0];
    const waitMs = RATE_WINDOW_MS - (now - oldestInWindow) + 1000;
    console.warn(`[LL2] Rate limit reached (${requestTimestamps.length}/${RATE_LIMIT}). Skipping request.`);
    throw new Error(`LL2 rate limit reached. Next window opens in ${Math.ceil(waitMs / 60000)} minutes.`);
  }

  requestTimestamps.push(Date.now());
  return fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    // Cache for 30 minutes on the client side
    next: { revalidate: 1800 },
  });
}

// ── Response Cache ─────────────────────────────────────────────

interface CacheEntry {
  data: Launch[];
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};

// Upcoming: refresh every 6 hours, Past: refresh every 24 hours
const CACHE_TTL_UPCOMING = 6 * 60 * 60 * 1000;
const CACHE_TTL_PAST = 24 * 60 * 60 * 1000;

function getCached(key: string, ttl: number): Launch[] | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) return null;
  return entry.data;
}

function setCache(key: string, data: Launch[]): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ── Core Mapping ───────────────────────────────────────────────

function mapLL2Launch(ll2: LL2Launch): Launch {
  const { status, launchStatus } = mapLL2Status(ll2.status);
  const dateUtc = ll2.net;
  const dateUnix = Math.floor(new Date(dateUtc).getTime() / 1000);
  const launchSite = getLaunchSite(ll2.pad);
  const rocketType = mapRocketType(ll2.rocket.configuration);

  // Extract mission name from the full LL2 name (format: "Rocket | Mission")
  const missionName = ll2.name.includes("|")
    ? ll2.name.split("|").slice(1).join("|").trim()
    : ll2.name;

  // Build cores data from launcher stages
  const cores: LaunchCore[] = (ll2.launcher_stage ?? []).map((stage, i) => {
    const landing = stage.landing;
    return {
      core_role: i === 0 ? "single" : `stage_${i + 1}`,
      core_serial: stage.launcher?.serial_number,
      core_flight_number: stage.launcher_flight_number ?? stage.launcher?.flights,
      reused: stage.reused ?? undefined,
      landing_attempt: landing?.attempt ?? false,
      landing_success: landing?.success ?? undefined,
      landing_type: landing?.type?.abbrev ?? undefined,
      landing_pad: landing?.location?.abbrev ?? undefined,
    };
  });

  // Extract booster return from first stage landing data
  let boosterReturn: BoosterReturn | undefined;
  if (ll2.launcher_stage && ll2.launcher_stage.length > 0) {
    const firstStage = ll2.launcher_stage[0];
    const br = mapBoosterReturn(firstStage);
    if (br) boosterReturn = br;
  }

  // Determine if it's a Starlink mission
  const isStarlink = ll2.program.some((p) => p.name.toLowerCase().includes("starlink"))
    || missionName.toLowerCase().includes("starlink");

  const launch: Launch = {
    id: ll2.id,
    name: missionName,
    dateUtc,
    dateUnix,
    launchSite,
    status,
    rocketType,

    // Extended fields
    launchStatus,
    vehicleVariant: ll2.rocket.configuration.variant || undefined,
    family: rocketType === "Falcon 9" ? "falcon9"
      : rocketType === "Falcon Heavy" ? "falconheavy"
      : rocketType === "Starship" ? "starship"
      : rocketType === "Falcon 1" ? "falcon1"
      : undefined,

    // Mission / orbit
    payloadOrbit: ll2.mission?.orbit?.abbrev ?? undefined,
    details: ll2.mission?.description ?? undefined,

    // Landing
    landingAttempted: cores.length > 0 ? cores[0].landing_attempt : undefined,
    landingSuccess: cores.length > 0 ? cores[0].landing_success : undefined,
    landingMode: cores.length > 0 ? cores[0].landing_type : undefined,
    landingZone: cores.length > 0 ? cores[0].landing_pad : undefined,

    // Rich data
    cores: cores.length > 0 ? cores : undefined,
    boosterReturn,

    // UI flags
    isStarlink,
    isCrewed: ll2.mission?.type === "Human Exploration" || undefined,
    isReusableLaunch: cores.some((c) => c.reused) || undefined,

    // Links
    missionPatch: ll2.image ?? undefined,

    // Failure info
    failureSummary: ll2.failreason || undefined,
  };

  return launch;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Fetch upcoming SpaceX launches from Launch Library 2.
 * Returns up to 30 upcoming launches. Cached for 6 hours.
 */
export async function fetchLL2Upcoming(): Promise<Launch[]> {
  const cached = getCached("upcoming", CACHE_TTL_UPCOMING);
  if (cached) {
    console.log(`[LL2] Using cached upcoming data (${cached.length} launches)`);
    return cached;
  }

  try {
    const url = `${LL2_BASE_URL}/launch/upcoming/?lsp__ids=${SPACEX_PROVIDER_ID}&limit=30&mode=detailed&format=json`;
    const res = await rateLimitedFetch(url);
    if (!res.ok) throw new Error(`LL2 API error: ${res.status}`);

    const data: LL2Response = await res.json();
    const launches = data.results.map(mapLL2Launch);

    setCache("upcoming", launches);
    console.log(`[LL2] Fetched ${launches.length} upcoming launches`);
    return launches;
  } catch (err) {
    console.warn("[LL2] Failed to fetch upcoming launches:", err);
    return [];
  }
}

/**
 * Fetch recent past SpaceX launches from Launch Library 2.
 * Gets last 50 launches. Cached for 24 hours.
 */
export async function fetchLL2Recent(): Promise<Launch[]> {
  const cached = getCached("recent", CACHE_TTL_PAST);
  if (cached) {
    console.log(`[LL2] Using cached recent data (${cached.length} launches)`);
    return cached;
  }

  try {
    const url = `${LL2_BASE_URL}/launch/previous/?lsp__ids=${SPACEX_PROVIDER_ID}&limit=50&mode=detailed&format=json`;
    const res = await rateLimitedFetch(url);
    if (!res.ok) throw new Error(`LL2 API error: ${res.status}`);

    const data: LL2Response = await res.json();
    const launches = data.results.map(mapLL2Launch);

    setCache("recent", launches);
    console.log(`[LL2] Fetched ${launches.length} recent past launches`);
    return launches;
  } catch (err) {
    console.warn("[LL2] Failed to fetch recent launches:", err);
    return [];
  }
}

/**
 * Fetch a specific range of past SpaceX launches from LL2.
 * Useful for filling historical data gaps.
 * @param startDate ISO date string for range start
 * @param endDate ISO date string for range end
 */
export async function fetchLL2Range(startDate: string, endDate: string): Promise<Launch[]> {
  const cacheKey = `range-${startDate}-${endDate}`;
  const cached = getCached(cacheKey, CACHE_TTL_PAST);
  if (cached) {
    console.log(`[LL2] Using cached range data (${cached.length} launches)`);
    return cached;
  }

  try {
    const url = `${LL2_BASE_URL}/launch/?lsp__ids=${SPACEX_PROVIDER_ID}&net__gte=${startDate}&net__lte=${endDate}&limit=100&mode=detailed&format=json`;
    const res = await rateLimitedFetch(url);
    if (!res.ok) throw new Error(`LL2 API error: ${res.status}`);

    const data: LL2Response = await res.json();
    const launches = data.results.map(mapLL2Launch);

    setCache(cacheKey, launches);
    console.log(`[LL2] Fetched ${launches.length} launches for range ${startDate} to ${endDate}`);
    return launches;
  } catch (err) {
    console.warn("[LL2] Failed to fetch range:", err);
    return [];
  }
}

/**
 * Clear the in-memory cache. Useful for forcing a refresh.
 */
export function clearLL2Cache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
  console.log("[LL2] Cache cleared");
}
