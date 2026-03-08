"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function LoadingScreen() {
  const loading = useAppStore((s) => s.loading);
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!loading) {
      // Fade out
      setOpacity(0);
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0e1a",
        opacity,
        transition: "opacity 0.6s ease",
        pointerEvents: loading ? "auto" : "none",
      }}
    >
      {/* Logo / Title */}
      <div
        style={{
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          SpaceX Launch Globe
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#475569",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Mission Control
        </div>
      </div>

      {/* Spinner */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "2px solid rgba(34, 211, 238, 0.15)",
          borderTopColor: "#22d3ee",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      />

      <p
        style={{
          fontSize: "13px",
          color: "#64748b",
          letterSpacing: "0.02em",
        }}
      >
        Loading launch data...
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
