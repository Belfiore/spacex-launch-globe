"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function Wordmark() {
  const resetView = useAppStore((s) => s.resetView);
  const entryPhase = useAppStore((s) => s.entryPhase);
  const focusMode = useAppStore((s) => s.focusMode);
  const [hovered, setHovered] = useState(false);

  // Hidden during loading (loading screen has its own title)
  if (entryPhase === "loading") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 20,
        zIndex: 30,
        cursor: "pointer",
        pointerEvents: focusMode ? "none" : "auto",
        transition: "opacity 0.3s ease",
        opacity: focusMode ? 0 : hovered ? 1 : 0.6,
      }}
      onClick={() => {
        resetView();
        // Also scroll timeline to now
        useAppStore.getState().setTimelineDate(new Date());
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Reset to default view"
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#e2e8f0",
          textTransform: "uppercase",
          lineHeight: 1,
          marginBottom: 2,
        }}
      >
        Rocket Manifest
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          letterSpacing: "0.06em",
          opacity: 0.5,
        }}
      >
        SpaceX Launch Tracker
      </div>
    </div>
  );
}
