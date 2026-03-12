"use client";

import { useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSpaceXData } from "@/hooks/useSpaceXData";
import { useAppStore } from "@/store/useAppStore";
import LaunchPanel from "@/components/LaunchPanel/LaunchPanel";
import MiniLaunchCard from "@/components/LaunchPanel/MiniLaunchCard";
import Timeline from "@/components/Timeline/Timeline";

import CinematicEntry from "@/components/Entry/CinematicEntry";
import Wordmark from "@/components/Entry/Wordmark";
import MiniTimeline from "@/components/UI/MiniTimeline";
import InfoPanel from "@/components/InfoPanel/InfoPanel";
import MobileBottomSheet from "@/components/LaunchPanel/MobileBottomSheet";
import MobileFilterMenu from "@/components/UI/MobileFilterMenu";

const Globe = dynamic(() => import("@/components/Globe/Globe"), {
  ssr: false,
  loading: () => null,
});

function FocusModeExitButton() {
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);

  if (!focusMode) return null;

  return (
    <button
      onClick={() => setFocusMode(false)}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 50,
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(10, 14, 26, 0.8)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.3s ease",
      }}
      title="Exit focus mode (Esc)"
    >
      {"👁"}
    </button>
  );
}

// Timeline toggle removed from desktop — timeline always visible.
// Mobile/tablet toggle lives in MobileBottomSheet.

export default function Home() {
  useSpaceXData();

  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const entryPhase = useAppStore((s) => s.entryPhase);
  const launches = useAppStore((s) => s.launches);
  const autoSelectedRef = useRef(false);

  // Auto-select next upcoming launch when entry completes
  // This ensures: MiniTimeline shows, MiniLaunchCard centers on next launch, map navigates
  useEffect(() => {
    if (entryPhase !== "complete" || autoSelectedRef.current) return;
    const { selectedLaunch } = useAppStore.getState();
    if (selectedLaunch) return;
    const now = Date.now();
    const next = launches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
    if (next) {
      autoSelectedRef.current = true;
      useAppStore.setState({
        selectedLaunch: next,
        cameraTarget: { lat: next.launchSite.lat, lng: next.launchSite.lng },
        timelineDate: new Date(next.dateUtc),
        orbitCenter: "launch" as const,
        trajectoryProgress: 1,
      });
    }
  }, [entryPhase, launches]);

  // Escape key exits focus mode
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    },
    [focusMode, setFocusMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Globe />

      {/* Controls toolbar — integrated into LaunchPanel header */}

      {/* Persistent wordmark — top left */}
      <Wordmark />

      {/* Mini mission timeline — above main timeline */}
      <MiniTimeline />

      {/* Info panel — left side */}
      <InfoPanel />

      <LaunchPanel />
      <MiniLaunchCard />
      <Timeline />
      <MobileBottomSheet />
      <CinematicEntry />

      {/* Filter/settings menu — top-right */}
      <MobileFilterMenu />

      {/* Timeline always visible on desktop; mobile toggle in MobileBottomSheet */}

      {/* Focus mode exit button */}
      <FocusModeExitButton />
    </main>
  );
}
