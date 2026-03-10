"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js";
import type { SatRec } from "satellite.js";
import { fetchStarlinkData } from "@/lib/starlink/fetchStarlink";
import type { OMMRecord, SatMetadata } from "@/lib/starlink/types";
import { GLOBE } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

const PROPAGATION_INTERVAL_MS = 3000; // Re-propagate every 3 seconds

interface StarlinkPositions {
  positions: Float32Array;
  metadata: SatMetadata[];
  count: number;
  dataAge: number; // hours since last fetch
}

/**
 * Convert OMM record to TLE lines, then to satrec.
 */
function ommToSatrec(omm: OMMRecord): SatRec | null {
  try {
    const noradStr = String(omm.NORAD_CAT_ID).padStart(5, "0");
    const epochDate = new Date(omm.EPOCH);
    const year = epochDate.getUTCFullYear() % 100;
    const startOfYear = new Date(Date.UTC(epochDate.getUTCFullYear(), 0, 1));
    const dayOfYear =
      (epochDate.getTime() - startOfYear.getTime()) / 86400000 + 1;
    const epochStr = `${String(year).padStart(2, "0")}${dayOfYear.toFixed(8).padStart(12, "0")}`;

    const ndot = omm.MEAN_MOTION_DOT;
    const ndotStr =
      (ndot >= 0 ? " " : "-") +
      Math.abs(ndot).toFixed(8).replace("0.", ".").padEnd(10, "0");

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

    const line1Raw = `1 ${noradStr}U ${omm.OBJECT_ID.padEnd(8, " ")} ${epochStr} ${ndotStr} ${nddot6} ${bstar6} 0 ${elSetNo}`;
    const line1 = line1Raw.padEnd(68, " ") + "0";

    const incl = omm.INCLINATION.toFixed(4).padStart(8, " ");
    const raan = omm.RA_OF_ASC_NODE.toFixed(4).padStart(8, " ");
    const ecc = omm.ECCENTRICITY.toFixed(7).replace("0.", "").padStart(7, "0");
    const argp = omm.ARG_OF_PERICENTER.toFixed(4).padStart(8, " ");
    const ma = omm.MEAN_ANOMALY.toFixed(4).padStart(8, " ");
    const mm = omm.MEAN_MOTION.toFixed(8).padStart(11, " ");
    const revNum = String(omm.REV_AT_EPOCH).padStart(5, " ");

    const line2Raw = `2 ${noradStr} ${incl} ${raan} ${ecc} ${argp} ${ma} ${mm}${revNum}`;
    const line2 = line2Raw.padEnd(68, " ") + "0";

    return twoline2satrec(line1, line2);
  } catch {
    return null;
  }
}

/**
 * Convert lat/lng/alt to Three.js world coordinates (Y-up).
 */
function latLngAltToXYZ(
  latDeg: number,
  lngDeg: number,
  altKm: number
): [number, number, number] {
  const r = GLOBE.RADIUS * (1 + altKm / 6371);
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lngDeg + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/**
 * Propagate all satellites to current time on main thread.
 */
function propagateAll(
  satrecs: (SatRec | null)[],
  ommRecords: OMMRecord[]
): { positions: Float32Array; metadata: SatMetadata[]; count: number } {
  const now = new Date();
  const gmst = gstime(now);
  const positions = new Float32Array(satrecs.length * 3);
  const metadata: SatMetadata[] = [];
  let validCount = 0;

  for (let i = 0; i < satrecs.length; i++) {
    const satrec = satrecs[i];
    if (!satrec) continue;

    try {
      const positionAndVelocity = propagate(satrec, now);
      if (!positionAndVelocity) continue;
      const posEci = positionAndVelocity.position;
      if (!posEci || typeof posEci === "boolean") continue;

      const geodetic = eciToGeodetic(posEci, gmst);
      const lat = degreesLat(geodetic.latitude);
      const lng = degreesLong(geodetic.longitude);
      const alt = geodetic.height;

      if (isNaN(lat) || isNaN(lng) || isNaN(alt)) continue;
      if (alt < 100 || alt > 2000) continue;

      const [x, y, z] = latLngAltToXYZ(lat, lng, alt);

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
      continue;
    }
  }

  return {
    positions: positions.slice(0, validCount * 3),
    metadata,
    count: validCount,
  };
}

/**
 * Hook that fetches Starlink OMM data, converts to satrecs,
 * and propagates positions every 3 seconds on the main thread.
 */
export function useStarlinkPositions(enabled: boolean): StarlinkPositions | null {
  const [result, setResult] = useState<StarlinkPositions | null>(null);
  const satrecsRef = useRef<(SatRec | null)[]>([]);
  const ommRef = useRef<OMMRecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setStarlinkCount = useAppStore((s) => s.setStarlinkCount);

  const doPropagation = useCallback(() => {
    if (satrecsRef.current.length === 0) return;
    const start = performance.now();
    const { positions, metadata, count } = propagateAll(
      satrecsRef.current,
      ommRef.current
    );
    const elapsed = performance.now() - start;

    if (count > 0) {
      const fetchTime = (window as unknown as Record<string, number>).__starlinkFetchedAt;
      const dataAge = ommRef.current.length > 0 && fetchTime
        ? (Date.now() - fetchTime) / 3600000
        : Infinity;
      setResult({ positions, metadata, count, dataAge });
      setStarlinkCount(count);
    }

    if (elapsed > 50) {
      console.log(
        `[Starlink] Propagation: ${count} sats in ${elapsed.toFixed(0)}ms`
      );
    }
  }, [setStarlinkCount]);

  useEffect(() => {
    if (!enabled) {
      // Clean up when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setResult(null);
      setStarlinkCount(0);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        console.log("[Starlink] Fetching orbital data...");
        const ommData = await fetchStarlinkData();
        if (cancelled) return;

        console.log(`[Starlink] Converting ${ommData.length} OMM records to satrecs...`);
        const satrecs: (SatRec | null)[] = [];
        for (const omm of ommData) {
          satrecs.push(ommToSatrec(omm));
        }
        const validCount = satrecs.filter(Boolean).length;
        console.log(`[Starlink] ${validCount} valid satrecs initialized`);

        if (cancelled) return;

        satrecsRef.current = satrecs;
        ommRef.current = ommData;
        (window as unknown as Record<string, number>).__starlinkFetchedAt = Date.now();

        // Initial propagation
        doPropagation();

        // Set up interval
        intervalRef.current = setInterval(doPropagation, PROPAGATION_INTERVAL_MS);
      } catch (err) {
        console.error("[Starlink] Init failed:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, doPropagation]);

  return result;
}
