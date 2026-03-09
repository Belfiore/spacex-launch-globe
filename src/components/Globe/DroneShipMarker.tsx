"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { latLngToPosition, latLngToVector3 } from "@/lib/coordUtils";
import { GLOBE } from "@/lib/constants";
import type { BoosterReturn } from "@/lib/types";

interface DroneShipMarkerProps {
  boosterReturn: BoosterReturn;
}

export default function DroneShipMarker({ boosterReturn }: DroneShipMarkerProps) {
  const position = useMemo(
    () =>
      latLngToPosition(
        boosterReturn.landingCoords.lat,
        boosterReturn.landingCoords.lng,
        GLOBE.RADIUS + 0.003
      ),
    [boosterReturn.landingCoords]
  );

  const ringQuaternion = useMemo(() => {
    const normal = latLngToVector3(
      boosterReturn.landingCoords.lat,
      boosterReturn.landingCoords.lng,
      1
    ).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [boosterReturn.landingCoords]);

  const isStarbase =
    Math.abs(boosterReturn.landingCoords.lat - 25.9972) < 0.01 &&
    Math.abs(boosterReturn.landingCoords.lng + 97.1561) < 0.01;
  const label = isStarbase ? "CATCH" : boosterReturn.landingType === "RTLS" ? "LZ" : "ASDS";
  const color = "#f59e0b";

  return (
    <group position={position}>
      {/* Landing target ring */}
      <mesh quaternion={ringQuaternion}>
        <ringGeometry args={[0.008, 0.012, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Label — fixed screen-space size, NO distanceFactor */}
      <Html
        center
        zIndexRange={[0, 0]}
        style={{ pointerEvents: "none", transform: "translateY(-14px)" }}
      >
        <div
          style={{
            fontSize: "8px",
            fontWeight: 700,
            color,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}
