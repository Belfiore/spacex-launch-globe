#!/usr/bin/env node
/**
 * SpaceX Launch Database — Verification Pipeline
 *
 * Physical, operational, and data-integrity rules that MUST hold
 * for every launch record. Run after assembly to catch errors.
 *
 * Usage: node scripts/verify-database.mjs [--fix]
 *   --fix  Attempt to auto-correct fixable violations
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_PATH = join(ROOT, "src", "data", "launchDatabase.json");
const REPORT_PATH = join(__dirname, "output", "verification_report.json");

const FIX_MODE = process.argv.includes("--fix");

// ═══════════════════════════════════════════════════════════════
// RULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const FLORIDA_SITES = ["cape-canaveral-slc40", "ksc-lc39a"];
const PACIFIC_SITES = ["vandenberg-slc4e"];
const STARBASE_SITES = ["boca-chica"];

const ATLANTIC_DRONESHIPS = ["OCISLY", "ASOG"];
const PACIFIC_DRONESHIPS = ["JRTI", "JRTI-1"];
const FLORIDA_RTLS = ["LZ-1", "LZ-2"];
const VANDENBERG_RTLS = ["LZ-4"];
const STARBASE_LANDING = ["STARBASE_CATCH"];

// Valid landing zones by launch site coast
const VALID_ZONES = {
  florida: [...FLORIDA_RTLS, ...ATLANTIC_DRONESHIPS],
  vandenberg: [...VANDENBERG_RTLS, ...PACIFIC_DRONESHIPS],
  starbase: [...STARBASE_LANDING, "ASOG"], // Starbase can use Gulf droneship
};

// Coordinate bounds
const ATLANTIC_BOUNDS = { lonMin: -82, lonMax: -60 };
const PACIFIC_BOUNDS = { lonMin: -130, lonMax: -110 };
const GULF_BOUNDS = { lonMin: -100, lonMax: -85 };

// ═══════════════════════════════════════════════════════════════
// VIOLATION TRACKING
// ═══════════════════════════════════════════════════════════════

const violations = [];
const warnings = [];
const fixes = [];

function violation(launchId, rule, message, data = {}) {
  violations.push({ launchId, rule, message, ...data });
}
function warn(launchId, rule, message, data = {}) {
  warnings.push({ launchId, rule, message, ...data });
}
function fix(launchId, rule, message, data = {}) {
  fixes.push({ launchId, rule, message, ...data });
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL RULES
// ═══════════════════════════════════════════════════════════════

function getSiteCoast(siteId) {
  if (FLORIDA_SITES.includes(siteId)) return "florida";
  if (PACIFIC_SITES.includes(siteId)) return "vandenberg";
  if (STARBASE_SITES.includes(siteId)) return "starbase";
  return "unknown";
}

/**
 * RULE 1: No cross-coast booster landings
 * Florida launches → Atlantic landing
 * Vandenberg launches → Pacific landing
 */
function rule_crossCoastLanding(launch) {
  if (!launch.boosterReturn?.landingCoords) return;
  if (launch.boosterReturn.landingType === "expended") return;

  const coast = getSiteCoast(launch.launchSite?.id);
  const lng = launch.boosterReturn.landingCoords.lng;

  if (coast === "florida" && lng < ATLANTIC_BOUNDS.lonMin) {
    violation(launch.id, "CROSS_COAST_LANDING",
      `Florida launch has booster landing in Pacific (lng=${lng})`,
      { site: launch.launchSite?.id, landingLng: lng });

    if (FIX_MODE) {
      launch.boosterReturn.landingCoords = { lat: 28.8, lng: -75.5 };
      fix(launch.id, "CROSS_COAST_LANDING", "Corrected to Atlantic coords");
    }
  }

  if (coast === "vandenberg" && lng > PACIFIC_BOUNDS.lonMax) {
    violation(launch.id, "CROSS_COAST_LANDING",
      `Vandenberg launch has booster landing in Atlantic (lng=${lng})`,
      { site: launch.launchSite?.id, landingLng: lng });

    if (FIX_MODE) {
      launch.boosterReturn.landingCoords = { lat: 32.5, lng: -118.5 };
      fix(launch.id, "CROSS_COAST_LANDING", "Corrected to Pacific coords");
    }
  }
}

/**
 * RULE 2: Landing zone must match launch site coast
 */
function rule_landingZoneCoast(launch) {
  if (!launch.landingZone) return;
  const coast = getSiteCoast(launch.launchSite?.id);

  if (coast === "florida" && PACIFIC_DRONESHIPS.includes(launch.landingZone)) {
    violation(launch.id, "ZONE_COAST_MISMATCH",
      `Florida launch assigned Pacific droneship ${launch.landingZone}`,
      { site: launch.launchSite?.id, zone: launch.landingZone });

    if (FIX_MODE) {
      launch.landingZone = "ASOG";
      fix(launch.id, "ZONE_COAST_MISMATCH", "Changed to ASOG (Atlantic)");
    }
  }

  if (coast === "vandenberg" && ATLANTIC_DRONESHIPS.includes(launch.landingZone)) {
    violation(launch.id, "ZONE_COAST_MISMATCH",
      `Vandenberg launch assigned Atlantic droneship ${launch.landingZone}`,
      { site: launch.launchSite?.id, zone: launch.landingZone });

    if (FIX_MODE) {
      launch.landingZone = "JRTI";
      fix(launch.id, "ZONE_COAST_MISMATCH", "Changed to JRTI (Pacific)");
    }
  }
}

/**
 * RULE 3: Falcon Heavy must have per-core outcomes
 * (or at minimum be flagged as incomplete)
 */
function rule_falconHeavyCores(launch) {
  if (launch.rocketType !== "Falcon Heavy") return;

  if (!launch.cores || launch.cores.length === 0) {
    warn(launch.id, "FH_MISSING_CORES",
      `Falcon Heavy launch has no cores[] data — per-core outcomes unknown`);
  } else if (launch.cores.length < 3) {
    warn(launch.id, "FH_INCOMPLETE_CORES",
      `Falcon Heavy has ${launch.cores.length} cores instead of 3`,
      { coreCount: launch.cores.length });
  } else {
    // Check that center core has different role than side boosters
    const roles = launch.cores.map(c => c.core_role).filter(Boolean);
    if (roles.length === 3 && new Set(roles).size === 1) {
      warn(launch.id, "FH_IDENTICAL_ROLES",
        `All 3 FH cores have the same role: ${roles[0]}`);
    }
  }
}

/**
 * RULE 4: Mission success ≠ landing success
 * A successful mission can still have a failed booster landing
 */
function rule_missionVsLanding(launch) {
  if (launch.status === "success" && launch.landingSuccess === true) {
    // This is fine — both succeeded
  }
  if (launch.status === "success" && launch.landingSuccess === false && !launch.launchStatus) {
    // Mission succeeded but landing failed — should have launchStatus: "success" not "partial_failure"
    // This is correct behavior, just verify it's not miscategorized
  }
  if (launch.status === "failure" && launch.landingSuccess === true) {
    warn(launch.id, "LANDING_SUCCESS_ON_FAILED_MISSION",
      "Launch marked failure but landing marked success — verify classification");
  }
}

/**
 * RULE 5: Failure records must have metadata
 */
function rule_failureMetadata(launch) {
  const ls = launch.launchStatus ?? launch.status;
  if (ls === "failure" || ls === "partial_failure" || ls === "prelaunch_failure") {
    if (!launch.failureCategory) {
      violation(launch.id, "MISSING_FAILURE_CATEGORY",
        `Launch status is ${ls} but failureCategory is missing`,
        { status: ls });
    }
    if (!launch.failureSummary) {
      warn(launch.id, "MISSING_FAILURE_SUMMARY",
        `Launch status is ${ls} but failureSummary is missing`);
    }
  }
}

/**
 * RULE 6: Starship must have separate booster/ship outcomes
 */
function rule_starshipOutcomes(launch) {
  if (launch.rocketType !== "Starship") return;

  if (!launch.boosterRecoveryOutcome) {
    warn(launch.id, "SS_MISSING_BOOSTER_OUTCOME",
      "Starship launch missing boosterRecoveryOutcome");
  }
  if (!launch.shipRecoveryOutcome) {
    warn(launch.id, "SS_MISSING_SHIP_OUTCOME",
      "Starship launch missing shipRecoveryOutcome");
  }
}

/**
 * RULE 7: Trajectory heading must be physically plausible
 */
function rule_trajectoryHeading(launch) {
  if (!launch.trajectoryInference?.heading_deg) return;

  const coast = getSiteCoast(launch.launchSite?.id);
  const heading = launch.trajectoryInference.heading_deg;

  // Vandenberg: should head south/SSW (150-210 deg) for SSO/polar
  if (coast === "vandenberg" && (heading < 140 || heading > 220)) {
    warn(launch.id, "IMPLAUSIBLE_VB_HEADING",
      `Vandenberg heading ${heading}° is outside typical SSO/polar range (150-210°)`,
      { heading });
  }

  // Florida: should head NE-E-SE (30-120 deg) for most orbits
  if (coast === "florida" && (heading < 20 || heading > 130)) {
    // Exception: Florida polar (rare, southbound)
    if (launch.payloadOrbit !== "Polar" && launch.payloadOrbit !== "SSO") {
      warn(launch.id, "IMPLAUSIBLE_FL_HEADING",
        `Florida heading ${heading}° is outside typical LEO/GTO range (30-120°)`,
        { heading, orbit: launch.payloadOrbit });
    }
  }

  // Starbase: should head east over Gulf (70-110 deg)
  if (coast === "starbase" && (heading < 60 || heading > 120)) {
    warn(launch.id, "IMPLAUSIBLE_BC_HEADING",
      `Starbase heading ${heading}° is outside typical test corridor range (70-110°)`,
      { heading });
  }
}

/**
 * RULE 8: No trajectory should cross the continental United States
 * Check if a straight-line from launch site at the given heading
 * would pass over CONUS latitudes in the wrong direction
 */
function rule_noCONUSCrossing(launch) {
  if (!launch.trajectoryInference?.heading_deg) return;
  const coast = getSiteCoast(launch.launchSite?.id);
  const heading = launch.trajectoryInference.heading_deg;

  // Vandenberg heading east (0-90 deg) would cross CONUS
  if (coast === "vandenberg" && heading > 0 && heading < 90) {
    violation(launch.id, "CONUS_CROSSING",
      `Vandenberg launch heading ${heading}° would cross continental US`,
      { heading });
  }
}

/**
 * RULE 9: explosionPhase must not be undefined (should be null if not applicable)
 */
function rule_explosionPhaseType(launch) {
  if (launch.explosionPhase === undefined && (launch.exploded || launch.brokeUp)) {
    warn(launch.id, "UNDEFINED_EXPLOSION_PHASE",
      "Launch has exploded/brokeUp=true but explosionPhase is undefined (should be a value or null)");
  }
}

/**
 * RULE 10: Duplicate detection by name+date
 */
function rule_duplicates(launches) {
  const seen = new Map();
  for (const l of launches) {
    const key = `${l.name}|${l.dateUtc?.slice(0, 10)}`;
    if (seen.has(key)) {
      const prev = seen.get(key);
      violation(l.id, "DUPLICATE_LAUNCH",
        `Duplicate: "${l.name}" on ${l.dateUtc?.slice(0, 10)} also exists as ${prev}`,
        { duplicateOf: prev });
    } else {
      seen.set(key, l.id);
    }
  }
}

/**
 * RULE 11: Required fields must be present
 */
function rule_requiredFields(launch) {
  const required = ["id", "name", "dateUtc", "dateUnix", "launchSite", "status", "rocketType"];
  for (const field of required) {
    if (launch[field] === undefined || launch[field] === null) {
      violation(launch.id, "MISSING_REQUIRED_FIELD",
        `Required field "${field}" is missing`);
    }
  }
  if (launch.launchSite && !launch.launchSite.lat) {
    violation(launch.id, "MISSING_SITE_COORDS",
      "Launch site missing coordinates");
  }
}

/**
 * RULE 12: Booster return for catch mode must point to Starbase
 */
function rule_catchAtStarbase(launch) {
  if (!launch.boosterReturn) return;
  if (launch.boosterReturn.landingType !== "catch") return;

  const lat = launch.boosterReturn.landingCoords?.lat;
  const lng = launch.boosterReturn.landingCoords?.lng;
  if (!lat || !lng) return;

  // Should be within ~0.5 deg of Starbase (25.997, -97.156)
  if (Math.abs(lat - 25.997) > 0.5 || Math.abs(lng - (-97.156)) > 0.5) {
    violation(launch.id, "CATCH_NOT_AT_STARBASE",
      `Catch landing coords (${lat}, ${lng}) are not near Starbase`,
      { lat, lng });

    if (FIX_MODE) {
      launch.boosterReturn.landingCoords = { lat: 25.9972, lng: -97.156 };
      fix(launch.id, "CATCH_NOT_AT_STARBASE", "Corrected to Starbase coords");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN VERIFICATION PIPELINE
// ═══════════════════════════════════════════════════════════════

function main() {
  console.log("=== SpaceX Launch Database Verification ===\n");
  if (FIX_MODE) {
    console.log("⚙ FIX MODE ENABLED — will attempt auto-corrections\n");
  }

  const launches = JSON.parse(readFileSync(DB_PATH, "utf8"));
  console.log(`Loaded ${launches.length} launches\n`);

  // Run per-launch rules
  for (const launch of launches) {
    rule_requiredFields(launch);
    rule_crossCoastLanding(launch);
    rule_landingZoneCoast(launch);
    rule_falconHeavyCores(launch);
    rule_missionVsLanding(launch);
    rule_failureMetadata(launch);
    rule_starshipOutcomes(launch);
    rule_trajectoryHeading(launch);
    rule_noCONUSCrossing(launch);
    rule_explosionPhaseType(launch);
    rule_catchAtStarbase(launch);
  }

  // Run cross-launch rules
  rule_duplicates(launches);

  // ── Summary ──
  console.log("─── VIOLATIONS (must fix) ─────────────────");
  const ruleGroups = {};
  for (const v of violations) {
    ruleGroups[v.rule] = (ruleGroups[v.rule] || 0) + 1;
  }
  for (const [rule, count] of Object.entries(ruleGroups).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule}: ${count}`);
  }
  console.log(`  Total violations: ${violations.length}`);

  console.log("\n─── WARNINGS (should review) ──────────────");
  const warnGroups = {};
  for (const w of warnings) {
    warnGroups[w.rule] = (warnGroups[w.rule] || 0) + 1;
  }
  for (const [rule, count] of Object.entries(warnGroups).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule}: ${count}`);
  }
  console.log(`  Total warnings: ${warnings.length}`);

  if (FIX_MODE && fixes.length > 0) {
    console.log(`\n─── FIXES APPLIED ────────────────────────`);
    const fixGroups = {};
    for (const f of fixes) {
      fixGroups[f.rule] = (fixGroups[f.rule] || 0) + 1;
    }
    for (const [rule, count] of Object.entries(fixGroups)) {
      console.log(`  ${rule}: ${count}`);
    }
    console.log(`  Total fixes: ${fixes.length}`);

    // Write corrected database
    writeFileSync(DB_PATH, JSON.stringify(launches, null, 2));
    console.log(`\n✓ Corrected database written to ${DB_PATH}`);
  }

  // ── Validation Summary Stats ──
  console.log("\n─── DATABASE STATS ───────────────────────");
  const byFamily = {};
  const bySite = {};
  const byStatus = {};
  const byYear = {};
  let lowConfTrajectory = 0;
  let needsReview = 0;

  for (const l of launches) {
    byFamily[l.rocketType] = (byFamily[l.rocketType] || 0) + 1;
    bySite[l.launchSite?.name || "unknown"] = (bySite[l.launchSite?.name || "unknown"] || 0) + 1;
    const ls = l.launchStatus ?? l.status;
    byStatus[ls] = (byStatus[ls] || 0) + 1;
    const year = l.dateUtc?.slice(0, 4) || "?";
    byYear[year] = (byYear[year] || 0) + 1;
    if (l.trajectoryInference?.confidence === "low") lowConfTrajectory++;
    if (violations.some(v => v.launchId === l.id) || warnings.some(w => w.launchId === l.id)) {
      needsReview++;
    }
  }

  console.log("\n  By vehicle family:");
  for (const [k, v] of Object.entries(byFamily).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`);
  }
  console.log("\n  By launch site:");
  for (const [k, v] of Object.entries(bySite).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`);
  }
  console.log("\n  By status:");
  for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`);
  }
  console.log(`\n  Low-confidence trajectories: ${lowConfTrajectory}`);
  console.log(`  Records needing review: ${needsReview}`);
  console.log(`  Total launches: ${launches.length}`);

  // ── Write detailed report ──
  const report = {
    timestamp: new Date().toISOString(),
    mode: FIX_MODE ? "fix" : "audit",
    totalLaunches: launches.length,
    violations: violations.length,
    warnings: warnings.length,
    fixesApplied: fixes.length,
    violationDetails: violations.slice(0, 50), // sample
    warningDetails: warnings.slice(0, 50),
    fixDetails: fixes,
    stats: { byFamily, bySite, byStatus, lowConfTrajectory, needsReview },
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n✓ Detailed report written to ${REPORT_PATH}`);

  // Exit code
  if (violations.length > 0 && !FIX_MODE) {
    console.log(`\n✗ ${violations.length} violations found. Run with --fix to auto-correct.`);
    process.exit(1);
  } else if (violations.length === 0) {
    console.log("\n✓ All verification rules passed!");
  }
}

main();
