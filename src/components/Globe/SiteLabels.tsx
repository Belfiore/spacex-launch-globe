"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToPosition } from "@/lib/coordUtils";
import { GLOBE } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

/**
 * Permanent labels at the 3 main US launch sites: CC (Cape Canaveral),
 * BC (Boca Chica / Starbase), V (Vandenberg).
 * Shows abbreviated labels when zoomed out, full pad names when zoomed in
 * or when a launch at that site is selected.
 */

interface PadInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface SiteLabel {
  id: string;
  abbr: string;
  name: string;
  fullName: string;
  pads: PadInfo[];
  lat: number;
  lng: number;
  color: string;
}

const SITE_LABELS: SiteLabel[] = [
  {
    id: "cape-canaveral",
    abbr: "CC",
    name: "Cape Canaveral",
    fullName: "Cape Canaveral Space Force Station",
    pads: [
      { id: "cape-canaveral-slc40", name: "SLC-40", lat: 28.5618, lng: -80.577 },
      { id: "ksc-lc39a", name: "LC-39A", lat: 28.608, lng: -80.604 },
    ],
    lat: 28.58,
    lng: -80.59,
    color: "#22d3ee", // cyan
  },
  {
    id: "boca-chica",
    abbr: "BC",
    name: "Starbase",
    fullName: "SpaceX Starbase, Boca Chica",
    pads: [
      { id: "boca-chica", name: "Starbase", lat: 25.9972, lng: -97.156 },
    ],
    lat: 25.997,
    lng: -97.156,
    color: "#f59e0b", // amber
  },
  {
    id: "vandenberg",
    abbr: "V",
    name: "Vandenberg",
    fullName: "Vandenberg Space Force Base",
    pads: [
      { id: "vandenberg-slc4e", name: "SLC-4E", lat: 34.632, lng: -120.611 },
    ],
    lat: 34.632,
    lng: -120.611,
    color: "#a78bfa", // violet
  },
];

/** Individual site label with zoom-awareness */
function SiteLabelItem({ site }: { site: SiteLabel }) {
  const { camera } = useThree();
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const [isClose, setIsClose] = useState(false);
  const wasCloseRef = useRef(false);

  const position = useMemo(
    () => latLngToPosition(site.lat, site.lng, GLOBE.RADIUS + 0.03),
    [site.lat, site.lng]
  );

  const siteWorldPos = useMemo(
    () => new THREE.Vector3(...position),
    [position]
  );

  // Check camera distance each frame — only setState when threshold changes
  useFrame(() => {
    const dist = camera.position.distanceTo(siteWorldPos);
    const nowClose = dist < 3.5;
    if (nowClose !== wasCloseRef.current) {
      wasCloseRef.current = nowClose;
      setIsClose(nowClose);
    }
  });

  // Determine which pad is selected (if any)
  const selectedPad = selectedLaunch
    ? site.pads.find((p) => p.id === selectedLaunch.launchSite.id)
    : null;

  // Determine label text based on zoom + selection
  let topLabel: string;
  let subLabel: string;
  if (selectedPad) {
    topLabel = selectedPad.name;
    subLabel = site.fullName;
  } else if (isClose) {
    topLabel = site.name;
    subLabel = site.pads.map((p) => p.name).join(" / ");
  } else {
    topLabel = site.abbr;
    subLabel = site.name;
  }

  return (
    <group position={position}>
      {/* Small permanent dot */}
      <mesh>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshBasicMaterial color={site.color} transparent opacity={0.7} />
      </mesh>

      {/* Label */}
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
              fontSize: isClose || selectedPad ? "11px" : "10px",
              fontWeight: 700,
              color: site.color,
              textShadow: `0 0 8px ${site.color}60, 0 1px 3px rgba(0,0,0,0.8)`,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {topLabel}
          </span>
          <span
            style={{
              fontSize: isClose || selectedPad ? "8px" : "7px",
              color: "#94a3b8",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {subLabel}
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function SiteLabels() {
  return (
    <>
      {SITE_LABELS.map((site) => (
        <SiteLabelItem key={site.id} site={site} />
      ))}
    </>
  );
}
