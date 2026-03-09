# SpaceX Launch Database — Forensic Audit Report

**Date:** 2026-03-09
**Branch:** `feature/full-launch-database`
**Database:** 604 launches (F1=5, F9=576, FH=12, SS=11)

---

## CRITICAL: Droneship Coordinate Swap (336 launches affected)

The ASOG and OCISLY droneship coordinates are **systematically swapped** in the assembly pipeline:

| Droneship | Current Coords | Correct Coords | Coast |
|-----------|---------------|----------------|-------|
| ASOG (A Shortfall of Gravitas) | (33.2, -119.5) **PACIFIC** | ~(28-31, -74 to -77) **ATLANTIC** | Should be Atlantic |
| OCISLY (Of Course I Still Love You) | (28.4, -76.0) **ATLANTIC** | Retired/Atlantic OR should not be assigned to Vandenberg | Was Atlantic |
| JRTI (Just Read The Instructions) | (30.4, -74.0) **ATLANTIC** | ~(32.5, -118.5) **PACIFIC** for post-2020 | Relocated to Pacific |

**Impact:**
- 194 Florida launches with `landingZone: "ASOG"` have boosterReturn pointing to the Pacific off California
- 134 Vandenberg launches with `landingZone: "OCISLY"` have boosterReturn pointing to the Atlantic off Florida
- 8 Vandenberg launches with `landingZone: "JRTI"` have boosterReturn pointing to the Atlantic instead of Pacific

**Root cause:** The `LANDING_COORDS` table in `assemble-database.mjs` and `DRONE_SHIP_COORDS` in `constants.ts` have incorrect coordinates.

---

## HIGH: Missing Booster/Core Data (399 supplemental + 18 key launches)

- **All 399 supplemental launches (2023-2026):** `cores[]` is empty/undefined. No booster serials, reuse counts, per-core landing data.
- **All 11 Starship launches:** `cores[]` empty. No Super Heavy serial data.
- **7 of 12 Falcon Heavy launches:** `cores[]` empty (all supplemental-era FH missions).
- All supplemental launches depend entirely on top-level `landingZone`/`landingMode` for recovery data.

---

## HIGH: Starship Data Integrity

1. **Flight 5 (2024-10-13):** `boosterReturn.landingType` is `"expended"` with coords `(28.4, -76)`. **WRONG.** This was the historic first chopstick catch at Starbase. Should be `landingType: "catch"` with Starbase coords `(25.997, -97.156)`.
2. **Flights 4-8, 10-11:** All have `boosterReturn` with `landingType: "expended"` and Atlantic coords. Several of these should reflect actual booster catch/splashdown outcomes at Starbase.
3. **`explosionPhase`:** Uses `undefined` on all Starship failures instead of `null`. Inconsistent with Falcon failure records.
4. **No `shipRecoveryOutcome` distinction:** While the field exists, outcomes for Ship RUD vs controlled splashdown vs burn-through are not differentiated.

---

## MEDIUM: Failure Record Gaps

| Mission | Issue |
|---------|-------|
| AMOS-6 (Sep 2016) | Classified as `static_fire_anomaly`. Should be `prelaunch_failure`. The incident was during propellant loading, not during a static fire. |
| Starlink 3-1 v1.5 (Feb 2022) | Has `status: "failure"` but `failureCategory`, `explosionPhase`, `failureSummary` are all null. |
| Starlink 9-3 (Jul 2024) | Missing explosion phase detail. This was an upper stage engine failure leading to deorbit. |
| All Starship failures | `explosionPhase` is `undefined` instead of typed null or a real value. |

---

## MEDIUM: Trajectory Rendering Disconnects

1. **`trajectoryInference.heading_deg` is never used by the renderer.** The rendering engine in `trajectoryUtils.ts` independently recomputes azimuth from its own `ORBIT_INCLINATION` lookup table. The per-launch computed heading data is display-only.
2. **Default trajectory:** Launches missing `payloadOrbit` get inclination 28.5° and range 25°, producing a generic NE trajectory regardless of site.
3. **Fixed staging point:** All vehicles use `STAGING_PROGRESS = 0.35` regardless of mission profile. RTLS missions stage earlier; ASDS missions stage later.
4. **No failure trajectory termination:** Failed launches render the same complete trajectory arc as successes.

---

## MEDIUM: Falcon Heavy Rendering Deficiencies

1. **Single booster return arc:** Only one `boosterReturn` per launch. FH has 3 cores needing 3 separate return paths (2 RTLS + 1 ASDS typically).
2. **Side boosters never visually separate** in the 3D model.
3. **7 supplemental FH missions** have no `cores[]` data at all — no differentiation between center core and side boosters.

---

## LOW: Type System Weaknesses

- 16+ fields typed as bare `string` that should be union types (landingMode, landingZone, core_role, etc.)
- 6 simplistic booleans that should be richer enums (exploded, landingSuccess, etc.)
- Dual status system: `status` (3 values, required) vs `launchStatus` (7 values, optional)
- `lon` vs `lng` naming inconsistency between `TrajectoryControlPoint` and `LaunchSite`
- Mixed `snake_case` and `camelCase` in LaunchCore and LaunchPayload interfaces

---

## Records Requiring Immediate Correction

| Count | Category | Description |
|-------|----------|-------------|
| 194 | ASOG coords wrong | Florida launches with Pacific boosterReturn coords |
| 134 | OCISLY assigned to Vandenberg | Should be JRTI or LZ-4 |
| 8 | JRTI coords wrong | Vandenberg JRTI pointing to Atlantic |
| 11 | Starship boosterReturn | Wrong landingType/coords for catch/splashdown missions |
| 7 | FH missing cores | No per-core data for supplemental FH missions |
| 4 | Failure metadata gaps | Missing or incorrect failure classifications |
| 399 | Supplemental cores empty | No booster serial/reuse data for 2023-2026 |

**Total records needing correction: ~400+ out of 604 (66%)**
