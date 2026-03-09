#!/usr/bin/env node
/**
 * assemble-database.mjs
 *
 * Merges all data sources into the final launch database:
 *  1. API-normalized launches (from ingest-launches.mjs output)
 *  2. Supplemental 2023-2026 launches (hand-curated seed)
 *  3. Known failure enrichments
 *  4. Existing historical launch enrichments (flightHistory, boosterReturn)
 *
 * Outputs:
 *  - src/data/launchDatabase.json  (the comprehensive database)
 *  - scripts/output/data_quality_report.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────
function readJSON(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJSON(path, data) {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// ── Trajectory inference logic ───────────────────────────────
function inferTrajectory(launch) {
  const site = launch.launchSite?.id || "";
  const orbit = launch.payloadOrbit || "";
  const incl = launch.inclinationDeg;
  const family = launch.family || "";

  let heading_deg = 90;
  let direction_label = "E";
  let confidence = "low";
  let method = "mission_class_default";
  let notes = "";

  const isCapeCanaveral =
    site.includes("cape-canaveral") || site.includes("ksc");
  const isVandenberg = site.includes("vandenberg");
  const isBocaChica = site.includes("boca-chica");
  const isKwajalein = site.includes("kwajalein");

  if (isCapeCanaveral) {
    if (orbit === "ISS" || (incl && Math.abs(incl - 51.6) < 2)) {
      heading_deg = 45;
      direction_label = "NE";
      confidence = "high";
      method = "orbit_inclination";
      notes = "ISS rendezvous trajectory at 51.6 deg inclination";
    } else if (orbit === "SSO" || orbit === "Polar") {
      heading_deg = 180;
      direction_label = "S";
      confidence = "medium";
      method = "orbit_inclination";
      notes = "Sun-synchronous orbit from CC (rare)";
    } else if (orbit === "GTO" || orbit === "GEO" || orbit === "HEO") {
      heading_deg = 90;
      direction_label = "E";
      confidence = "high";
      method = "orbit_inclination";
      notes = "Geostationary transfer trajectory, due east";
    } else if (orbit === "Heliocentric" || orbit === "HCO") {
      heading_deg = 90;
      direction_label = "E";
      confidence = "medium";
      method = "orbit_inclination";
      notes = "Heliocentric / deep space trajectory";
    } else if (
      launch.isStarlink &&
      incl &&
      Math.abs(incl - 43) < 2
    ) {
      heading_deg = 43;
      direction_label = "NE";
      confidence = "high";
      method = "orbit_inclination";
      notes = "Starlink shell 1 at 43 deg inclination";
    } else if (
      launch.isStarlink &&
      incl &&
      Math.abs(incl - 53) < 2
    ) {
      heading_deg = 53;
      direction_label = "NE";
      confidence = "high";
      method = "orbit_inclination";
      notes = "Starlink shell at 53 deg inclination";
    } else if (launch.isStarlink) {
      heading_deg = 53;
      direction_label = "NE";
      confidence = "medium";
      method = "mission_class_default";
      notes = "Starlink mission from CC, assumed ~53 deg shell";
    } else if (orbit === "LEO") {
      heading_deg = 50;
      direction_label = "NE";
      confidence = "medium";
      method = "orbit_inclination";
      notes = "Generic LEO from Cape Canaveral";
    } else if (orbit === "MEO") {
      heading_deg = 55;
      direction_label = "NE";
      confidence = "medium";
      method = "orbit_inclination";
      notes = "Medium earth orbit from CC";
    } else {
      heading_deg = 50;
      direction_label = "NE";
      confidence = "low";
      method = "mission_class_default";
      notes = "Default CC trajectory (orbit unknown)";
    }
  } else if (isVandenberg) {
    if (orbit === "SSO" || orbit === "Polar") {
      heading_deg = 196;
      direction_label = "SSW";
      confidence = "high";
      method = "orbit_inclination";
      notes = "Sun-synchronous / polar orbit from Vandenberg";
    } else if (launch.isStarlink) {
      heading_deg = 196;
      direction_label = "SSW";
      confidence = "high";
      method = "orbit_inclination";
      notes = "Starlink mission from Vandenberg (70 deg shell)";
    } else {
      heading_deg = 196;
      direction_label = "SSW";
      confidence = "medium";
      method = "mission_class_default";
      notes = "Default Vandenberg trajectory (south)";
    }
  } else if (isBocaChica) {
    if (family === "starship") {
      heading_deg = 97;
      direction_label = "E";
      confidence = "medium";
      method = "mission_class_default";
      notes = "Starship test flight corridor over Gulf of Mexico";
    } else {
      heading_deg = 97;
      direction_label = "E";
      confidence = "low";
      method = "mission_class_default";
      notes = "Boca Chica launch, eastward over Gulf";
    }
  } else if (isKwajalein) {
    heading_deg = 185;
    direction_label = "S";
    confidence = "low";
    method = "mission_class_default";
    notes = "Falcon 1 from Kwajalein, assumed southward";
  }

  return {
    method,
    heading_deg,
    direction_label,
    confidence,
    notes,
  };
}

// ── Booster return inference ─────────────────────────────────
function inferBoosterReturn(launch) {
  if (!launch.landingAttempted) return null;
  if (launch.boosterReturn) return launch.boosterReturn; // already set

  const mode = launch.landingMode;
  const zone = launch.landingZone;
  const site = launch.launchSite?.id || "";

  if (!mode) return null;

  // Landing coordinates by zone name
  const LANDING_COORDS = {
    "LZ-1": { lat: 28.485, lng: -80.544 },
    "LZ-2": { lat: 28.485, lng: -80.544 },
    "LZ-4": { lat: 34.633, lng: -120.615 },
    OCISLY: { lat: 28.4, lng: -76.0 },
    "JRTI-1": { lat: 30.4, lng: -74.0 },
    JRTI: { lat: 30.4, lng: -74.0 },
    ASOG: { lat: 33.2, lng: -119.5 },
  };

  let coords = zone && LANDING_COORDS[zone];
  if (!coords) {
    // Default ASDS coords by launch site
    if (site.includes("vandenberg")) {
      coords = { lat: 33.2, lng: -119.5 };
    } else {
      coords = { lat: 28.4, lng: -76.0 };
    }
  }

  const landingType =
    mode === "RTLS" ? "RTLS" : mode === "ASDS" ? "ASDS" : "expended";

  return {
    landingType,
    landingCoords: coords,
  };
}

// ── Main assembly ────────────────────────────────────────────
function main() {
  console.log("=== SpaceX Launch Database Assembly ===\n");

  // 1. Load data sources
  const apiPath = join(__dirname, "output", "api_launches.json");
  const suppPath = join(__dirname, "supplemental_launches_2023_2026.json");
  const failuresPath = join(
    ROOT,
    "..",
    "Desktop",
    "Rocket_Manifest",
    "spacex_launch_database_package",
    "spacex_known_failures_seed.json"
  );

  let apiLaunches = [];
  let suppLaunches = [];
  let knownFailures = [];

  if (existsSync(apiPath)) {
    apiLaunches = readJSON(apiPath);
    console.log(`  API launches loaded: ${apiLaunches.length}`);
  } else {
    console.warn("  WARNING: No API launches found at " + apiPath);
    console.warn("  Run 'node scripts/ingest-launches.mjs' first");
  }

  if (existsSync(suppPath)) {
    suppLaunches = readJSON(suppPath);
    console.log(`  Supplemental launches loaded: ${suppLaunches.length}`);
  } else {
    console.warn("  WARNING: No supplemental data found at " + suppPath);
  }

  if (existsSync(failuresPath)) {
    knownFailures = readJSON(failuresPath);
    console.log(`  Known failures loaded: ${knownFailures.length}`);
  } else {
    console.warn("  No failures seed file found");
  }

  // 2. Merge — API launches first, then supplemental (no duplicates)
  const allById = new Map();

  for (const launch of apiLaunches) {
    allById.set(launch.id, launch);
  }

  let suppAdded = 0;
  let suppSkipped = 0;
  for (const launch of suppLaunches) {
    if (!allById.has(launch.id)) {
      allById.set(launch.id, launch);
      suppAdded++;
    } else {
      // Merge supplemental data into existing record (supplemental may have richer data)
      const existing = allById.get(launch.id);
      const merged = { ...existing };
      // Prefer supplemental for these fields if API is missing them
      if (!merged.details && launch.details) merged.details = launch.details;
      if (!merged.payloadOrbit && launch.payloadOrbit)
        merged.payloadOrbit = launch.payloadOrbit;
      if (!merged.failureCategory && launch.failureCategory)
        merged.failureCategory = launch.failureCategory;
      if (!merged.failureSummary && launch.failureSummary)
        merged.failureSummary = launch.failureSummary;
      if (!merged.boosterRecoveryOutcome && launch.boosterRecoveryOutcome)
        merged.boosterRecoveryOutcome = launch.boosterRecoveryOutcome;
      if (!merged.shipRecoveryOutcome && launch.shipRecoveryOutcome)
        merged.shipRecoveryOutcome = launch.shipRecoveryOutcome;
      allById.set(launch.id, merged);
      suppSkipped++;
    }
  }
  console.log(
    `  Supplemental: ${suppAdded} added, ${suppSkipped} merged into existing`
  );

  // 3. Enrich with known failures
  let failuresApplied = 0;
  for (const f of knownFailures) {
    // Try to match by launch_id pattern or name
    let target = null;
    for (const [, launch] of allById) {
      if (f.launch_id === "falcon1-flight-1" && launch.name?.includes("FalconSat")) target = launch;
      else if (f.launch_id === "falcon1-flight-2" && launch.name?.includes("DemoSat")) target = launch;
      else if (f.launch_id === "falcon1-flight-3" && launch.name?.includes("Trailblazer")) target = launch;
      else if (f.launch_id === "falcon9-crs1" && launch.name?.includes("CRS-1") && !launch.name?.includes("CRS-1 ") && launch.name !== "SpaceX CRS-10" && launch.name !== "SpaceX CRS-11" && launch.name !== "SpaceX CRS-12" && launch.name !== "SpaceX CRS-13" && launch.name !== "SpaceX CRS-14" && launch.name !== "SpaceX CRS-15" && launch.name !== "SpaceX CRS-16" && launch.name !== "SpaceX CRS-17" && launch.name !== "SpaceX CRS-18" && launch.name !== "SpaceX CRS-19") target = launch;
      else if (f.launch_id === "falcon9-crs7" && (launch.name?.includes("CRS-7") || launch.name === "SpaceX CRS-7")) target = launch;
      else if (f.launch_id === "falcon9-amos6" && launch.name?.includes("AMOS-6")) target = launch;
      else if (f.launch_id === "falcon9-starlink-group-9-3" && launch.name?.includes("Starlink Group 9-3")) target = launch;
      else if (f.launch_id === "starship-flight-8" && (launch.id === "starship-flight8" || launch.name === "Starship Flight 8")) target = launch;
      else if (f.launch_id === "starship-flight-9" && (launch.id === "starship-flight9" || launch.name === "Starship Flight 9")) target = launch;

      if (target) break;
    }

    if (target) {
      if (f.failure_category) target.failureCategory = f.failure_category;
      if (f.failure_summary) target.failureSummary = f.failure_summary;
      if (f.exploded) target.exploded = true;
      if (f.explosion_phase) target.explosionPhase = f.explosion_phase;
      if (f.launch_status === "partial_failure") {
        target.launchStatus = "partial_failure";
      }
      if (f.launch_status === "prelaunch_failure") {
        target.launchStatus = "prelaunch_failure";
        target.status = "failure";
      }
      if (f.booster_recovery_outcome)
        target.boosterRecoveryOutcome = f.booster_recovery_outcome;
      if (f.ship_recovery_outcome)
        target.shipRecoveryOutcome = f.ship_recovery_outcome;
      failuresApplied++;
    }
  }
  console.log(`  Failure enrichments applied: ${failuresApplied}`);

  // 4. Add trajectory inference and booster return for all
  let trajCount = 0;
  let brCount = 0;
  for (const [, launch] of allById) {
    if (!launch.trajectoryInference) {
      launch.trajectoryInference = inferTrajectory(launch);
      trajCount++;
    }
    if (!launch.boosterReturn && launch.landingAttempted) {
      const br = inferBoosterReturn(launch);
      if (br) {
        launch.boosterReturn = br;
        brCount++;
      }
    }
  }
  console.log(`  Trajectory inferred: ${trajCount}`);
  console.log(`  Booster return inferred: ${brCount}`);

  // 5. Sort by dateUnix
  const allLaunches = Array.from(allById.values()).sort(
    (a, b) => a.dateUnix - b.dateUnix
  );

  // Assign sequential global flight numbers
  let globalFlight = 0;
  for (const l of allLaunches) {
    if (l.status !== "upcoming" && l.status !== "scrubbed") {
      globalFlight++;
      if (!l.flightNumber) l.flightNumber = globalFlight;
    }
  }

  console.log(`\n  TOTAL LAUNCHES: ${allLaunches.length}`);

  // 6. Generate quality report
  const report = {
    totalLaunches: allLaunches.length,
    byFamily: {},
    byStatus: {},
    byYear: {},
    bySite: {},
    failures: [],
    missingTrajectory: [],
    missingOrbit: [],
    dataWarnings: [],
  };

  for (const l of allLaunches) {
    const fam = l.family || "unknown";
    const stat = l.launchStatus || l.status || "unknown";
    const year = new Date(l.dateUtc).getFullYear();
    const site = l.launchSite?.id || "unknown";

    report.byFamily[fam] = (report.byFamily[fam] || 0) + 1;
    report.byStatus[stat] = (report.byStatus[stat] || 0) + 1;
    report.byYear[year] = (report.byYear[year] || 0) + 1;
    report.bySite[site] = (report.bySite[site] || 0) + 1;

    if (stat === "failure" || stat === "partial_failure" || stat === "prelaunch_failure") {
      report.failures.push({
        id: l.id,
        name: l.name,
        date: l.dateUtc,
        family: fam,
        status: stat,
        failureCategory: l.failureCategory || "unclassified",
        failureSummary: l.failureSummary || "No summary",
      });
    }

    if (!l.trajectoryInference) {
      report.missingTrajectory.push(l.id);
    }

    if (!l.payloadOrbit && l.status !== "upcoming") {
      report.missingOrbit.push(l.id);
    }

    // Warn about suspicious data
    if (!l.dateUnix || !l.dateUtc) {
      report.dataWarnings.push(`${l.id}: missing date`);
    }
    if (!l.launchSite?.lat) {
      report.dataWarnings.push(`${l.id}: missing launch site coords`);
    }
  }

  console.log("\n  By Family:");
  for (const [k, v] of Object.entries(report.byFamily)) {
    console.log(`    ${k}: ${v}`);
  }
  console.log("\n  By Status:");
  for (const [k, v] of Object.entries(report.byStatus)) {
    console.log(`    ${k}: ${v}`);
  }
  console.log(`\n  Failures/anomalies: ${report.failures.length}`);
  console.log(`  Missing orbit data: ${report.missingOrbit.length}`);
  console.log(`  Data warnings: ${report.dataWarnings.length}`);

  // 7. Write outputs
  const dbPath = join(ROOT, "src", "data", "launchDatabase.json");
  const reportPath = join(__dirname, "output", "data_quality_report.json");

  writeJSON(dbPath, allLaunches);
  writeJSON(reportPath, report);

  console.log(`\n  Database written to: ${dbPath}`);
  console.log(`  Quality report: ${reportPath}`);
  console.log("\n=== Assembly complete ===");
}

main();
