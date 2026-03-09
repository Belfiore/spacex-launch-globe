"use client";

import { useAppStore } from "@/store/useAppStore";

const BTN_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  width: "100%",
  padding: "6px 10px",
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  fontSize: "10px",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  letterSpacing: "0.04em",
  cursor: "pointer",
  borderRadius: "4px",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

function ControlButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_BASE,
        background: active ? "rgba(34, 211, 238, 0.12)" : "transparent",
        color: disabled ? "#334155" : active ? "#22d3ee" : "#94a3b8",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.color = "#e2e8f0";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = active
          ? "rgba(34, 211, 238, 0.12)"
          : "transparent";
        e.currentTarget.style.color = active ? "#22d3ee" : "#94a3b8";
      }}
    >
      <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: "8px",
        color: "#475569",
        padding: "4px 10px 2px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export default function ControlsPanel() {
  const orbitCenter = useAppStore((s) => s.orbitCenter);
  const setOrbitCenter = useAppStore((s) => s.setOrbitCenter);
  const resetView = useAppStore((s) => s.resetView);
  const showISS = useAppStore((s) => s.showISS);
  const toggleISS = useAppStore((s) => s.toggleISS);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const centerOnLaunch = useAppStore((s) => s.centerOnLaunch);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const focusMode = useAppStore((s) => s.focusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "100px",
        right: panelOpen ? "396px" : "16px",
        zIndex: 40,
        transition: "right 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
        opacity: focusMode ? 0 : 1,
        transform: focusMode ? "translateX(100px)" : "translateX(0)",
        pointerEvents: focusMode ? "none" : "auto",
        background: "rgba(10, 14, 26, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "8px",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        minWidth: "140px",
      }}
    >
      {/* Camera centering section */}
      <SectionLabel>Camera</SectionLabel>
      <ControlButton
        icon="🇺🇸"
        label="Center USA"
        active={orbitCenter === "usa"}
        onClick={() => setOrbitCenter("usa")}
      />
      <ControlButton
        icon="🌍"
        label="Center Earth"
        active={orbitCenter === "earth"}
        onClick={() => setOrbitCenter("earth")}
      />
      <ControlButton
        icon="🎯"
        label="Center Launch"
        active={orbitCenter === "launch"}
        disabled={!selectedLaunch}
        onClick={centerOnLaunch}
      />
      <div
        style={{
          height: "1px",
          background: "rgba(255, 255, 255, 0.06)",
          margin: "2px 6px",
        }}
      />
      <ControlButton icon="↻" label="Reset" onClick={resetView} />

      <div
        style={{
          height: "1px",
          background: "rgba(255, 255, 255, 0.06)",
          margin: "2px 6px",
        }}
      />

      {/* Display section */}
      <SectionLabel>Display</SectionLabel>

      {/* ISS Toggle Switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#94a3b8",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>
            🛰
          </span>
          ISS Orbit
        </span>
        <div
          onClick={toggleISS}
          style={{
            width: "28px",
            height: "14px",
            borderRadius: "7px",
            background: showISS ? "#22d3ee" : "#334155",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s ease",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: "2px",
              left: showISS ? "16px" : "2px",
              transition: "left 0.2s ease",
            }}
          />
        </div>
      </div>

      <div
        style={{
          height: "1px",
          background: "rgba(255, 255, 255, 0.06)",
          margin: "2px 6px",
        }}
      />

      <ControlButton
        icon="👁"
        label="Focus Mode"
        active={false}
        onClick={toggleFocusMode}
      />
    </div>
  );
}
