"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useAppStore } from "@/store/useAppStore";
import { GLOBE } from "@/lib/constants";

/** ISS orbital parameters (based on current TLE data) */
const ISS_ALTITUDE_KM = 420; // ~420 km average altitude
const ISS_ORBIT_RADIUS = GLOBE.RADIUS * (1 + ISS_ALTITUDE_KM / 6371);
const ISS_INCLINATION_RAD = 51.6 * (Math.PI / 180);
const ORBITAL_PERIOD_S = 5580; // ~93 minutes

/**
 * ISS Right Ascension of Ascending Node (RAAN) precesses ~5° per day westward.
 * We use a reference epoch and precess from there.
 */
const RAAN_REF_EPOCH_MS = new Date("2026-01-01T00:00:00Z").getTime();
const RAAN_REF_RAD = 0; // arbitrary reference RAAN at epoch
const RAAN_PRECESSION_RAD_PER_S = (-5 * Math.PI / 180) / 86400; // ~-5°/day

/**
 * Compute ISS position with RAAN precession for more realistic orbit.
 */
function getISSPosition(timeMs: number): [number, number, number] {
  const timeSinceEpochS = (timeMs - RAAN_REF_EPOCH_MS) / 1000;

  // Orbital angle (mean anomaly advancement)
  const meanAnomaly = (timeSinceEpochS / ORBITAL_PERIOD_S) * 2 * Math.PI;

  // RAAN precesses over time
  const raan = RAAN_REF_RAD + RAAN_PRECESSION_RAD_PER_S * timeSinceEpochS;

  // Position in orbital plane (before RAAN rotation)
  const xOrbit = ISS_ORBIT_RADIUS * Math.cos(meanAnomaly);
  const yOrbit = ISS_ORBIT_RADIUS * Math.sin(meanAnomaly);

  // Apply inclination (rotate around X axis)
  const xIncl = xOrbit;
  const yIncl = yOrbit * Math.cos(ISS_INCLINATION_RAD);
  const zIncl = yOrbit * Math.sin(ISS_INCLINATION_RAD);

  // Apply RAAN (rotate around Y axis — Earth's polar axis)
  const x = xIncl * Math.cos(raan) - zIncl * Math.sin(raan);
  const y = yIncl;
  const z = xIncl * Math.sin(raan) + zIncl * Math.cos(raan);

  return [x, y, z];
}

/**
 * Generate orbit ring points with RAAN applied.
 */
function getOrbitRingPoints(timeMs: number, numPoints: number = 128): THREE.Vector3[] {
  const timeSinceEpochS = (timeMs - RAAN_REF_EPOCH_MS) / 1000;
  const raan = RAAN_REF_RAD + RAAN_PRECESSION_RAD_PER_S * timeSinceEpochS;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    const xOrbit = ISS_ORBIT_RADIUS * Math.cos(angle);
    const yOrbit = ISS_ORBIT_RADIUS * Math.sin(angle);

    const xIncl = xOrbit;
    const yIncl = yOrbit * Math.cos(ISS_INCLINATION_RAD);
    const zIncl = yOrbit * Math.sin(ISS_INCLINATION_RAD);

    const x = xIncl * Math.cos(raan) - zIncl * Math.sin(raan);
    const y = yIncl;
    const z = xIncl * Math.sin(raan) + zIncl * Math.cos(raan);

    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

export default function ISSOrbit() {
  const timelineDate = useAppStore((s) => s.timelineDate);
  const timeMs = timelineDate.getTime();

  const issPosition = useMemo(() => getISSPosition(timeMs), [timeMs]);

  const orbitPoints = useMemo(
    () => getOrbitRingPoints(timeMs).map((v): [number, number, number] => [v.x, v.y, v.z]),
    [timeMs]
  );

  return (
    <>
      {/* Orbit ring — computed with RAAN precession */}
      {orbitPoints.length >= 2 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(orbitPoints.flat()), 3]}
              count={orbitPoints.length}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#4488bb"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      )}

      {/* ISS station mesh */}
      <group position={issPosition}>
        {/* Main truss */}
        <mesh>
          <boxGeometry args={[0.08, 0.005, 0.005]} />
          <meshBasicMaterial color="#d0d8e4" />
        </mesh>
        {/* Pressurized modules */}
        <mesh>
          <boxGeometry args={[0.005, 0.005, 0.04]} />
          <meshBasicMaterial color="#e0e4ec" />
        </mesh>
        {/* Solar panels */}
        {[[-0.03, 0.02], [-0.03, -0.02], [0.03, 0.02], [0.03, -0.02]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0, pz]}>
            <boxGeometry args={[0.035, 0.001, 0.014]} />
            <meshBasicMaterial color="#3366cc" />
          </mesh>
        ))}
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial
            color="#88ccff"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* ISS label — fixed screen-space, NO distanceFactor */}
        <Html
          center
          zIndexRange={[0, 0]}
          style={{ pointerEvents: "none", transform: "translateY(-16px)" }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 700,
              color: "#88ccff",
              fontFamily: "monospace",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            ISS
          </div>
        </Html>
      </group>
    </>
  );
}
