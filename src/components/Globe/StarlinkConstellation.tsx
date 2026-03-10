"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useStarlinkPositions } from "@/hooks/useStarlinkPositions";
import type { SatMetadata } from "@/lib/starlink/types";

const POINT_SIZE = 1.8;
const HOVER_DISTANCE_THRESHOLD = 0.08; // World units for raycast hit

/**
 * Renders all Starlink satellites as a single THREE.Points cloud.
 * Uses BufferGeometry with Float32Array for max performance.
 * Includes raycasting for hover/tap tooltips.
 */
export default function StarlinkConstellation() {
  const data = useStarlinkPositions(true);
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, raycaster, pointer } = useThree();
  const [hovered, setHovered] = useState<SatMetadata | null>(null);
  const [tooltipPos, setTooltipPos] = useState<THREE.Vector3>(
    new THREE.Vector3()
  );
  const lastHoverCheck = useRef(0);

  // Create the geometry from position data
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    if (data && data.count > 0) {
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(data.positions, 3)
      );
    }
    return geo;
  }, [data]);

  // Point material with soft circular shape
  const material = useMemo(() => {
    // Create circular point texture
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.3, "rgba(200, 220, 255, 0.8)");
    gradient.addColorStop(0.7, "rgba(100, 150, 255, 0.3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    return new THREE.PointsMaterial({
      size: POINT_SIZE,
      sizeAttenuation: false,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color("#a5c8ff"),
    });
  }, []);

  // Raycast hover check — throttled to every 100ms
  const checkHover = useCallback(() => {
    if (!data || !pointsRef.current) return;

    raycaster.setFromCamera(pointer, camera);
    raycaster.params.Points = { threshold: HOVER_DISTANCE_THRESHOLD };

    const intersects = raycaster.intersectObject(pointsRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].index;
      if (idx !== undefined && idx < data.metadata.length) {
        const meta = data.metadata[idx];
        setHovered(meta);
        setTooltipPos(intersects[0].point.clone());
        return;
      }
    }
    setHovered(null);
  }, [data, camera, raycaster, pointer]);

  useFrame(() => {
    const now = performance.now();
    if (now - lastHoverCheck.current > 100) {
      lastHoverCheck.current = now;
      checkHover();
    }
  });

  if (!data || data.count === 0) return null;

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} />

      {/* Tooltip on hover */}
      {hovered && (
        <Html
          position={[tooltipPos.x, tooltipPos.y, tooltipPos.z]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(100, 150, 255, 0.3)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#e2e8f0",
              fontSize: "11px",
              whiteSpace: "nowrap",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              lineHeight: 1.5,
              backdropFilter: "blur(8px)",
              transform: "translateY(-20px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "12px",
                color: "#a5c8ff",
                marginBottom: "2px",
              }}
            >
              🛰 {hovered.name}
            </div>
            <div style={{ color: "#94a3b8" }}>
              Alt: {hovered.alt} km · NORAD: {hovered.noradId}
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: "9px",
                marginTop: "2px",
                fontStyle: "italic",
              }}
            >
              Estimated position via SGP4
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
