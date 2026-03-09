/**
 * Web Worker for SGP4 satellite propagation.
 * Offloads the heavy math from the main thread.
 *
 * Receives OMM records, propagates all satellites to current time,
 * and returns Float32Array of xyz positions in Three.js world coords.
 */

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js";
import type { SatRec } from "satellite.js";
import type { OMMRecord, SatMetadata, WorkerCommand } from "./types";

let satrecs: SatRec[] = [];
let ommRecords: OMMRecord[] = [];
let globeRadius = 2;

/**
 * Convert OMM record to TLE lines, then to satrec.
 * CelesTrak's OMM JSON has all the fields needed to construct TLE lines.
 */
function ommToSatrec(omm: OMMRecord): SatRec | null {
  try {
    // Build TLE lines from OMM fields
    const noradStr = String(omm.NORAD_CAT_ID).padStart(5, "0");
    const epochDate = new Date(omm.EPOCH);
    const year = epochDate.getUTCFullYear() % 100;
    const startOfYear = new Date(Date.UTC(epochDate.getUTCFullYear(), 0, 1));
    const dayOfYear =
      (epochDate.getTime() - startOfYear.getTime()) / 86400000 + 1;
    const epochStr = `${String(year).padStart(2, "0")}${dayOfYear.toFixed(8).padStart(12, "0")}`;

    // Mean motion dot (first derivative / 2)
    const ndot = omm.MEAN_MOTION_DOT;
    const ndotStr =
      (ndot >= 0 ? " " : "-") +
      Math.abs(ndot).toFixed(8).replace("0.", ".").padEnd(10, "0");

    // Mean motion double dot — usually 0 for Starlink
    const nddotVal = omm.MEAN_MOTION_DDOT;
    let nddot6: string;
    if (nddotVal === 0) {
      nddot6 = " 00000-0";
    } else {
      const exp = Math.floor(Math.log10(Math.abs(nddotVal)));
      const mantissa = nddotVal / Math.pow(10, exp);
      const mantissaStr = Math.round(mantissa * 100000)
        .toString()
        .replace("-", "");
      nddot6 =
        (nddotVal >= 0 ? " " : "-") + mantissaStr.padStart(5, "0") + exp;
    }

    // BSTAR
    const bstarVal = omm.BSTAR;
    let bstar6: string;
    if (bstarVal === 0) {
      bstar6 = " 00000-0";
    } else {
      const bExp = Math.floor(Math.log10(Math.abs(bstarVal)));
      const bMant = bstarVal / Math.pow(10, bExp);
      const bMantStr = Math.round(bMant * 100000)
        .toString()
        .replace("-", "");
      bstar6 =
        (bstarVal >= 0 ? " " : "-") + bMantStr.padStart(5, "0") + bExp;
    }

    const elSetNo = String(omm.ELEMENT_SET_NO).padStart(4, " ");

    // Line 1
    const line1Raw = `1 ${noradStr}U ${omm.OBJECT_ID.padEnd(8, " ")} ${epochStr} ${ndotStr} ${nddot6} ${bstar6} 0 ${elSetNo}`;
    const line1 = line1Raw.padEnd(68, " ") + "0"; // checksum placeholder

    // Line 2
    const incl = omm.INCLINATION.toFixed(4).padStart(8, " ");
    const raan = omm.RA_OF_ASC_NODE.toFixed(4).padStart(8, " ");
    const ecc = omm.ECCENTRICITY.toFixed(7).replace("0.", "").padStart(7, "0");
    const argp = omm.ARG_OF_PERICENTER.toFixed(4).padStart(8, " ");
    const ma = omm.MEAN_ANOMALY.toFixed(4).padStart(8, " ");
    const mm = omm.MEAN_MOTION.toFixed(8).padStart(11, " ");
    const revNum = String(omm.REV_AT_EPOCH).padStart(5, " ");

    const line2Raw = `2 ${noradStr} ${incl} ${raan} ${ecc} ${argp} ${ma} ${mm}${revNum}`;
    const line2 = line2Raw.padEnd(68, " ") + "0"; // checksum placeholder

    return twoline2satrec(line1, line2);
  } catch {
    return null;
  }
}

/**
 * Convert lat/lng/alt to Three.js world coordinates.
 * Matches the app's coordinate convention (Y-up).
 */
function latLngAltToXYZ(
  latDeg: number,
  lngDeg: number,
  altKm: number,
  gRadius: number
): [number, number, number] {
  const r = gRadius * (1 + altKm / 6371);
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lngDeg + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

function handleInit(data: WorkerCommand) {
  if (!data.ommData) return;
  globeRadius = data.globeRadius ?? 2;
  ommRecords = data.ommData;
  satrecs = [];

  for (const omm of ommRecords) {
    const sr = ommToSatrec(omm);
    if (sr) satrecs.push(sr);
    else satrecs.push(null as unknown as SatRec); // placeholder to keep indices aligned
  }

  // eslint-disable-next-line no-restricted-globals
  (self as unknown as Worker).postMessage({
    type: "ready",
    count: satrecs.filter(Boolean).length,
  });
}

function handlePropagate(data: WorkerCommand) {
  const now = data.timestamp ? new Date(data.timestamp) : new Date();
  const gmst = gstime(now);

  const positions = new Float32Array(satrecs.length * 3);
  const metadata: SatMetadata[] = [];
  let validCount = 0;

  for (let i = 0; i < satrecs.length; i++) {
    const satrec = satrecs[i];
    if (!satrec) continue;

    try {
      const positionAndVelocity = propagate(satrec, now);
      const posEci = positionAndVelocity.position;

      if (!posEci || typeof posEci === "boolean") continue;

      const geodetic = eciToGeodetic(posEci, gmst);
      const lat = degreesLat(geodetic.latitude);
      const lng = degreesLong(geodetic.longitude);
      const alt = geodetic.height; // km

      // Skip clearly invalid positions
      if (isNaN(lat) || isNaN(lng) || isNaN(alt)) continue;
      if (alt < 100 || alt > 2000) continue; // Starlink orbits 300-600km

      const [x, y, z] = latLngAltToXYZ(lat, lng, alt, globeRadius);

      const idx = validCount * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      metadata.push({
        name: ommRecords[i]?.OBJECT_NAME ?? `SAT-${i}`,
        noradId: ommRecords[i]?.NORAD_CAT_ID ?? 0,
        alt: Math.round(alt),
      });

      validCount++;
    } catch {
      // Skip propagation errors (e.g., decayed satellites)
      continue;
    }
  }

  // Send only the valid portion
  const trimmed = positions.slice(0, validCount * 3);

  // eslint-disable-next-line no-restricted-globals
  (self as unknown as Worker).postMessage(
    {
      type: "positions",
      positions: trimmed,
      metadata,
      count: validCount,
      timestamp: now.getTime(),
    },
    [trimmed.buffer]
  );
}

// Listen for messages from main thread
// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", (e: MessageEvent<WorkerCommand>) => {
  const { type } = e.data;
  if (type === "init") handleInit(e.data);
  else if (type === "propagate") handlePropagate(e.data);
});
