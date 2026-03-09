#!/usr/bin/env node

/**
 * SpaceX Launch Ingestion Script
 *
 * Fetches all launches from the SpaceX v5 API, cross-references with
 * launchpads, landpads, rockets, cores, and payloads, then normalizes
 * every launch into a rich, consistent shape for the globe visualization.
 *
 * Usage:  node scripts/ingest-launches.mjs
 * Output: scripts/output/api_launches.json
 *         scripts/output/api_summary.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");

// ─── API endpoints ───────────────────────────────────────────────────────────

const ENDPOINTS = {
  launches: "https://api.spacexdata.com/v5/launches",
  launchpads: "https://api.spacexdata.com/v4/launchpads",
  landpads: "https://api.spacexdata.com/v4/landpads",
  rockets: "https://api.spacexdata.com/v4/rockets",
  cores: "https://api.spacexdata.com/v4/cores",
  payloads: "https://api.spacexdata.com/v4/payloads",
};

// ─── Static lookup maps ──────────────────────────────────────────────────────

const ROCKET_MAP = {
  "5e9d0d95eda69955f709d1eb": { name: "Falcon 1", family: "falcon1" },
  "5e9d0d95eda69973a809d1ec": { name: "Falcon 9", family: "falcon9" },
  "5e9d0d95eda69974db09d1ed": { name: "Falcon Heavy", family: "falconheavy" },
  "5e9d0d96eda699382d09d1ee": { name: "Starship", family: "starship" },
};

const LAUNCHPAD_MAP = {
  "5e9e4501f5090910d4566f83": {
    id: "kwajalein",
    name: "Kwajalein Atoll",
    fullName: "Kwajalein Atoll Omelek Island",
    lat: 9.0477,
    lng: 167.7431,
  },
  "5e9e4501f509094ba4566f84": {
    id: "cape-canaveral-slc40",
    name: "CCAFS SLC-40",
    fullName: "Cape Canaveral Space Force Station Space Launch Complex 40",
    lat: 28.5618,
    lng: -80.577,
  },
  "5e9e4502f5090927f8566f85": {
    id: "boca-chica",
    name: "Starbase",
    fullName: "SpaceX Starbase, Boca Chica TX",
    lat: 25.9972,
    lng: -97.156,
  },
  "5e9e4502f5090995de566f86": {
    id: "kwajalein",
    name: "Kwajalein Atoll",
    fullName: "Kwajalein Atoll Omelek Island",
    lat: 9.0477,
    lng: 167.7431,
  },
  "5e9e4502f509092b78566f87": {
    id: "vandenberg-slc4e",
    name: "VAFB SLC-4E",
    fullName: "Vandenberg Space Force Base Space Launch Complex 4E",
    lat: 34.632,
    lng: -120.611,
  },
  "5e9e4502f509094188566f88": {
    id: "ksc-lc39a",
    name: "KSC LC-39A",
    fullName: "Kennedy Space Center Launch Complex 39A",
    lat: 28.608,
    lng: -80.604,
  },
};

const LANDPAD_MAP = {
  "5e9e3032383ecb267a34e7c7": {
    name: "LZ-1",
    type: "RTLS",
    lat: 28.485,
    lng: -80.544,
  },
  "5e9e3032383ecb90a834e7c8": {
    name: "LZ-2",
    type: "RTLS",
    lat: 28.485,
    lng: -80.544,
  },
  "5e9e3032383ecb554034e7c9": {
    name: "LZ-4",
    type: "RTLS",
    lat: 34.632,
    lng: -120.615,
  },
  "5e9e3032383ecb6bb234e7ca": {
    name: "OCISLY",
    type: "ASDS",
    lat: 33.729,
    lng: -118.262,
  },
  "5e9e3032383ecb761634e7cb": {
    name: "JRTI-1",
    type: "ASDS",
    lat: null,
    lng: null,
  },
  "5e9e3033383ecbb9e534e7cc": {
    name: "JRTI",
    type: "ASDS",
    lat: 28.41,
    lng: -80.618,
  },
  "5e9e3033383ecb075134e7cd": {
    name: "ASOG",
    type: "ASDS",
    lat: 33.729,
    lng: -118.262,
  },
};

// ─── Failure enrichment seed data ────────────────────────────────────────────

const FAILURE_SEED = [
  {
    launch_id: "falcon1-flight-1",
    family: "falcon1",
    failure_category: "engine_failure",
    failure_summary:
      "Engine fire during first Falcon 1 launch led to mission failure.",
    exploded: false,
    explosion_phase: null,
    launch_status: "failure",
  },
  {
    launch_id: "falcon1-flight-2",
    family: "falcon1",
    failure_category: "propulsion_anomaly",
    failure_summary:
      "Second Falcon 1 launch failed before reaching orbit.",
    exploded: false,
    explosion_phase: null,
    launch_status: "failure",
  },
  {
    launch_id: "falcon1-flight-3",
    family: "falcon1",
    failure_category: "stage_separation_failure",
    failure_summary:
      "Residual thrust caused stage recontact after separation, leading to mission loss.",
    exploded: false,
    explosion_phase: null,
    launch_status: "failure",
  },
  {
    launch_id: "falcon9-crs7",
    family: "falcon9",
    failure_category: "structural_failure",
    failure_summary:
      "Falcon 9 broke up in flight during the CRS-7 mission.",
    exploded: true,
    explosion_phase: "in_flight",
    launch_status: "failure",
  },
  {
    launch_id: "falcon9-amos6",
    family: "falcon9",
    failure_category: "static_fire_anomaly",
    failure_summary:
      "Vehicle and payload destroyed on pad during fueling before planned static fire test.",
    exploded: true,
    explosion_phase: "pad_static_fire_prep",
    launch_status: "prelaunch_failure",
  },
  {
    launch_id: "falcon9-crs1",
    family: "falcon9",
    failure_category: "engine_failure",
    failure_summary:
      "Primary Dragon cargo mission succeeded, but secondary payload did not reach intended orbit.",
    exploded: false,
    explosion_phase: null,
    launch_status: "partial_failure",
  },
];

/**
 * Match a launch name to a failure seed entry.
 * Returns the matching seed or null.
 */
function matchFailureSeed(launchName) {
  const n = launchName.toLowerCase();
  if (n.includes("falconsat")) return FAILURE_SEED[0]; // flight 1
  if (n.includes("demosat")) return FAILURE_SEED[1]; // flight 2
  if (n.includes("trailblazer")) return FAILURE_SEED[2]; // flight 3
  if (/\bcrs-7\b/i.test(launchName)) return FAILURE_SEED[3];
  if (/\bamos-6\b/i.test(launchName)) return FAILURE_SEED[4];
  // CRS-1 specifically (not CRS-10, CRS-11, etc.)
  if (/\bCRS-1\b/.test(launchName) && !/CRS-1\d/.test(launchName))
    return FAILURE_SEED[5];
  return null;
}

// ─── Fetch helper with retries ───────────────────────────────────────────────

async function fetchJSON(url, label, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(
        `  [attempt ${attempt}/${retries}] Failed to fetch ${label}: ${err.message}`
      );
      if (attempt === retries) {
        throw new Error(
          `Failed to fetch ${label} after ${retries} attempts: ${err.message}`
        );
      }
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

// ─── Vehicle variant logic ───────────────────────────────────────────────────

function deriveVehicleVariant(family, flightNumber) {
  switch (family) {
    case "falcon1":
      return "v1.0";
    case "falcon9":
      if (flightNumber >= 36) return "Block 5";
      if (flightNumber >= 21) return "FT";
      if (flightNumber >= 6) return "v1.1";
      return "v1.0";
    case "falconheavy":
      return "Block 5";
    case "starship":
      return null;
    default:
      return null;
  }
}

// ─── Trajectory inference ────────────────────────────────────────────────────

function inferTrajectory(siteId, orbit, inclinationDeg) {
  const inc = inclinationDeg ?? null;

  // Cape Canaveral / KSC
  if (
    siteId === "cape-canaveral-slc40" ||
    siteId === "ksc-lc39a"
  ) {
    if (orbit === "ISS" || (orbit === "LEO" && inc !== null && Math.abs(inc - 51.6) < 2)) {
      return {
        method: "orbit+site",
        heading_deg: 45,
        direction_label: "NE",
        confidence: "high",
        notes: "ISS / 51.6 deg inclination from Cape",
      };
    }
    if (orbit === "SSO" || orbit === "PO") {
      return {
        method: "orbit+site",
        heading_deg: 180,
        direction_label: "S",
        confidence: "medium",
        notes: "SSO/Polar from Cape Canaveral (uncommon)",
      };
    }
    if (orbit === "GTO" || orbit === "GEO") {
      return {
        method: "orbit+site",
        heading_deg: 90,
        direction_label: "E",
        confidence: "high",
        notes: "GTO/GEO equatorial launch from Cape",
      };
    }
    // Starlink shells by inclination
    if (inc !== null && Math.abs(inc - 43) < 2) {
      return {
        method: "orbit+inclination",
        heading_deg: 43,
        direction_label: "NE",
        confidence: "high",
        notes: "Starlink 43 deg shell from Cape",
      };
    }
    if (inc !== null && Math.abs(inc - 53) < 2) {
      return {
        method: "orbit+inclination",
        heading_deg: 53,
        direction_label: "NE",
        confidence: "high",
        notes: "Starlink 53 deg shell from Cape",
      };
    }
    if (inc !== null && Math.abs(inc - 70) < 5) {
      return {
        method: "orbit+inclination",
        heading_deg: 70,
        direction_label: "ENE",
        confidence: "medium",
        notes: "Starlink 70 deg shell from Cape",
      };
    }
    // Default LEO from Cape
    return {
      method: "site_default",
      heading_deg: 50,
      direction_label: "NE",
      confidence: "medium",
      notes: "Default LEO launch heading from Cape Canaveral",
    };
  }

  // Vandenberg
  if (siteId === "vandenberg-slc4e") {
    if (orbit === "SSO" || orbit === "PO") {
      return {
        method: "orbit+site",
        heading_deg: 196,
        direction_label: "SSW",
        confidence: "high",
        notes: "SSO/Polar from Vandenberg",
      };
    }
    if (
      inc !== null &&
      (Math.abs(inc - 70) < 5 || Math.abs(inc - 97.4) < 3)
    ) {
      return {
        method: "orbit+inclination",
        heading_deg: 196,
        direction_label: "SSW",
        confidence: "high",
        notes: "Starlink high-inclination shell from Vandenberg",
      };
    }
    return {
      method: "site_default",
      heading_deg: 196,
      direction_label: "SSW",
      confidence: "medium",
      notes: "Default launch heading from Vandenberg",
    };
  }

  // Boca Chica
  if (siteId === "boca-chica") {
    return {
      method: "site_default",
      heading_deg: 97,
      direction_label: "E",
      confidence: "medium",
      notes: "Starship suborbital/orbital test from Boca Chica",
    };
  }

  // Kwajalein
  if (siteId === "kwajalein") {
    return {
      method: "site_default",
      heading_deg: 185,
      direction_label: "S",
      confidence: "low",
      notes: "Early Falcon 1 launch from Kwajalein Atoll",
    };
  }

  // Unknown site
  return {
    method: "unknown",
    heading_deg: null,
    direction_label: null,
    confidence: "none",
    notes: "Unknown launch site — no trajectory inference available",
  };
}

// ─── Build index maps from API arrays ────────────────────────────────────────

function buildLookup(arr) {
  const map = new Map();
  for (const item of arr) {
    map.set(item.id, item);
  }
  return map;
}

// ─── Family flight number tracker ────────────────────────────────────────────

function buildFamilyFlightCounters(launches, getRocket) {
  // Sort by date to assign sequential numbers
  const sorted = [...launches].sort(
    (a, b) => (a.date_unix ?? 0) - (b.date_unix ?? 0)
  );
  const counters = { falcon1: 0, falcon9: 0, falconheavy: 0, starship: 0 };
  const map = new Map();

  for (const launch of sorted) {
    const rocketInfo = ROCKET_MAP[launch.rocket];
    if (!rocketInfo) continue;
    const family = rocketInfo.family;
    counters[family]++;

    const prefixMap = {
      falcon1: "F1",
      falcon9: "F9",
      falconheavy: "FH",
      starship: "SS",
    };
    map.set(launch.id, `${prefixMap[family]}-${counters[family]}`);
  }
  return map;
}

// ─── Derive launch status ────────────────────────────────────────────────────

function deriveLaunchStatus(launch, failureSeed) {
  if (failureSeed?.launch_status) return failureSeed.launch_status;
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  if (launch.success === false) return "failure";
  return "upcoming";
}

// ─── Derive high-level status ────────────────────────────────────────────────

function deriveStatus(launch) {
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  return "failure";
}

// ─── Normalize a single launch ───────────────────────────────────────────────

function normalizeLaunch(
  launch,
  payloadsMap,
  coresMap,
  familyFlightMap
) {
  const rocketInfo = ROCKET_MAP[launch.rocket] ?? {
    name: "Unknown",
    family: "unknown",
  };
  const launchSite = LAUNCHPAD_MAP[launch.launchpad] ?? {
    id: "unknown",
    name: "Unknown",
    fullName: "Unknown",
    lat: null,
    lng: null,
  };

  const family = rocketInfo.family;
  const flightNumber = launch.flight_number;
  const familyFlightNumber = familyFlightMap.get(launch.id) ?? `?-${flightNumber}`;
  const vehicleVariant = deriveVehicleVariant(family, flightNumber);

  // Failure enrichment
  const failureSeed = matchFailureSeed(launch.name);
  const launchStatus = deriveLaunchStatus(launch, failureSeed);
  const status = deriveStatus(launch);

  // Resolve payloads
  const payloadIds = launch.payloads ?? [];
  const resolvedPayloads = payloadIds
    .map((pid) => payloadsMap.get(pid))
    .filter(Boolean);

  const firstPayload = resolvedPayloads[0] ?? null;
  const payloadOrbit = firstPayload?.orbit ?? null;
  const inclinationDeg = firstPayload?.inclination_deg ?? null;

  // Payload outcome
  let payloadOutcome = null;
  if (launch.upcoming) {
    payloadOutcome = null;
  } else if (launch.success === true) {
    payloadOutcome = "deployed";
  } else if (launch.success === false) {
    payloadOutcome = "lost";
  }
  if (failureSeed?.launch_status === "partial_failure") {
    payloadOutcome = "partial";
  }

  // Resolve cores
  const coresData = (launch.cores ?? []).map((c) => {
    const coreDetail = c.core ? coresMap.get(c.core) : null;
    const landpadInfo = c.landpad ? LANDPAD_MAP[c.landpad] : null;

    return {
      core_serial: coreDetail?.serial ?? null,
      core_flight_number: c.flight ?? null,
      reused: c.reused ?? false,
      landing_attempt: c.landing_attempt ?? false,
      landing_success: c.landing_success ?? null,
      landing_type: c.landing_type ?? null,
      landing_pad: landpadInfo?.name ?? null,
    };
  });

  // Booster recovery outcome
  let boosterRecoveryOutcome = null;
  const landingAttempted = coresData.some((c) => c.landing_attempt);
  const landingSuccess = coresData.some((c) => c.landing_success === true)
    ? true
    : landingAttempted
      ? false
      : null;

  if (landingAttempted) {
    const successCount = coresData.filter(
      (c) => c.landing_success === true
    ).length;
    const attemptCount = coresData.filter((c) => c.landing_attempt).length;
    if (successCount === attemptCount) {
      boosterRecoveryOutcome = "success";
    } else if (successCount > 0) {
      boosterRecoveryOutcome = "partial";
    } else {
      boosterRecoveryOutcome = "failure";
    }
  }

  // Landing mode (primary core)
  let landingMode = null;
  let landingZone = null;
  const primaryCore = coresData[0];
  if (primaryCore?.landing_attempt) {
    landingMode = primaryCore.landing_type ?? null;
    landingZone = primaryCore.landing_pad ?? null;
  }

  // Derived flags
  const isCrewed = Array.isArray(launch.crew) && launch.crew.length > 0;
  const isStarlink = launch.name.includes("Starlink");
  const isReusableLaunch = coresData.some((c) => c.reused);
  const firstStageRecovered = coresData.some(
    (c) => c.landing_success === true
  );
  const vehicleLost = launch.success === false && !launch.upcoming;
  const testFlight =
    /test flight/i.test(launch.name) ||
    /\bdemo\b/i.test(launch.name) ||
    family === "falcon1";

  // Failure fields
  const failureCategory = failureSeed?.failure_category ?? null;
  const failureSummary = failureSeed?.failure_summary ?? null;
  const exploded = failureSeed?.exploded ?? false;
  const explosionPhase = failureSeed?.explosion_phase ?? null;

  // Mission patch — prefer small patch
  const missionPatch =
    launch.links?.patch?.small ?? launch.links?.patch?.large ?? null;

  // URLs
  const webcastUrl = launch.links?.webcast ?? null;
  const articleUrl = launch.links?.article ?? null;
  const wikipediaUrl = launch.links?.wikipedia ?? null;
  const sourceUrls = [webcastUrl, articleUrl, wikipediaUrl].filter(Boolean);

  // Trajectory inference
  const trajectoryInference = inferTrajectory(
    launchSite.id,
    payloadOrbit,
    inclinationDeg
  );

  return {
    id: launch.id,
    name: launch.name,
    dateUtc: launch.date_utc,
    dateUnix: launch.date_unix,
    launchSite: {
      id: launchSite.id,
      name: launchSite.name,
      fullName: launchSite.fullName,
      lat: launchSite.lat,
      lng: launchSite.lng,
    },
    status,
    rocketType: rocketInfo.name,
    family,
    vehicleVariant,
    flightNumber,
    familyFlightNumber,
    launchStatus,
    payloadOutcome,
    boosterRecoveryOutcome,
    failureCategory,
    failureSummary,
    exploded,
    explosionPhase,
    payloadOrbit,
    inclinationDeg,
    landingAttempted,
    landingSuccess,
    landingMode,
    landingZone,
    cores: coresData,
    isCrewed,
    isStarlink,
    isReusableLaunch,
    firstStageRecovered,
    vehicleLost,
    testFlight,
    missionPatch,
    details: launch.details ?? null,
    webcastUrl,
    articleUrl,
    wikipediaUrl,
    sourceUrls,
    trajectoryInference,
  };
}

// ─── Build summary stats ─────────────────────────────────────────────────────

function buildSummary(normalizedLaunches) {
  const total = normalizedLaunches.length;
  const byStatus = { success: 0, failure: 0, upcoming: 0 };
  const byFamily = { falcon1: 0, falcon9: 0, falconheavy: 0, starship: 0 };
  const byYear = {};
  const bySite = {};
  let landingsAttempted = 0;
  let landingsSucceeded = 0;
  let crewed = 0;
  let starlink = 0;
  let reusable = 0;
  let testFlights = 0;
  const orbitCounts = {};

  for (const l of normalizedLaunches) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    if (l.family in byFamily) byFamily[l.family]++;

    const year = new Date(l.dateUtc).getFullYear();
    byYear[year] = (byYear[year] ?? 0) + 1;

    bySite[l.launchSite.id] = (bySite[l.launchSite.id] ?? 0) + 1;

    if (l.landingAttempted) landingsAttempted++;
    if (l.landingSuccess) landingsSucceeded++;
    if (l.isCrewed) crewed++;
    if (l.isStarlink) starlink++;
    if (l.isReusableLaunch) reusable++;
    if (l.testFlight) testFlights++;

    if (l.payloadOrbit) {
      orbitCounts[l.payloadOrbit] =
        (orbitCounts[l.payloadOrbit] ?? 0) + 1;
    }
  }

  // Failure breakdown
  const failures = normalizedLaunches.filter(
    (l) =>
      l.launchStatus === "failure" ||
      l.launchStatus === "partial_failure" ||
      l.launchStatus === "prelaunch_failure"
  );
  const failureBreakdown = failures.map((l) => ({
    id: l.id,
    name: l.name,
    date: l.dateUtc,
    family: l.family,
    launchStatus: l.launchStatus,
    failureCategory: l.failureCategory,
    failureSummary: l.failureSummary,
    exploded: l.exploded,
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalLaunches: total,
    byStatus,
    byFamily,
    byYear,
    bySite,
    landingStats: {
      attempted: landingsAttempted,
      succeeded: landingsSucceeded,
      successRate:
        landingsAttempted > 0
          ? +(landingsSucceeded / landingsAttempted * 100).toFixed(1)
          : 0,
    },
    crewedMissions: crewed,
    starlinkMissions: starlink,
    reusableLaunches: reusable,
    testFlights,
    orbitDistribution: orbitCounts,
    failures: failureBreakdown,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = performance.now();
  console.log("=== SpaceX Launch Ingestion Script ===\n");

  // 1. Fetch all data in parallel
  console.log("[1/4] Fetching data from SpaceX API...");

  const fetchPromises = Object.entries(ENDPOINTS).map(
    async ([label, url]) => {
      console.log(`  -> ${label}: ${url}`);
      const data = await fetchJSON(url, label);
      console.log(`  <- ${label}: ${Array.isArray(data) ? data.length : 1} records`);
      return [label, data];
    }
  );

  const results = await Promise.all(fetchPromises);
  const datasets = Object.fromEntries(results);

  const launches = datasets.launches;
  const payloadsMap = buildLookup(datasets.payloads);
  const coresMap = buildLookup(datasets.cores);

  console.log(
    `\n  Total: ${launches.length} launches, ${datasets.payloads.length} payloads, ` +
      `${datasets.cores.length} cores, ${datasets.launchpads.length} launchpads, ` +
      `${datasets.landpads.length} landpads, ${datasets.rockets.length} rockets\n`
  );

  // 2. Build family flight number map
  console.log("[2/4] Computing family flight numbers...");
  const familyFlightMap = buildFamilyFlightCounters(launches);

  // 3. Normalize all launches
  console.log("[3/4] Normalizing launches...");

  const normalized = [];
  let successCount = 0;
  let failureCount = 0;
  let upcomingCount = 0;

  for (const launch of launches) {
    try {
      const norm = normalizeLaunch(
        launch,
        payloadsMap,
        coresMap,
        familyFlightMap
      );
      normalized.push(norm);

      if (norm.status === "success") successCount++;
      else if (norm.status === "failure") failureCount++;
      else upcomingCount++;
    } catch (err) {
      console.error(
        `  ERROR normalizing launch "${launch.name}" (${launch.id}): ${err.message}`
      );
    }
  }

  // Sort by date
  normalized.sort((a, b) => a.dateUnix - b.dateUnix);

  console.log(
    `  Normalized ${normalized.length}/${launches.length} launches ` +
      `(${successCount} success, ${failureCount} failure, ${upcomingCount} upcoming)\n`
  );

  // 4. Write output
  console.log("[4/4] Writing output files...");

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const launchesPath = resolve(OUTPUT_DIR, "api_launches.json");
  writeFileSync(launchesPath, JSON.stringify(normalized, null, 2), "utf-8");
  console.log(`  -> ${launchesPath} (${normalized.length} launches)`);

  const summary = buildSummary(normalized);
  const summaryPath = resolve(OUTPUT_DIR, "api_summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`  -> ${summaryPath}`);

  // Print quick summary
  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.log(`\n=== Done in ${elapsed}s ===`);
  console.log(`\nSummary:`);
  console.log(`  Total launches: ${summary.totalLaunches}`);
  console.log(
    `  By status:  success=${summary.byStatus.success}  failure=${summary.byStatus.failure}  upcoming=${summary.byStatus.upcoming}`
  );
  console.log(
    `  By family:  F1=${summary.byFamily.falcon1}  F9=${summary.byFamily.falcon9}  FH=${summary.byFamily.falconheavy}  SS=${summary.byFamily.starship}`
  );
  console.log(
    `  Landings:   ${summary.landingStats.succeeded}/${summary.landingStats.attempted} (${summary.landingStats.successRate}%)`
  );
  console.log(`  Crewed:     ${summary.crewedMissions}`);
  console.log(`  Starlink:   ${summary.starlinkMissions}`);
  console.log(`  Reusable:   ${summary.reusableLaunches}`);
  console.log(`  Test flights: ${summary.testFlights}`);
  console.log(`  Failures:   ${summary.failures.length}`);
  for (const f of summary.failures) {
    console.log(
      `    - ${f.name} [${f.family}] ${f.launchStatus}: ${f.failureCategory ?? "unknown category"}`
    );
  }
}

main().catch((err) => {
  console.error("\nFATAL ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
