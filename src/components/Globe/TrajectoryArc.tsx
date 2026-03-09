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

  const hasBoosterReturn =
    launch.boosterReturn &&
    launch.boosterReturn.landingType !== "expended";

  const boosterCurve = useMemo(() => {
    if (!hasBoosterReturn || !launch.boosterReturn) return null;
    return generateBoosterReturnArc(
      stagingPoint,
      launch.boosterReturn.landingCoords.lat,
      launch.boosterReturn.landingCoords.lng
    );
  }, [hasBoosterReturn, launch.boosterReturn, stagingPoint]);

  const boosterAllPoints = useMemo(
    () => boosterCurve?.getPoints(60) ?? null,
    [boosterCurve]
  );

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

  // ── Reentry glow ref for booster ─────────────────────────────
  const reentryGlowRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (reentryGlowRef.current) {
      const flicker = 0.7 + Math.random() * 0.6;
      reentryGlowRef.current.scale.setScalar(flicker);
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

  const landingPos =
    launch.boosterReturn && boosterProgress >= 0.9
      ? latLngToVector3(
          launch.boosterReturn.landingCoords.lat,
          launch.boosterReturn.landingCoords.lng,
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

      {/* Booster rocket model */}
      {showBoosterReturn && boosterPoint && boosterTangent && boosterProgress < 0.9 && (
        <RocketModel position={boosterPoint} tangent={boosterTangent} rocketType={launch.rocketType} progress={0.4} />
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

      {/* Landing flash */}
      {landingPos && (
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
