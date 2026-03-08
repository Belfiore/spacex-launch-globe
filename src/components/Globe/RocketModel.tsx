"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface RocketModelProps {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  rocketType: string;
  progress: number;
}

/**
 * Procedural 3D rocket mesh that travels along a trajectory arc.
 * Nose points along the trajectory tangent direction.
 */
export default function RocketModel({
  position,
  tangent,
  rocketType,
  progress,
}: RocketModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.Mesh>(null);

  // Quaternion: aligns the rocket's +Y axis (nose) with the tangent direction
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const t = tangent.clone().normalize();
    // Avoid degenerate case where tangent is exactly ±Y
    if (Math.abs(t.y) > 0.999) {
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), t.y > 0 ? 0 : Math.PI);
    } else {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    }
    return q;
  }, [tangent]);

  // Exhaust flicker animation
  useFrame(() => {
    if (exhaustRef.current && progress < 0.7) {
      const flicker = 0.8 + Math.random() * 0.4;
      exhaustRef.current.scale.setScalar(flicker);
    }
  });

  // Only visible during active flight
  if (progress <= 0.05 || progress >= 0.95) return null;

  const isStarship = rocketType === "Starship";
  const isFalconHeavy = rocketType === "Falcon Heavy";
  const bodyRadius = isStarship ? 0.018 : 0.012;
  const bodyHeight = 0.095;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      quaternion={quaternion}
    >
      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[bodyRadius, bodyRadius * 1.05, bodyHeight, 8]} />
        <meshBasicMaterial color={isStarship ? "#b8c0cc" : "#1e1e24"} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, bodyHeight / 2 + 0.014, 0]}>
        <coneGeometry args={[bodyRadius, 0.028, 8]} />
        <meshBasicMaterial color={isStarship ? "#d0d8e0" : "#e0e0e0"} />
      </mesh>

      {/* Falcon Heavy side boosters */}
      {isFalconHeavy && (
        <>
          <mesh position={[-0.026, -0.005, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.065, 8]} />
            <meshBasicMaterial color="#1e1e24" />
          </mesh>
          <mesh position={[0.026, -0.005, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.065, 8]} />
            <meshBasicMaterial color="#1e1e24" />
          </mesh>
          {/* Side booster noses */}
          <mesh position={[-0.026, 0.029, 0]}>
            <coneGeometry args={[0.009, 0.018, 8]} />
            <meshBasicMaterial color="#e0e0e0" />
          </mesh>
          <mesh position={[0.026, 0.029, 0]}>
            <coneGeometry args={[0.009, 0.018, 8]} />
            <meshBasicMaterial color="#e0e0e0" />
          </mesh>
        </>
      )}

      {/* Starship fins */}
      {isStarship && (
        <>
          <mesh position={[bodyRadius + 0.006, -bodyHeight / 2 + 0.01, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.012, 0.03, 0.004]} />
            <meshBasicMaterial color="#8090a0" />
          </mesh>
          <mesh position={[-(bodyRadius + 0.006), -bodyHeight / 2 + 0.01, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.012, 0.03, 0.004]} />
            <meshBasicMaterial color="#8090a0" />
          </mesh>
        </>
      )}

      {/* Engine exhaust glow — only visible during ascent */}
      {progress < 0.7 && (
        <mesh
          ref={exhaustRef}
          position={[0, -(bodyHeight / 2 + 0.018), 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <coneGeometry args={[bodyRadius * 0.65, 0.04, 8]} />
          <meshBasicMaterial
            color="#ff7700"
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Outer exhaust glow halo */}
      {progress < 0.7 && (
        <mesh
          position={[0, -(bodyHeight / 2 + 0.01), 0]}
        >
          <sphereGeometry args={[bodyRadius * 1.1, 8, 8]} />
          <meshBasicMaterial
            color="#ff9900"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
