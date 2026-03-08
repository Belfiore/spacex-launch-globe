"use client";

import { usePlayback } from "@/hooks/usePlayback";
import { useAppStore } from "@/store/useAppStore";

export default function PlaybackControls() {
  const {
    playbackState,
    togglePlayback,
    reset,
    nextLaunch,
    prevLaunch,
  } = usePlayback();

  const resetView = useAppStore((s) => s.resetView);

  const navButtonStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "88px",
        left: "24px",
        zIndex: 35,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Previous launch */}
      <button
        onClick={prevLaunch}
        style={navButtonStyle}
        title="Previous launch"
      >
        ⟨
      </button>

      {/* Play/Pause */}
      <button
        onClick={togglePlayback}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            playbackState === "playing"
              ? "rgba(34, 211, 238, 0.2)"
              : "rgba(34, 211, 238, 0.1)",
          border: `1px solid ${
            playbackState === "playing"
              ? "rgba(34, 211, 238, 0.5)"
              : "rgba(34, 211, 238, 0.2)"
          }`,
          color: "#22d3ee",
          cursor: "pointer",
          fontSize: "16px",
          transition: "all 0.2s ease",
          boxShadow:
            playbackState === "playing"
              ? "0 0 15px rgba(34, 211, 238, 0.3)"
              : "none",
        }}
        title={playbackState === "playing" ? "Pause" : "Play"}
      >
        {playbackState === "playing" ? "⏸" : "▶"}
      </button>

      {/* Next launch */}
      <button
        onClick={nextLaunch}
        style={navButtonStyle}
        title="Next launch"
      >
        ⟩
      </button>

      {/* Reset */}
      <button
        onClick={reset}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "12px",
          transition: "all 0.2s ease",
        }}
        title="Reset to current date"
      >
        ⟲
      </button>

      {/* Reset View button */}
      <button
        onClick={resetView}
        style={{
          padding: "4px 12px",
          borderRadius: "6px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 500,
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
        title="Reset globe to default view"
      >
        ⌂ Reset View
      </button>
    </div>
  );
}
