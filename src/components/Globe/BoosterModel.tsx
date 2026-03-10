"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface BoosterModelProps {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  progress: number;
}

/**
 * Simple cylinder model for returning boosters (Falcon Heavy side boosters, etc.)
 * No nose cone, no side boosters — just a plain cylinder with grid fins and engine glow.
 */
export default function BoosterModel({
  position,
  tangent,
  progress,
}: BoosterModelProps) {
  const exhaustRef = useRef<THREE.Mesh>(null);

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const t = tangent.clone().normalize();
    if (Math.abs(t.y) > 0.999) {
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), t.y > 0 ? 0 : Math.PI);
    } else {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    }
    return q;
  }, [tangent]);

  useFrame(() => {
    if (exhaustRef.current) {
      const flicker = 0.8 + Math.random() * 0.4;
      exhaustRef.current.scale.setScalar(flicker);
    }
  });

  if (progress >= 0.95) return null;

  const bodyRadius = 0.008;
  const bodyHeight = 0.065;
  const bodyColor = "#d4d4d8";

  return (
    <group
      position={[position.x, position.y, position.z]}
      quaternion={quaternion}
    >
      {/* Cylinder body */}
      <mesh>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 10]} />
        <meshBasicMaterial color={bodyColor} />
      </mesh>

      {/* Flat top cap */}
      <mesh position={[0, bodyHeight / 2 + 0.001, 0]}>
        <cylinderGeometry args={[bodyRadius * 1.02, bodyRadius * 1.02, 0.002, 10]} />
        <meshBasicMaterial color="#3a3a44" />
      </mesh>

      {/* Grid fins (2 pairs) */}
      <mesh position={[bodyRadius + 0.006, bodyHeight / 2 - 0.008, 0]}>
        <boxGeometry args={[0.01, 0.006, 0.002]} />
        <meshBasicMaterial color="#2a2a32" />
      </mesh>
      <mesh position={[-(bodyRadius + 0.006), bodyHeight / 2 - 0.008, 0]}>
        <boxGeometry args={[0.01, 0.006, 0.002]} />
        <meshBasicMaterial color="#2a2a32" />
      </mesh>
      <mesh position={[0, bodyHeight / 2 - 0.008, bodyRadius + 0.006]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.01, 0.006, 0.002]} />
        <meshBasicMaterial color="#2a2a32" />
      </mesh>
      <mesh position={[0, bodyHeight / 2 - 0.008, -(bodyRadius + 0.006)]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.01, 0.006, 0.002]} />
        <meshBasicMaterial color="#2a2a32" />
      </mesh>

      {/* Engine cluster at bottom */}
      <mesh position={[0, -bodyHeight / 2 - 0.001, 0]}>
        <circleGeometry args={[bodyRadius * 0.7, 10]} />
        <meshBasicMaterial color="#1a1a22" side={THREE.DoubleSide} />
      </mesh>

      {/* Exhaust glow during descent burn */}
      {progress > 0.5 && progress < 0.9 && (
        <>
          <mesh
            ref={exhaustRef}
            position={[0, -(bodyHeight / 2 + 0.012), 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[bodyRadius * 0.5, 0.025, 8]} />
            <meshBasicMaterial
              color="#ff7700"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, -(bodyHeight / 2 + 0.006), 0]}>
            <sphereGeometry args={[bodyRadius * 0.9, 8, 8]} />
            <meshBasicMaterial
              color="#ff9900"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
