"use client";

import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Compact icon-only toolbar for camera & display controls.
 * Rendered inline (not fixed-positioned) — parent positions it.
 */

function ToolbarButton({
  icon,
  tooltip,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="toolbar-btn"
      data-active={active || undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={tooltip}
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(34, 211, 238, 0.15)" : "transparent",
        border: "none",
        color: disabled ? "#334155" : active ? "#22d3ee" : "#94a3b8",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: "14px",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}

function ISSToggle() {
  const showISS = useAppStore((s) => s.showISS);
  const toggleISS = useAppStore((s) => s.toggleISS);

  return (
    <button
      className="toolbar-btn"
      data-active={showISS || undefined}
      onClick={(e) => {
        e.stopPropagation();
        toggleISS();
      }}
      title={showISS ? "Hide ISS orbit" : "Show ISS orbit"}
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: showISS ? "rgba(34, 211, 238, 0.15)" : "transparent",
        border: "none",
        color: showISS ? "#22d3ee" : "#94a3b8",
        cursor: "pointer",
        fontSize: "14px",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {"🛰"}
    </button>
  );
}

function StarlinkToggle() {
  const showStarlink = useAppStore((s) => s.showStarlink);
  const toggleStarlink = useAppStore((s) => s.toggleStarlink);
  const starlinkCount = useAppStore((s) => s.starlinkCount);

  return (
    <button
      className="toolbar-btn"
      data-active={showStarlink || undefined}
      onClick={(e) => {
        e.stopPropagation();
        toggleStarlink();
      }}
      title={
        showStarlink
          ? `Hide Starlink constellation (${starlinkCount.toLocaleString()} sats)`
          : "Show Starlink constellation"
      }
      style={{
        height: "28px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        background: showStarlink ? "rgba(165, 200, 255, 0.15)" : "transparent",
        border: "none",
        color: showStarlink ? "#a5c8ff" : "#94a3b8",
        cursor: "pointer",
        fontSize: "10px",
        padding: "0 6px",
        flexShrink: 0,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "14px" }}>✦</span>
      <span>
        {showStarlink && starlinkCount > 0
          ? `${(starlinkCount / 1000).toFixed(1)}k`
          : "SL"}
      </span>
    </button>
  );
}

export default function ControlsPanel() {
  const isMobile = useIsMobile();
  const orbitCenter = useAppStore((s) => s.orbitCenter);
  const setOrbitCenter = useAppStore((s) => s.setOrbitCenter);
  const resetView = useAppStore((s) => s.resetView);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const centerOnLaunch = useAppStore((s) => s.centerOnLaunch);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);

  // Hide on mobile
  if (isMobile) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <ToolbarButton
        icon="🇺🇸"
        tooltip="Center on USA"
        active={orbitCenter === "usa"}
        onClick={() => setOrbitCenter("usa")}
      />
      <ToolbarButton
        icon="🌍"
        tooltip="Center on Earth"
        active={orbitCenter === "earth"}
        onClick={() => setOrbitCenter("earth")}
      />
      <ToolbarButton
        icon="🎯"
        tooltip="Center on launch site"
        active={orbitCenter === "launch"}
        disabled={!selectedLaunch}
        onClick={centerOnLaunch}
      />
      <ToolbarButton
        icon="↻"
        tooltip="Reset camera view"
        onClick={resetView}
      />
      <div
        style={{
          width: "1px",
          height: "18px",
          background: "rgba(255, 255, 255, 0.08)",
          margin: "0 2px",
          flexShrink: 0,
        }}
      />
      <ISSToggle />
      <StarlinkToggle />
      <ToolbarButton
        icon="👁"
        tooltip="Focus mode — hide all UI"
        onClick={toggleFocusMode}
      />
    </div>
  );
}
