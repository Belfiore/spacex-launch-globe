"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import {
  generateTrajectoryArcCurve,
  generateBoosterReturnArc,
  ORBIT_ALTITUDE_KM,
  ORBIT_INCLINATION,
} from "@/lib/trajectoryUtils";
import { COLORS, GLOBE, STAGING_PROGRESS } from "@/lib/constants";
import { latLngToVector3 } from "@/lib/coordUtils";
import type { Launch } from "@/lib/types";
import RocketModel from "./RocketModel";

interface TrajectoryArcProps {
  launch: Launch;
  progress: number;
  visible: boolean;
}

const NUM_POINTS = 80;
const STARLINK_SAT_COUNT = 15;

function toTuple(v: THREE.Vector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

export default function TrajectoryArc({
  launch,
  progress,
  visible,
}: TrajectoryArcProps) {
  const curve = useMemo(() => generateTrajectoryArcCurve(launch), [launch]);
  const allPoints = useMemo(() => curve.getPoints(NUM_POINTS), [curve]);

  const orbitType = launch.payloadOrbit ?? "LEO";
  const altKm = ORBIT_ALTITUDE_KM[orbitType] ?? 400;
  const inclDeg = ORBIT_INCLINATION[orbitType] ?? 28.5;
  const orbitRadius = GLOBE.RADIUS * (1 + altKm / 6371);

  const stagingPoint = useMemo(() => curve.getPointAt(STAGING_PROGRESS), [curve]);

  // ── Booster return arcs (supports multiple for Falcon Heavy) ──
  const boosterReturnEntries = useMemo(() => {
    if (launch.boosterReturns && launch.boosterReturns.length > 0) {
      return launch.boosterReturns.filter(br => br.landingType !== "expended");
    }
    if (launch.boosterReturn && launch.boosterReturn.landingType !== "expended") {
      return [launch.boosterReturn];
    }
    return [];
  }, [launch.boosterReturn, launch.boosterReturns]);

  const hasBoosterReturn = boosterReturnEntries.length > 0;

  const boosterCurves = useMemo(() => {
    return boosterReturnEntries.map((br) =>
      generateBoosterReturnArc(stagingPoint, br.landingCoords.lat, br.landingCoords.lng)
    );
  }, [boosterReturnEntries, stagingPoint]);

  const boosterAllPointsArr = useMemo(
    () => boosterCurves.map(c => c.getPoints(60)),
    [boosterCurves]
  );

  // Primary booster for backward compat (first entry)
  const boosterCurve = boosterCurves[0] ?? null;
  const boosterAllPoints = boosterAllPointsArr[0] ?? null;

  // ── Starlink satellite train ──────────────────────────────────
  const isStarlink =
    launch.rocketType === "Falcon 9" &&
    launch.name.toLowerCase().includes("starlink");

  const starlinkPositions = useMemo(() => {
    if (!isStarlink || progress <= 0.9) return null;
    // End point of the trajectory as our deployment origin
    const endPoint = curve.getPointAt(0.98);
    const endDir = endPoint.clone().normalize();

    // Compute an orbit tangent direction (perpendicular to radial & slightly eastward)
    const north = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(endDir, north).normalize();
    if (tangent.lengthSq() < 0.01) {
      tangent.set(1, 0, 0);
    }

    // The spread factor increases as progress goes from 0.9 to 1.0
    const spreadFactor = Math.min(1, (progress - 0.9) / 0.1);
    const orbitR = GLOBE.RADIUS * (1 + 400 / 6371); // LEO ~400km

    const sats: [number, number, number][] = [];
    for (let i = 0; i < STARLINK_SAT_COUNT; i++) {
      // Satellites spread out from a cluster to evenly spaced
      const baseAngle = (i / STARLINK_SAT_COUNT) * 0.08; // tight initial cluster
      const spreadAngle = (i / STARLINK_SAT_COUNT) * 0.6; // wide spread
      const angle = baseAngle + (spreadAngle - baseAngle) * spreadFactor;

      // Rotate the deployment position around the radial axis
      const pos = endDir
        .clone()
        .multiplyScalar(orbitR)
        .applyAxisAngle(tangent, angle - 0.3 * spreadFactor);
      sats.push([pos.x, pos.y, pos.z]);
    }
    return sats;
  }, [isStarlink, progress, curve]);

  // ── Landing failure detection ────────────────────────────────
  // Check per-booster landingSuccess first (for Falcon Heavy), fall back to top-level
  const primaryEntry = boosterReturnEntries[0];
  const landingFailed = primaryEntry?.landingSuccess === false
    ? true
    : primaryEntry?.landingSuccess === true
      ? false
      : launch.landingSuccess === false;

  // ── Reentry glow ref for booster ─────────────────────────────
  const reentryGlowRef = useRef<THREE.Mesh>(null);
  const explosionRef = useRef<THREE.Mesh>(null);
  const explosionDebrisRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (reentryGlowRef.current) {
      const flicker = 0.7 + Math.random() * 0.6;
      reentryGlowRef.current.scale.setScalar(flicker);
    }
    // Animate explosion — pulsing fireball
    if (explosionRef.current) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.3 + Math.random() * 0.15;
      explosionRef.current.scale.setScalar(pulse);
    }
    // Animate debris — slowly expand outward
    if (explosionDebrisRef.current) {
      explosionDebrisRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const s = child.scale.x + delta * 0.15;
          child.scale.setScalar(Math.min(s, 2.5));
          const mat = child.material as THREE.MeshBasicMaterial;
          if (mat.opacity > 0.05) {
            mat.opacity -= delta * 0.3;
          }
        }
      });
    }
  });

  if (!visible) return null;

  // ── Static preview mode (progress === 0): show full planned path + rocket on pad ──
  const isStaticPreview = progress <= 0.01;

  const clampedProgress = Math.min(Math.max(progress, 0), 0.99);
  const rocketIdx = isStaticPreview ? 0 : Math.floor(clampedProgress * NUM_POINTS);
  const rocketPoint = allPoints[Math.min(rocketIdx, allPoints.length - 1)];
  const rocketTangent = curve.getTangentAt(Math.max(0.001, clampedProgress));

  const accentColor = "#00E5FF";

  // ── Trail segments (only during active flight) ──
  let seg1: [number, number, number][] = [];
  let seg2: [number, number, number][] = [];
  let seg3: [number, number, number][] = [];
  let plannedPoints: [number, number, number][] = [];

  if (isStaticPreview) {
    // Show entire path as dim planned line
    plannedPoints = allPoints.map(toTuple);
  } else {
    const trailLen = Math.max(2, rocketIdx + 1);
    const s1End = Math.max(2, Math.floor(trailLen * 0.4));
    const s2End = Math.max(2, Math.floor(trailLen * 0.75));

    seg1 = allPoints.slice(0, s1End).map(toTuple);
    seg2 = allPoints.slice(Math.max(0, s1End - 1), s2End).map(toTuple);
    seg3 = allPoints.slice(Math.max(0, s2End - 1), trailLen).map(toTuple);
    plannedPoints = allPoints.slice(Math.max(0, rocketIdx)).map(toTuple);
  }

  const showBoosterReturn = !isStaticPreview && hasBoosterReturn && progress >= STAGING_PROGRESS;
  const boosterProgress = showBoosterReturn
    ? Math.min(1, (progress - STAGING_PROGRESS) / ((launch.rocketType === "Starship" ? 0.45 : 0.55) * (1 - STAGING_PROGRESS)))
    : 0;

  const boosterRocketIdx = Math.floor(boosterProgress * 60);
  const boosterPoint = boosterAllPoints
    ? boosterAllPoints[Math.min(boosterRocketIdx, boosterAllPoints.length - 1)]
    : null;
  const boosterTangent =
    boosterCurve && boosterProgress < 0.99
      ? boosterCurve.getTangentAt(Math.max(0.01, boosterProgress)).negate()
      : null;
  const boosterTrailPoints = boosterAllPoints
    ? boosterAllPoints.slice(0, Math.max(2, boosterRocketIdx + 1)).map(toTuple)
    : null;

  const showStageSeparation = !isStaticPreview && progress >= STAGING_PROGRESS && hasBoosterReturn;
  const stagingTuple = toTuple(stagingPoint);

  const primaryReturn = boosterReturnEntries[0] ?? null;
  const landingPos =
    primaryReturn && boosterProgress >= 0.9
      ? latLngToVector3(
          primaryReturn.landingCoords.lat,
          primaryReturn.landingCoords.lng,
          GLOBE.RADIUS + 0.01
        )
      : null;

  return (
    <group>
      {seg1.length >= 2 && (
        <Line points={seg1} color={accentColor} lineWidth={1.5} transparent opacity={0.12} />
      )}
      {seg2.length >= 2 && (
        <Line points={seg2} color={accentColor} lineWidth={2} transparent opacity={0.45} />
      )}
      {seg3.length >= 2 && (
        <Line points={seg3} color={accentColor} lineWidth={2.5} transparent opacity={0.9} />
      )}
      {plannedPoints.length >= 2 && (
        <Line points={plannedPoints} color="#475569" lineWidth={1} transparent opacity={0.10} />
      )}

      {/* Glowing tip — only during active flight */}
      {!isStaticPreview && rocketPoint && (
        <mesh position={toTuple(rocketPoint)}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Rocket model */}
      {rocketPoint && rocketTangent && (
        <RocketModel
          position={rocketPoint}
          tangent={rocketTangent}
          rocketType={launch.rocketType}
          progress={progress}
        />
      )}

      {/* Stage separation — just a glow sphere, NO Html label */}
      {showStageSeparation && (
        <mesh position={stagingTuple}>
          <sphereGeometry args={[0.015, 10, 10]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={Math.max(0.1, 0.5 - (progress - STAGING_PROGRESS) * 2)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Orbit insertion ring — only during active flight */}
      {!isStaticPreview && progress > 0.7 && (
        <mesh rotation={[(inclDeg * Math.PI) / 180, 0, 0]}>
          <torusGeometry args={[orbitRadius, 0.004, 8, 120]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={Math.min(0.28, (progress - 0.7) * 0.93)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Orbit insertion badge — only for past launches (success/failure), not upcoming */}
      {progress >= 0.99 && rocketPoint && launch.status !== "upcoming" && (
        <Html
          position={toTuple(rocketPoint)}
          center
          zIndexRange={[0, 0]}
          style={{ pointerEvents: "none", transform: "translateY(-12px)" }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 700,
              color: launch.status === "success" ? "#22c55e" : "#ef4444",
              fontFamily: "monospace",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {launch.status === "success" ? `✓ ${orbitType}` : "✗ FAIL"}
          </div>
        </Html>
      )}

      {/* Booster return trail */}
      {showBoosterReturn && boosterTrailPoints && boosterTrailPoints.length >= 2 && (
        <Line points={boosterTrailPoints} color="#f59e0b" lineWidth={2} transparent opacity={0.75} />
      )}
      {showBoosterReturn && boosterAllPoints && boosterAllPoints.length >= 2 && (
        <Line points={boosterAllPoints.map(toTuple)} color="#f59e0b" lineWidth={1} transparent opacity={0.15} />
      )}

      {/* Booster rocket model — standalone first-stage body only */}
      {showBoosterReturn && boosterPoint && boosterTangent && boosterProgress < 0.9 && (
        <RocketModel position={boosterPoint} tangent={boosterTangent} rocketType={launch.rocketType} progress={0.4} isBooster />
      )}

      {/* Atmospheric reentry glow — visible during booster entry phase */}
      {showBoosterReturn &&
        boosterPoint &&
        boosterProgress > 0.1 &&
        boosterProgress < 0.5 && (
          <>
            {/* Main plasma sheath glow */}
            <mesh
              ref={reentryGlowRef}
              position={toTuple(boosterPoint)}
            >
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial
                color="#ff4400"
                transparent
                opacity={
                  0.55 *
                  Math.sin(
                    ((boosterProgress - 0.1) / 0.4) * Math.PI
                  )
                }
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            {/* Outer heat halo */}
            <mesh position={toTuple(boosterPoint)}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial
                color="#ff8800"
                transparent
                opacity={
                  0.2 *
                  Math.sin(
                    ((boosterProgress - 0.1) / 0.4) * Math.PI
                  )
                }
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

      {/* Landing flash (success) or explosion (failure) */}
      {landingPos && !landingFailed && (
        <mesh position={toTuple(landingPos)}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={Math.max(0, 1 - (boosterProgress - 0.9) * 10) * 0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ── Failed landing explosion ── */}
      {landingPos && landingFailed && boosterProgress >= 0.85 && (
        <>
          {/* Main fireball — orange/red pulsing sphere */}
          <mesh
            ref={explosionRef}
            position={toTuple(landingPos)}
          >
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial
              color="#ff3300"
              transparent
              opacity={Math.min(0.9, (boosterProgress - 0.85) * 6)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Inner white-hot core */}
          <mesh position={toTuple(landingPos)}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color="#ffcc00"
              transparent
              opacity={Math.min(0.95, (boosterProgress - 0.85) * 8)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Outer shockwave ring */}
          <mesh
            position={toTuple(landingPos)}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry
              args={[
                0.03 + Math.min(0.06, (boosterProgress - 0.85) * 0.4),
                0.004,
                6,
                24,
              ]}
            />
            <meshBasicMaterial
              color="#ff6600"
              transparent
              opacity={Math.max(0, 0.7 - (boosterProgress - 0.88) * 5)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Debris particles — small scattered spheres */}
          <group ref={explosionDebrisRef} position={toTuple(landingPos)}>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const r = 0.015 + Math.random() * 0.01;
              return (
                <mesh
                  key={`debris-${i}`}
                  position={[
                    Math.cos(angle) * r,
                    0.01 + Math.random() * 0.02,
                    Math.sin(angle) * r,
                  ]}
                >
                  <sphereGeometry args={[0.004, 4, 4]} />
                  <meshBasicMaterial
                    color={i % 2 === 0 ? "#ff4400" : "#ffaa00"}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>
              );
            })}
          </group>
        </>
      )}

      {/* ── Additional booster return arcs (Falcon Heavy side boosters / center core) ── */}
      {showBoosterReturn && boosterReturnEntries.length > 1 && boosterAllPointsArr.slice(1).map((pts, i) => {
        const bProg = Math.min(1, (progress - STAGING_PROGRESS) / (0.55 * (1 - STAGING_PROGRESS)));
        const bIdx = Math.floor(bProg * 60);
        const trailPts = pts.slice(0, Math.max(2, bIdx + 1)).map(toTuple);
        const bPoint = pts[Math.min(bIdx, pts.length - 1)];
        const curve2 = boosterCurves[i + 1];
        const bTangent = curve2 && bProg < 0.99 ? curve2.getTangentAt(Math.max(0.01, bProg)).negate() : null;
        const brEntry = boosterReturnEntries[i + 1];
        const landPos = bProg >= 0.9
          ? latLngToVector3(brEntry.landingCoords.lat, brEntry.landingCoords.lng, GLOBE.RADIUS + 0.01)
          : null;
        // Per-booster landing success: check entry-level field, fall back to top-level
        const entryFailed = brEntry.landingSuccess === false;
        const accentColor = i === 0 ? "#f59e0b" : "#22d3ee";

        return (
          <group key={`booster-${i + 1}`}>
            {trailPts.length >= 2 && (
              <Line points={trailPts} color={accentColor} lineWidth={2} transparent opacity={0.65} />
            )}
            {bPoint && bTangent && bProg < 0.9 && (
              <RocketModel position={bPoint} tangent={bTangent} rocketType={launch.rocketType} progress={0.4} isBooster />
            )}
            {/* Landing success flash */}
            {landPos && !entryFailed && (
              <mesh position={toTuple(landPos)}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color={accentColor} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            )}
            {/* Landing failure explosion */}
            {landPos && entryFailed && bProg >= 0.85 && (
              <>
                <mesh position={toTuple(landPos)}>
                  <sphereGeometry args={[0.035, 10, 10]} />
                  <meshBasicMaterial color="#ff3300" transparent opacity={Math.min(0.85, (bProg - 0.85) * 6)} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
                <mesh position={toTuple(landPos)}>
                  <sphereGeometry args={[0.018, 8, 8]} />
                  <meshBasicMaterial color="#ffcc00" transparent opacity={Math.min(0.9, (bProg - 0.85) * 8)} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* ── Starlink satellite train (only during active flight) ── */}
      {!isStaticPreview && starlinkPositions &&
        starlinkPositions.map((pos, i) => (
          <mesh key={`sat-${i}`} position={pos}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
    </group>
  );
}
