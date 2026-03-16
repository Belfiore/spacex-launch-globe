"use client";

import { useMemo } from "react";
import type { Launch } from "@/lib/types";
import { getSiteAccentColor } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import Tooltip from "@/components/UI/Tooltip";

interface LaunchCardProps {
  launch: Launch;
  isSelected: boolean;
  isNext: boolean;
  onClick: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

function formatDate(dateUtc: string): string {
  const d = new Date(dateUtc);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateUtc: string): string {
  const d = new Date(dateUtc);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "badge-upcoming" },
  success: { label: "Success", className: "badge-success" },
  failure: { label: "Failure", className: "badge-failure" },
  partial_failure: { label: "Partial", className: "badge-failure" },
  prelaunch_failure: { label: "Pad Failure", className: "badge-failure" },
  scrubbed: { label: "Scrubbed", className: "badge-upcoming" },
  unknown: { label: "Unknown", className: "badge-upcoming" },
};

export default function LaunchCard({
  launch,
  isSelected,
  isNext,
  onClick,
  onPlay,
  onPause,
}: LaunchCardProps) {
  // Use granular launchStatus when available, fall back to simple status
  const statusKey = launch.launchStatus ?? launch.status;
  const status = statusConfig[statusKey] ?? statusConfig[launch.status];
  const accentColor = getSiteAccentColor(launch.launchSite.id);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const playbackState = useAppStore((s) => s.playbackState);
  const miniTimelinePlaying = useAppStore((s) => s.miniTimelinePlaying);
  const infoPanelLaunchId = useAppStore((s) => s.infoPanelLaunchId);
  const setInfoPanelLaunchId = useAppStore((s) => s.setInfoPanelLaunchId);
  const isMobile = useIsMobile();

  // This launch is actively playing if it's selected AND playback/mini is active
  const isPlaying =
    selectedLaunch?.id === launch.id &&
    (playbackState === "playing" || miniTimelinePlaying);


  // 24-hour launch pulse for returning visitors
  const entryPhase = useAppStore((s) => s.entryPhase);
  const isWithin24h = useMemo(() => {
    if (!isNext || launch.status !== "upcoming") return false;
    const launchTime = new Date(launch.dateUtc).getTime();
    const diff = launchTime - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }, [isNext, launch.status, launch.dateUtc]);
  const showPulse = isWithin24h && entryPhase === "complete" && !isSelected;

  const borderStyle = useMemo(() => {
    if (isSelected) return `1px solid ${accentColor}80`;
    if (isNext) return "1px solid rgba(34, 211, 238, 0.3)";
    return "1px solid rgba(255, 255, 255, 0.04)";
  }, [isSelected, isNext, accentColor]);

  const shadowStyle = useMemo(() => {
    if (isSelected) return `0 0 20px ${accentColor}25`;
    if (isNext) return "0 0 10px rgba(34, 211, 238, 0.1)";
    return "none";
  }, [isSelected, isNext, accentColor]);

  return (
    <>
      {/* "NEXT LAUNCH" marker above the next upcoming card */}
      {isNext && (
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "9px",
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#22d3ee",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: "rgba(34, 211, 238, 0.08)",
              border: "1px solid rgba(34, 211, 238, 0.25)",
              borderRadius: "4px",
              padding: "3px 10px",
            }}
          >
            Next Launch
          </span>
        </div>
      )}

      <div
        onClick={onClick}
        style={{
          background: isSelected
            ? `${accentColor}0d`
            : "rgba(255, 255, 255, 0.02)",
          border: borderStyle,
          boxShadow: shadowStyle,
          borderRadius: "10px",
          padding: "14px 14px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: "8px",
          animation: showPulse ? "card-pulse-24h 3s ease-in-out infinite" : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
            e.currentTarget.style.borderColor = isNext
              ? "rgba(34, 211, 238, 0.3)"
              : "rgba(255, 255, 255, 0.04)";
          }
        }}
      >
        {/* Header row — patch + name + play + badges */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "7px",
          }}
        >
          {/* Name + badges + play button */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#e2e8f0",
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {launch.name}
              </div>

              {/* Play/Pause toggle button */}
              {(onPlay || isPlaying) && (
                <Tooltip text={isPlaying ? "Pause" : "Watch launch"} position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying && onPause) {
                      onPause();
                    } else if (onPlay) {
                      onPlay();
                    }
                  }}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isPlaying
                      ? "rgba(34, 211, 238, 0.25)"
                      : "rgba(34, 211, 238, 0.12)",
                    border: "1px solid rgba(34, 211, 238, 0.5)",
                    color: "#22d3ee",
                    cursor: "pointer",
                    fontSize: isPlaying ? "11px" : "12px",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    padding: 0,
                    paddingLeft: isPlaying ? "0px" : "2px",
                    boxShadow: isPlaying
                      ? "0 0 12px rgba(34, 211, 238, 0.4)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(34, 211, 238, 0.3)";
                    e.currentTarget.style.boxShadow =
                      "0 0 12px rgba(34, 211, 238, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isPlaying
                      ? "rgba(34, 211, 238, 0.25)"
                      : "rgba(34, 211, 238, 0.12)";
                    e.currentTarget.style.boxShadow = isPlaying
                      ? "0 0 12px rgba(34, 211, 238, 0.4)"
                      : "none";
                  }}
                >
                  {isPlaying ? "\u23F8" : "\u25B6"}
                </button>
                </Tooltip>
              )}

              {/* Info button — shows for launches with flightHistory or details/webcast */}
              {(launch.flightHistory || launch.webcastUrl || launch.details) && (
                <Tooltip text="Flight details" position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoPanelLaunchId(
                      infoPanelLaunchId === launch.id ? null : launch.id
                    );
                  }}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      infoPanelLaunchId === launch.id
                        ? "rgba(34, 211, 238, 0.25)"
                        : "rgba(255, 255, 255, 0.06)",
                    border: `1px solid ${
                      infoPanelLaunchId === launch.id
                        ? "rgba(34, 211, 238, 0.5)"
                        : "rgba(255, 255, 255, 0.1)"
                    }`,
                    color:
                      infoPanelLaunchId === launch.id ? "#22d3ee" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    padding: 0,
                    fontFamily: "serif",
                  }}
                  onMouseEnter={(e) => {
                    if (infoPanelLaunchId !== launch.id) {
                      e.currentTarget.style.background =
                        "rgba(34, 211, 238, 0.12)";
                      e.currentTarget.style.color = "#22d3ee";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (infoPanelLaunchId !== launch.id) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  {"i"}
                </button>
                </Tooltip>
              )}

              <span className={`badge ${status.className}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px 12px",
            fontSize: "11px",
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.5 }}>📅</span>
            {formatDate(launch.dateUtc)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.5 }}>🕐</span>
            {formatTime(launch.dateUtc)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.5 }}>📍</span>
            {launch.launchSite.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.5 }}>🚀</span>
            {launch.rocketType}
          </div>
        </div>

        {/* Expanded details — shown when card is selected */}
        {isSelected && (
          <div
            style={{
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: "11px",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            {launch.payloadOrbit && (
              <div style={{ marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Orbit: </span>
                <span style={{ color: accentColor }}>{launch.payloadOrbit}</span>
              </div>
            )}
            {launch.boosterReturn && (
              <div style={{ marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Recovery: </span>
                <span style={{ color: "#f59e0b" }}>
                  {launch.boosterReturn.landingType}
                </span>
                {launch.landingZone && (
                  <span style={{ color: "#64748b" }}> ({launch.landingZone})</span>
                )}
              </div>
            )}
            {/* Core info — show booster serial and reuse count */}
            {launch.cores && launch.cores.length > 0 && launch.cores[0].core_serial && (
              <div style={{ marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Booster: </span>
                <span style={{ color: "#22d3ee", fontFamily: "monospace", fontWeight: 600, fontSize: "10px" }}>
                  {launch.cores[0].core_serial}
                </span>
                {launch.cores[0].core_flight_number && (
                  <span style={{ color: "#64748b" }}> (Flight #{launch.cores[0].core_flight_number})</span>
                )}
              </div>
            )}
            {/* Failure summary */}
            {launch.failureSummary && (
              <div style={{ color: "#fca5a5", marginBottom: "4px", fontSize: "10px" }}>
                {launch.failureSummary}
              </div>
            )}
            {launch.details && (
              <div style={{ color: "#64748b" }}>{launch.details}</div>
            )}
            {!launch.details && !launch.payloadOrbit && !launch.failureSummary && (
              <div style={{ color: "#475569", fontStyle: "italic" }}>
                No additional details available
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
