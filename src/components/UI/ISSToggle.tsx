"use client";

import { useAppStore } from "@/store/useAppStore";

export default function ISSToggle() {
  const showISS = useAppStore((s) => s.showISS);
  const toggleISS = useAppStore((s) => s.toggleISS);

  return (
    <button
      onClick={toggleISS}
      style={{
        position: "fixed",
        top: "16px",
        right: "380px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: showISS
          ? "rgba(85, 136, 187, 0.2)"
          : "rgba(30, 35, 50, 0.7)",
        border: `1px solid ${showISS ? "#5588bb55" : "#334155"}`,
        borderRadius: "6px",
        padding: "5px 10px",
        cursor: "pointer",
        color: showISS ? "#88ccff" : "#64748b",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: showISS ? "#88ccff" : "#475569",
          boxShadow: showISS ? "0 0 6px #88ccff" : "none",
        }}
      />
      ISS
    </button>
  );
}
