"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * MobileFilterMenu — top-right filter icon that opens a dropdown overlay
 * with toggles for Show ISS, Show Starlink, and Hide UI.
 */
export default function MobileFilterMenu() {
  const isMobile = useIsMobile();
  const focusMode = useAppStore((s) => s.focusMode);
  const showISS = useAppStore((s) => s.showISS);
  const showStarlink = useAppStore((s) => s.showStarlink);
  const toggleISS = useAppStore((s) => s.toggleISS);
  const toggleStarlink = useAppStore((s) => s.toggleStarlink);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const entryPhase = useAppStore((s) => s.entryPhase);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handleTap = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleTap);
    document.addEventListener("touchstart", handleTap);
    return () => {
      document.removeEventListener("mousedown", handleTap);
      document.removeEventListener("touchstart", handleTap);
    };
  }, [open]);

  const handleHideUI = useCallback(() => {
    setOpen(false);
    setFocusMode(true);
  }, [setFocusMode]);

  // Hide during loading/intro or when UI is hidden
  if (focusMode || entryPhase !== "complete") return null;

  const activeCount = [showISS, showStarlink].filter(Boolean).length;

  return (
    <div ref={menuRef} style={{ position: "fixed", top: 14, right: 14, zIndex: 50 }}>
      <style>{`
        @keyframes filter-dropdown-in {
          from { opacity: 0; transform: scaleY(0.8) scaleX(0.95); }
          to   { opacity: 1; transform: scaleY(1) scaleX(1); }
        }
      `}</style>
      {/* Filter icon button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: open
            ? "rgba(34, 211, 238, 0.15)"
            : "rgba(18, 24, 41, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: open
            ? "1px solid rgba(34, 211, 238, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.08)",
          color: open ? "#22d3ee" : "#94a3b8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition: "all 0.25s ease",
          position: "relative",
        }}
      >
        {/* Filter/sliders icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        {/* Active count badge */}
        {activeCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#22d3ee",
              color: "#0a0e1a",
              fontSize: "8px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {activeCount}
          </div>
        )}
      </button>

      {/* Dropdown overlay */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: "180px",
            background: "rgba(18, 24, 41, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "8px 0",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            animation: "filter-dropdown-in 0.2s ease-out",
            transformOrigin: "top right",
          }}
        >
          {/* Section label */}
          <div
            style={{
              padding: "6px 14px 4px",
              fontSize: "9px",
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Layers
          </div>

          {/* Show ISS toggle */}
          <button
            onClick={toggleISS}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              background: "none",
              border: "none",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "18px",
                borderRadius: "9px",
                background: showISS
                  ? "rgba(34, 211, 238, 0.4)"
                  : "rgba(255, 255, 255, 0.1)",
                position: "relative",
                transition: "background 0.2s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: showISS ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: showISS ? "#22d3ee" : "#64748b",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
            <span>Show ISS</span>
          </button>

          {/* Show Starlink toggle */}
          <button
            onClick={toggleStarlink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              background: "none",
              border: "none",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "18px",
                borderRadius: "9px",
                background: showStarlink
                  ? "rgba(34, 211, 238, 0.4)"
                  : "rgba(255, 255, 255, 0.1)",
                position: "relative",
                transition: "background 0.2s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: showStarlink ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: showStarlink ? "#22d3ee" : "#64748b",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
            <span>Show Starlink</span>
          </button>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "rgba(255, 255, 255, 0.06)",
              margin: "4px 14px",
            }}
          />

          {/* Hide UI */}
          <button
            onClick={handleHideUI}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 14px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span>Hide UI</span>
          </button>
        </div>
      )}
    </div>
  );
}
