"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";

const SHOW_WINDOW_MS = 5 * 60 * 60 * 1000; // ±5 hours

function formatCountdown(diffMs: number): string {
  const sign = diffMs < 0 ? "-" : "+";
  const abs = Math.abs(diffMs);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1_000);
  return `T${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Fixed-position HUD showing mission name + T± countdown
 * whenever the timeline is within ±5 hours of a launch.
 */
export default function CountdownOverlay() {
  const launches = useAppStore((s) => s.launches);
  const timelineDate = useAppStore((s) => s.timelineDate);

  // Find the closest launch within the show window
  const activeLaunch = useMemo(() => {
    let best = null;
    let bestDiff = Infinity;
    for (const l of launches) {
      const diff = Math.abs(
        timelineDate.getTime() - new Date(l.dateUtc).getTime()
      );
      if (diff < SHOW_WINDOW_MS && diff < bestDiff) {
        bestDiff = diff;
        best = l;
      }
    }
    return best;
  }, [launches, timelineDate]);

  if (!activeLaunch) return null;

  const diffMs =
    timelineDate.getTime() - new Date(activeLaunch.dateUtc).getTime();
  const countdown = formatCountdown(diffMs);
  const isPre = diffMs < 0;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isPre ? "rgba(245, 158, 11, 0.35)" : "rgba(34, 211, 238, 0.25)"}`,
        borderRadius: "12px",
        padding: "8px 22px",
        pointerEvents: "none",
        boxShadow: `0 0 30px ${isPre ? "rgba(245,158,11,0.15)" : "rgba(34,211,238,0.12)"}`,
      }}
    >
      {/* Mission name */}
      <div
        style={{
          fontSize: "10px",
          color: "#64748b",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
        }}
      >
        {activeLaunch.name}
      </div>

      {/* T± countdown */}
      <div
        style={{
          fontSize: "22px",
          fontFamily: "monospace",
          fontWeight: 700,
          color: isPre ? "#f59e0b" : "#22d3ee",
          letterSpacing: "0.08em",
          textShadow: `0 0 20px ${isPre ? "rgba(245,158,11,0.5)" : "rgba(34,211,238,0.5)"}`,
          whiteSpace: "nowrap",
        }}
      >
        {countdown}
      </div>

      {/* Status label */}
      <div
        style={{
          fontSize: "9px",
          color: isPre ? "#f59e0b" : "#22d3ee",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          opacity: 0.7,
        }}
      >
        {isPre ? "to launch" : "elapsed"}
      </div>
    </div>
  );
}
