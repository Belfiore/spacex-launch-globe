import * as THREE from "three";
import { latLngToVector3 } from "./coordUtils";
import { GLOBE } from "./constants";
import type { Launch } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Height multiplier by orbit type (fraction of GLOBE.RADIUS).
 */
const ORBIT_HEIGHTS: Record<string, number> = {
  LEO: 0.4,
  SSO: 0.5,
  MEO: 0.7,
  GTO: 1.0,
  GEO: 1.2,
  HEO: 1.1,
  "Sun-Synchronous": 0.5,
  ISS: 0.35,
  default: 0.6,
};

/**
 * Altitude in km for each orbit type — used for orbit ring radius.
 */
export const ORBIT_ALTITUDE_KM: Record<string, number> = {
  LEO: 400,
  ISS: 408,
  SSO: 550,
  MEO: 8000,
  GTO: 35786,
  GEO: 35786,
  HEO: 50000,
  default: 400,
};

/**
 * Typical orbital inclination (degrees) by orbit type.
 */
export const ORBIT_INCLINATION: Record<string, number> = {
  LEO: 51.6,
  ISS: 51.6,
  SSO: 97.0,
  MEO: 55.0,
  GTO: 27.0,
  GEO: 0.0,
  HEO: 63.4,
  default: 28.5,
};

/**
 * Visual arc range (degrees) by orbit type — how far the trajectory extends.
 */
const RANGE_DEG: Record<string, number> = {
  LEO: 25,
  ISS: 25,
  SSO: 30,
  MEO: 35,
  GTO: 40,
  GEO: 40,
  HEO: 35,
  default: 25,
};

// ── Azimuth & Endpoint Computation ──────────────────────────────

/**
 * Compute the real launch azimuth (radians, measured clockwise from north)
 * from orbital inclination and launch site latitude.
 *
 * Prograde (incl ≤ 90°):   azimuth = asin(cos(incl) / cos(lat))
 * Retrograde (incl > 90°): azimuth = π - asin(cos(π - incl) / cos(lat))
 */
export function computeLaunchAzimuth(
  siteLatDeg: number,
  orbitType: string
): number {
  const inclDeg =
    ORBIT_INCLINATION[orbitType] ?? ORBIT_INCLINATION["default"];
  const inclRad = inclDeg * DEG_TO_RAD;
  const latRad = siteLatDeg * DEG_TO_RAD;
  const cosLat = Math.cos(latRad);

  if (Math.abs(cosLat) < 1e-10) return Math.PI / 2; // Pole edge case → due east

  if (inclDeg <= 90) {
    // Prograde orbit
    const sinAz = Math.cos(inclRad) / cosLat;
    if (sinAz >= 1) return Math.PI / 2; // Clamp to due east
    if (sinAz <= -1) return -Math.PI / 2;
    return Math.asin(sinAz);
  } else {
    // Retrograde orbit (SSO, etc.)
    const effectiveIncl = Math.PI - inclRad;
    const sinAz = Math.cos(effectiveIncl) / cosLat;
    const clamped = Math.max(-1, Math.min(1, sinAz));
    return Math.PI - Math.asin(clamped);
  }
}

/**
 * Project a lat/lng along a bearing (azimuth) by a given angular distance
 * using the great-circle forward formula.
 */
export function computeTrajectoryEndpoint(
  latDeg: number,
  lngDeg: number,
  azimuthRad: number,
  rangeDeg: number
): { lat: number; lng: number } {
  const latRad = latDeg * DEG_TO_RAD;
  const rangeRad = rangeDeg * DEG_TO_RAD;

  const endLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(rangeRad) +
      Math.cos(latRad) * Math.sin(rangeRad) * Math.cos(azimuthRad)
  );

  const endLngRad =
    lngDeg * DEG_TO_RAD +
    Math.atan2(
      Math.sin(azimuthRad) * Math.sin(rangeRad) * Math.cos(latRad),
      Math.cos(rangeRad) - Math.sin(latRad) * Math.sin(endLatRad)
    );

  return {
    lat: endLatRad * RAD_TO_DEG,
    lng: endLngRad * RAD_TO_DEG,
  };
}

// ── Trajectory Arc Generation ───────────────────────────────────

/**
 * Generate a QuadraticBezierCurve3 for a launch trajectory.
 * Uses real launch azimuth computed from orbital inclination + site latitude.
 */
export function generateTrajectoryArcCurve(
  launch: Launch
): THREE.QuadraticBezierCurve3 {
  const { lat, lng } = launch.launchSite;
  const orbitType = launch.payloadOrbit ?? "default";
  const heightMult = ORBIT_HEIGHTS[orbitType] ?? ORBIT_HEIGHTS["default"];
  const maxHeight = GLOBE.RADIUS * heightMult;

  // Start position on globe surface
  const start = latLngToVector3(lat, lng, GLOBE.RADIUS);

  // End position — computed from real azimuth and orbit-specific range
  const azimuth = computeLaunchAzimuth(lat, orbitType);
  const rangeDeg = RANGE_DEG[orbitType] ?? RANGE_DEG["default"];
  const endCoords = computeTrajectoryEndpoint(lat, lng, azimuth, rangeDeg);
  const end = latLngToVector3(endCoords.lat, endCoords.lng, GLOBE.RADIUS);

  // Control point — midpoint raised above surface
  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(GLOBE.RADIUS + maxHeight);

  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

/**
 * Generate a booster return arc from the staging point back to the landing site.
 */
export function generateBoosterReturnArc(
  stagingPoint: THREE.Vector3,
  landingLat: number,
  landingLng: number
): THREE.QuadraticBezierCurve3 {
  const landingPos = latLngToVector3(landingLat, landingLng, GLOBE.RADIUS);

  // Control point: midway between staging and landing, at modest altitude
  const mid = new THREE.Vector3()
    .addVectors(stagingPoint, landingPos)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(GLOBE.RADIUS + 0.3);

  return new THREE.QuadraticBezierCurve3(stagingPoint.clone(), mid, landingPos);
}

/**
 * Generate a trajectory arc as an array of Vector3 points.
 * Uses real azimuth for direction. Kept for backward compatibility.
 */
export function generateTrajectoryArc(
  lat: number,
  lng: number,
  orbitType: string = "default",
  numPoints: number = 64
): THREE.Vector3[] {
  const heightMult = ORBIT_HEIGHTS[orbitType] ?? ORBIT_HEIGHTS["default"];
  const maxHeight = GLOBE.RADIUS * heightMult;

  const start = latLngToVector3(lat, lng, GLOBE.RADIUS);

  const azimuth = computeLaunchAzimuth(lat, orbitType);
  const rangeDeg = RANGE_DEG[orbitType] ?? RANGE_DEG["default"];
  const endCoords = computeTrajectoryEndpoint(lat, lng, azimuth, rangeDeg);
  const end = latLngToVector3(endCoords.lat, endCoords.lng, GLOBE.RADIUS);

  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(GLOBE.RADIUS + maxHeight);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(numPoints);
}

/**
 * Get a subset of trajectory points for animation (0 to progress fraction).
 */
export function getAnimatedTrajectoryPoints(
  fullPoints: THREE.Vector3[],
  progress: number // 0..1
): THREE.Vector3[] {
  const count = Math.max(
    2,
    Math.floor(fullPoints.length * Math.min(1, progress))
  );
  return fullPoints.slice(0, count);
}
