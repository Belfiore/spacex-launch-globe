"use client";

import { useMemo } from "react";
import type { Launch } from "@/lib/types";
import { getSiteAccentColor } from "@/lib/constants";

interface LaunchCardProps {
  launch: Launch;
  isSelected: boolean;
  isNext: boolean;
  onClick: () => void;
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

const statusConfig = {
  upcoming: { label: "Upcoming", className: "badge-upcoming" },
  success: { label: "Success", className: "badge-success" },
  failure: { label: "Failure", className: "badge-failure" },
};

export default function LaunchCard({
  launch,
  isSelected,
  isNext,
  onClick,
}: LaunchCardProps) {
  const status = statusConfig[launch.status];
  const accentColor = getSiteAccentColor(launch.launchSite.id);

  const borderStyle = useMemo(() => {
    if (isSelected) return `1px solid ${accentColor}80`;
    if (isNext) return "1px solid rgba(34, 211, 238, 0.2)";
    return "1px solid rgba(255, 255, 255, 0.04)";
  }, [isSelected, isNext, accentColor]);

  const shadowStyle = useMemo(() => {
    if (isSelected) return `0 0 20px ${accentColor}25`;
    if (isNext) return "0 0 10px rgba(34, 211, 238, 0.08)";
    return "none";
  }, [isSelected, isNext, accentColor]);

  const patchSize = isSelected ? 48 : 36;

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected
          ? `${accentColor}0d`
          : "rgba(255, 255, 255, 0.02)",
        border: borderStyle,
        boxShadow: shadowStyle,
        borderRadius: "10px",
        padding: "11px 12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: "8px",
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
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
        }
      }}
    >
      {/* Header row — patch + name + badge */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "7px",
        }}
      >
        {/* Mission patch (or rocket emoji placeholder) */}
        {launch.missionPatch ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={launch.missionPatch}
            alt={`${launch.name} patch`}
            width={patchSize}
            height={patchSize}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: `1px solid ${accentColor}30`,
              flexShrink: 0,
              transition: "width 0.2s, height 0.2s",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            style={{
              width: `${patchSize}px`,
              height: `${patchSize}px`,
              borderRadius: "50%",
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isSelected ? "18px" : "14px",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            🚀
          </div>
        )}

        {/* Name + badge column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
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
              }}
            >
              {launch.name}
            </div>
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

      {/* Expanded details */}
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
            </div>
          )}
          {launch.details && (
            <div style={{ color: "#64748b" }}>{launch.details}</div>
          )}
          {!launch.details && !launch.payloadOrbit && (
            <div style={{ color: "#475569", fontStyle: "italic" }}>
              No additional details available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
