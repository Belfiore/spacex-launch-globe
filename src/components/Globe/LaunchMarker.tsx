"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToPosition, latLngToVector3 } from "@/lib/coordUtils";
import { GLOBE, getSiteAccentColor, getSiteKey } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { Launch } from "@/lib/types";

interface LaunchMarkerProps {
  launch: Launch;
  isSelected: boolean;
  onClick: () => void;
}

export default function LaunchMarker({
  launch,
  isSelected,
  onClick,
}: LaunchMarkerProps) {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const pulseOffset = useRef(Math.random() * 2.2);
  const [hovered, setHovered] = useState(false);
  const miniTimelinePlaying = useAppStore((s) => s.miniTimelinePlaying);
  const trajectoryProgress = useAppStore((s) => s.trajectoryProgress);

  const accentColor = getSiteAccentColor(launch.launchSite.id);
  const siteKey = getSiteKey(launch.launchSite.id);
  const color = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  const position = useMemo(
    () =>
      latLngToPosition(
        launch.launchSite.lat,
        launch.launchSite.lng,
        GLOBE.RADIUS + 0.003
      ),
    [launch.launchSite.lat, launch.launchSite.lng]
  );

  const ringQuaternion = useMemo(() => {
    const normal = latLngToVector3(
      launch.launchSite.lat,
      launch.launchSite.lng,
      1
    ).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [launch.launchSite.lat, launch.launchSite.lng]);

  useFrame(({ clock }) => {
    if (!pulseRingRef.current) return;
    const CYCLE = 2.5;
    const t = ((clock.elapsedTime + pulseOffset.current) % CYCLE) / CYCLE;
    pulseRingRef.current.scale.setScalar(1 + t * 2);
    (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity =
      (1 - t) * 0.35;
  });

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = "pointer";
  }, []);
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  // Hide the tooltip during active playback / trajectory animation
  // to avoid blocking the rocket and trajectory arc
  const isFlying = miniTimelinePlaying || trajectoryProgress > 0.02;
  const showTooltip = (isSelected || hovered) && !isFlying;

  return (
    <group position={position}>
      {/* Subtle pulse ring */}
      <mesh ref={pulseRingRef} quaternion={ringQuaternion}>
        <ringGeometry args={[0.006, 0.01, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Invisible larger hit area for mouse interaction */}
      <mesh
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible dot — Google Maps style pin */}
      <mesh>
        <sphereGeometry args={[isSelected ? 0.012 : hovered ? 0.009 : 0.006, 10, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 1.0 : 0.9}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh quaternion={ringQuaternion}>
          <ringGeometry args={[0.016, 0.021, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Tooltip — hidden during playback so it doesn't block the rocket */}
      {showTooltip && (
        <Html
          center
          zIndexRange={[0, 0]}
          style={{ pointerEvents: "none", transform: "translateY(-18px)" }}
        >
          <div
            style={{
              background: "rgba(10, 14, 26, 0.92)",
              border: `1px solid ${accentColor}66`,
              borderRadius: "4px",
              padding: "3px 7px",
              whiteSpace: "nowrap",
              fontFamily: "system-ui, -apple-system, sans-serif",
              boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
              textAlign: "center",
            }}
          >
            {isSelected ? (
              <>
                <div style={{ fontSize: "10px", fontWeight: 600, color: accentColor, lineHeight: 1.3 }}>
                  {launch.name}
                </div>
                <div style={{ fontSize: "8px", color: "#94a3b8", lineHeight: 1.2 }}>
                  {launch.launchSite.name}
                </div>
              </>
            ) : (
              <div style={{ fontSize: "9px", fontWeight: 600, color: accentColor }}>
                {siteKey}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
