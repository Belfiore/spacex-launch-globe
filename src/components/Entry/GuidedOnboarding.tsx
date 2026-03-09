"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import "./entry-animations.css";

interface Props {
  onComplete: () => void;
}

/**
 * Simplified onboarding — shows a tooltip prompting user to click a launch.
 * No auto-click, no auto-play. The user interacts at their own pace.
 * Once the user clicks any card, onboarding completes.
 */
export default function GuidedOnboarding({ onComplete }: Props) {
  const launches = useAppStore((s) => s.launches);
  const setPanelOpen = useAppStore((s) => s.setPanelOpen);

  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);

  // Find next upcoming launch
  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return launches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [launches]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setShow(false);
    onComplete();
  }, [onComplete]);

  // Open panel and show tooltip after a brief delay
  useEffect(() => {
    if (!nextUpcoming || dismissedRef.current) return;

    setPanelOpen(true);

    // Brief delay to let panel open & scroll, then show tooltip
    const timer = setTimeout(() => {
      if (!dismissedRef.current) {
        setShow(true);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextUpcoming?.id]);

  // When user clicks any launch card, onboarding completes
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (state.selectedLaunch && !dismissedRef.current) {
        dismiss();
      }
    });
    return unsub;
  }, [dismiss]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismiss]);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 15000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  if (!show || !nextUpcoming) return null;

  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        // Position in the top-right area, inside the panel
        top: 80,
        right: 24,
        background: "rgba(6, 182, 212, 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(6, 182, 212, 0.4)",
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: 13,
        color: "#e2e8f0",
        lineHeight: 1.5,
        maxWidth: 280,
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(6, 182, 212, 0.15)",
        zIndex: 82,
        pointerEvents: "auto",
        animation: "toast-slide-in 0.4s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{"👆"}</span>
        <span>
          Tap the <strong style={{ color: "#22d3ee" }}>next launch</strong> to
          preview the mission
        </span>
      </div>
      <button
        onClick={dismiss}
        style={{
          position: "absolute",
          top: 2,
          right: 6,
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: "2px 4px",
        }}
        aria-label="Dismiss tip"
      >
        {"\u00D7"}
      </button>
    </div>
  );
}
