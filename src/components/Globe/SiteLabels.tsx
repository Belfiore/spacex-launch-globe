"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToPosition } from "@/lib/coordUtils";
import { GLOBE, SITE_GROUPS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

/**
 * Permanent labels at the 3 main US launch sites: CC (Cape Canaveral),
 * BC (Boca Chica / Starbase), V (Vandenberg).
 * Shows abbreviated labels when zoomed out, full pad names when zoomed in
 * or when a launch at that site is selected.
 *
 * Clicking a site label filters to that site + animates camera.
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
  /** Matching SITE_GROUPS key for filtering */
  groupKey: string;
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
    groupKey: "CC",
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
    groupKey: "BC",
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
    groupKey: "V",
  },
  {
    id: "kwajalein",
    abbr: "OI",
    name: "Omelek Island",
    fullName: "Kwajalein Atoll Omelek Island",
    pads: [
      { id: "kwajalein", name: "Omelek Is.", lat: 9.0477, lng: 167.7431 },
    ],
    lat: 9.0477,
    lng: 167.7431,
    color: "#fb923c", // orange
    groupKey: "OI",
  },
];

/** Individual site label with zoom-awareness and click-to-filter */
function SiteLabelItem({ site }: { site: SiteLabel }) {
  const { camera } = useThree();
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const activeSites = useAppStore((s) => s.filters.sites);
  const [isClose, setIsClose] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wasCloseRef = useRef(false);

  const isActive = activeSites.includes(site.groupKey);

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

  /** Click handler: filter to this site + animate camera */
  function handleClick() {
    // Find the matching SITE_GROUP
    const group = SITE_GROUPS.find((g) => g.key === site.groupKey);
    if (!group) return;

    useAppStore.setState({
      // Reset other filters, set only this site
      filters: {
        search: "",
        rocketType: null,
        status: null,
        site: null,
        sites: [site.groupKey],
      },
      // Animate camera to site
      cameraTarget: { lat: site.lat, lng: site.lng },
      orbitCenter: "launch" as const,
      // Deselect any launch so panel shows filtered list
      selectedLaunch: null,
      miniTimelinePlaying: false,
      playbackState: "stopped" as const,
      trajectoryProgress: 0,
    });
  }

  return (
    <group position={position}>
      {/* Small permanent dot */}
      <mesh>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshBasicMaterial color={site.color} transparent opacity={isHovered ? 1 : 0.7} />
      </mesh>

      {/* Hover pulse ring */}
      {isHovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.035, 24]} />
          <meshBasicMaterial
            color={site.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Active indicator ring (when site is filtered) */}
      {isActive && !isHovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.03, 24]} />
          <meshBasicMaterial
            color={site.color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Label — clickable */}
      <Html
        position={[0, 0.06, 0]}
        center
        zIndexRange={[0, 0]}
        style={{ pointerEvents: "auto" }}
      >
        <div
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1px",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: "4px",
            transition: "all 0.15s ease",
            background: isHovered ? "rgba(255, 255, 255, 0.06)" : "transparent",
            filter: isHovered
              ? `drop-shadow(0 0 6px ${site.color}80)`
              : "none",
          }}
        >
          <span
            style={{
              fontSize: isClose || selectedPad ? "11px" : "10px",
              fontWeight: 700,
              color: isHovered ? "#ffffff" : site.color,
              textShadow: `0 0 8px ${site.color}60, 0 1px 3px rgba(0,0,0,0.8)`,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {topLabel}
          </span>
          <span
            style={{
              fontSize: isClose || selectedPad ? "8px" : "7px",
              color: isHovered ? "#cbd5e1" : "#94a3b8",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
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
