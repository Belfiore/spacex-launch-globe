/**
 * Jellyfish effect prediction — pure-math solar position calculator.
 *
 * A "space jellyfish" occurs when a rocket launches during twilight:
 * the observer on the ground is in darkness, but the exhaust plume
 * at high altitude is still illuminated by sunlight, creating a
 * glowing jellyfish-like shape in the sky.
 *
 * Ideal conditions: nautical twilight (sun 6°–12° below horizon).
 */

import type { JellyfishData } from "./types";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Day of year (1–366) for a given Date. */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Compute the sun's altitude angle (degrees) for a given UTC time
 * at a given latitude/longitude.
 *
 * Uses a simplified solar position algorithm sufficient for
 * twilight classification (±0.5° accuracy).
 */
function sunAltitude(date: Date, lat: number, lng: number): number {
  const doy = dayOfYear(date);

  // Solar declination (degrees)
  const declination = 23.45 * Math.sin(((360 / 365) * (doy - 81)) * DEG);

  // Hours since midnight UTC
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  // Local solar time (hours)
  // Equation of time approximation (minutes)
  const B = ((360 / 365) * (doy - 81)) * DEG;
  const eot =
    9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  const localSolarTime = utcHours + lng / 15 + eot / 60;

  // Hour angle (degrees) — 0° at solar noon, 15° per hour
  const hourAngle = (localSolarTime - 12) * 15;

  // Solar altitude
  const sinAlt =
    Math.sin(lat * DEG) * Math.sin(declination * DEG) +
    Math.cos(lat * DEG) *
      Math.cos(declination * DEG) *
      Math.cos(hourAngle * DEG);

  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;
}

/** Classify twilight phase from sun altitude. */
function twilightPhase(
  alt: number
): "day" | "civil" | "nautical" | "astronomical" | "night" {
  if (alt > 0) return "day";
  if (alt > -6) return "civil";
  if (alt > -12) return "nautical";
  if (alt > -18) return "astronomical";
  return "night";
}

/**
 * Compute jellyfish potential for a launch.
 *
 * @param dateUtc - ISO date string of launch time
 * @param lat - Launch site latitude
 * @param lng - Launch site longitude
 * @returns JellyfishData with potential assessment
 */
export function computeJellyfish(
  dateUtc: string,
  lat: number,
  lng: number
): JellyfishData {
  const d = new Date(dateUtc);
  const alt = sunAltitude(d, lat, lng);
  const phase = twilightPhase(alt);

  // Compute how many minutes from the nearest twilight boundary
  // (rough estimate: sun moves ~0.25°/min near horizon)
  const minutesFrom = Math.abs(alt) / 0.25;

  // Determine potential using sun altitude directly.
  // The jellyfish effect depends on the plume at ~100+ km altitude catching sunlight
  // while the ground observer is in darkness. The sweet spot is sun 5°–14° below horizon.
  let potential: "high" | "moderate" | "none";
  let description: string;

  if (alt <= -5 && alt >= -14) {
    // Core jellyfish window — observer in darkness, plume illuminated
    potential = "high";
    description =
      "Launch during deep twilight. Exhaust plume at altitude will be illuminated by sunlight while ground observers are in darkness — ideal conditions for a space jellyfish.";
  } else if (alt <= -3 && alt > -5) {
    // Late civil twilight — sky still somewhat bright
    potential = "moderate";
    description =
      "Launch during late civil twilight. Sky may still be too bright for optimal jellyfish visibility, but plume illumination is possible.";
  } else if (alt < -14 && alt >= -18) {
    // Deep astronomical twilight — plume may catch faint light
    potential = "moderate";
    description =
      "Launch during deep astronomical twilight. Plume may catch faint sunlight at very high altitudes, creating a subtle jellyfish effect.";
  } else {
    potential = "none";
    if (phase === "day") {
      description = "Daytime launch — no jellyfish effect possible.";
    } else if (phase === "night") {
      description =
        "Night launch — sun too far below horizon for plume illumination.";
    } else if (phase === "civil") {
      description =
        "Early civil twilight — sky too bright for visible jellyfish effect.";
    } else {
      description =
        "Late astronomical twilight — insufficient sunlight for plume illumination.";
    }
  }

  return {
    potential,
    sunAltitude: Math.round(alt * 10) / 10,
    twilightPhase: phase,
    minutesFromTwilight: Math.round(minutesFrom),
    description,
  };
}
