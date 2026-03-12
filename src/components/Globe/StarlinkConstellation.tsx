"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GLOBE } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { OMMRecord } from "@/lib/starlink/types";

/**
 * StarlinkConstellation — renders live Starlink satellites as a points cloud
 * on the globe. Uses simplified Keplerian propagation from OMM orbital elements.
 *
 * Desktop: up to 2000 satellites. Mobile: up to 800 for performance.
 */

const MAX_SATS_DESKTOP = 2000;
const MAX_SATS_MOBILE = 800;
const EARTH_RADIUS_KM = 6371;
const DEG2RAD = Math.PI / 180;

interface SatOrbit {
  /** Mean motion in radians per second */
  meanMotionRadPerSec: number;
  /** Inclination in radians */
  inclination: number;
  /** RAAN in radians */
  raan: number;
  /** Argument of perigee in radians */
  argPerigee: number;
  /** Mean anomaly at epoch in radians */
  meanAnomalyAtEpoch: number;
  /** Epoch timestamp ms */
  epochMs: number;
  /** Semi-major axis in globe units */
  sma: number;
}

/**
 * Convert OMM record to simplified orbital parameters.
 */
function ommToOrbit(omm: OMMRecord): SatOrbit {
  // Mean motion: rev/day → rad/s
  const mmRadPerSec = (omm.MEAN_MOTION * 2 * Math.PI) / 86400;

  // Semi-major axis from mean motion (Kepler's third law)
  // n = sqrt(mu / a^3) → a = (mu / n^2)^(1/3)
  // mu = 3.986e14 m^3/s^2
  const mu = 3.986004418e14;
  const n = omm.MEAN_MOTION * 2 * Math.PI / 86400; // rad/s
  const smaMeters = Math.pow(mu / (n * n), 1 / 3);
  const smaKm = smaMeters / 1000;
  // Convert to globe units
  const sma = GLOBE.RADIUS * (smaKm / EARTH_RADIUS_KM);

  return {
    meanMotionRadPerSec: mmRadPerSec,
    inclination: omm.INCLINATION * DEG2RAD,
    raan: omm.RA_OF_ASC_NODE * DEG2RAD,
    argPerigee: omm.ARG_OF_PERICENTER * DEG2RAD,
    meanAnomalyAtEpoch: omm.MEAN_ANOMALY * DEG2RAD,
    epochMs: new Date(omm.EPOCH).getTime(),
    sma,
  };
}

/**
 * Compute satellite position at a given time using simplified Keplerian motion.
 * Returns [x, y, z] in Three.js world coords (Y-up).
 */
function getPosition(orbit: SatOrbit, timeMs: number): [number, number, number] {
  const dt = (timeMs - orbit.epochMs) / 1000; // seconds since epoch

  // Current mean anomaly (assuming circular orbit)
  const M = orbit.meanAnomalyAtEpoch + orbit.meanMotionRadPerSec * dt;

  // For near-circular orbits (Starlink e ≈ 0.0001), true anomaly ≈ mean anomaly
  const v = M;
  const u = orbit.argPerigee + v; // argument of latitude

  // Position in orbital plane
  const xOrbit = orbit.sma * Math.cos(u);
  const yOrbit = orbit.sma * Math.sin(u);

  // Apply inclination (rotate around X-axis)
  const cosI = Math.cos(orbit.inclination);
  const sinI = Math.sin(orbit.inclination);
  const xIncl = xOrbit;
  const yIncl = yOrbit * cosI;
  const zIncl = yOrbit * sinI;

  // Apply RAAN (rotate around Y-axis — Earth's polar axis in our coord system)
  const cosO = Math.cos(orbit.raan);
  const sinO = Math.sin(orbit.raan);
  const x = xIncl * cosO - zIncl * sinO;
  const y = yIncl;
  const z = xIncl * sinO + zIncl * cosO;

  return [x, y, z];
}

export default function StarlinkConstellation() {
  const [orbits, setOrbits] = useState<SatOrbit[]>([]);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const [loading, setLoading] = useState(true);
  const opacityRef = useRef(0); // Start at 0 for fade-in
  const fadeStartRef = useRef(0);

  // Fetch Starlink data on mount
  useEffect(() => {
    let cancelled = false;
    // Signal loading to store
    useAppStore.getState().setStarlinkLoading(true);

    async function load() {
      try {
        const res = await fetch("/api/starlink");
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: OMMRecord[] = await res.json();

        if (cancelled) return;

        // Filter valid records
        const valid = data.filter(
          (r) =>
            r.OBJECT_NAME &&
            typeof r.MEAN_MOTION === "number" &&
            r.MEAN_MOTION > 0 &&
            typeof r.INCLINATION === "number"
        );

        // Adaptive limit: desktop gets more satellites
        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        const maxSats = isMobile ? MAX_SATS_MOBILE : MAX_SATS_DESKTOP;

        // Sample evenly to get ~maxSats
        const step = Math.max(1, Math.floor(valid.length / maxSats));
        const sampled: SatOrbit[] = [];
        for (let i = 0; i < valid.length && sampled.length < maxSats; i += step) {
          sampled.push(ommToOrbit(valid[i]));
        }

        setOrbits(sampled);
        setLoading(false);
        fadeStartRef.current = Date.now();
        useAppStore.setState({
          starlinkLoading: false,
          starlinkCount: sampled.length,
        });
        console.log(`[Starlink] Loaded ${sampled.length} of ${valid.length} satellites`);
      } catch (err) {
        console.error("[Starlink] Failed to load:", err);
        setLoading(false);
        useAppStore.getState().setStarlinkLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Create initial positions buffer
  const positions = useMemo(() => {
    return new Float32Array(orbits.length * 3);
  }, [orbits.length]);

  // Update satellite positions every frame + fade-in opacity
  useFrame(() => {
    if (orbits.length === 0 || !pointsRef.current) return;

    const now = Date.now();
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    if (!posAttr) return;

    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < orbits.length; i++) {
      const [x, y, z] = getPosition(orbits[i], now);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    posAttr.needsUpdate = true;

    // Fade-in animation over ~1 second
    if (materialRef.current && opacityRef.current < 0.6) {
      const elapsed = (now - fadeStartRef.current) / 1000; // seconds
      const targetOpacity = Math.min(0.6, elapsed * 0.6); // 0 → 0.6 over 1s
      opacityRef.current = targetOpacity;
      materialRef.current.opacity = targetOpacity;
    }
  });

  if (loading || orbits.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={orbits.length}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#ffffff"
        size={0.02}
        transparent
        opacity={0} // Start at 0, animated by useFrame
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
