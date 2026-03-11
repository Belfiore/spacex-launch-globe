"use client";

import { useEffect, useCallback } from "react";
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
        bottom: "16px",
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

export default function Home() {
  useSpaceXData();

  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);

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

      {/* Focus mode exit button */}
      <FocusModeExitButton />
    </main>
  );
}
