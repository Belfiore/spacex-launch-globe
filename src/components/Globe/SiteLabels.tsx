"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { latLngToPosition } from "@/lib/coordUtils";
import { GLOBE } from "@/lib/constants";

/**
 * Permanent labels at the 3 main US launch sites: CC (Cape Canaveral),
 * BC (Boca Chica / Starbase), V (Vandenberg).
 * These labels are always visible on the globe for orientation.
 */

interface SiteLabel {
  id: string;
  abbr: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

const SITE_LABELS: SiteLabel[] = [
  {
    id: "cape-canaveral",
    abbr: "CC",
    name: "Cape Canaveral",
    lat: 28.58,
    lng: -80.59,
    color: "#22d3ee", // cyan
  },
  {
    id: "boca-chica",
    abbr: "BC",
    name: "Starbase",
    lat: 25.997,
    lng: -97.156,
    color: "#f59e0b", // amber
  },
  {
    id: "vandenberg",
    abbr: "V",
    name: "Vandenberg",
    lat: 34.632,
    lng: -120.611,
    color: "#a78bfa", // violet
  },
];

export default function SiteLabels() {
  const labels = useMemo(
    () =>
      SITE_LABELS.map((site) => ({
        ...site,
        position: latLngToPosition(site.lat, site.lng, GLOBE.RADIUS + 0.03),
      })),
    []
  );

  return (
    <>
      {labels.map((site) => (
        <group key={site.id} position={site.position}>
          {/* Small permanent dot */}
          <mesh>
            <sphereGeometry args={[0.015, 12, 12]} />
            <meshBasicMaterial color={site.color} transparent opacity={0.7} />
          </mesh>

          {/* Always-visible label */}
          <Html
            position={[0, 0.06, 0]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: site.color,
                  textShadow: `0 0 8px ${site.color}60, 0 1px 3px rgba(0,0,0,0.8)`,
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                }}
              >
                {site.abbr}
              </span>
              <span
                style={{
                  fontSize: "7px",
                  color: "#94a3b8",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {site.name}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
