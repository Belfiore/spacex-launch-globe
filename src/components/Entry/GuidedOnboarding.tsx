"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  onComplete: () => void;
}

/**
 * Shows a "View Next Launch" tooltip that the user can click
 * to focus on the next upcoming launch and start playback.
 * Dismisses when clicked, when user clicks a card, or after 12s.
 */
export default function GuidedOnboarding({ onComplete }: Props) {
  const launches = useAppStore((s) => s.launches);
  const setPanelOpen = useAppStore((s) => s.setPanelOpen);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const setOrbitCenter = useAppStore((s) => s.setOrbitCenter);
  const setTrajectoryProgress = useAppStore((s) => s.setTrajectoryProgress);
  const startMissionPlayback = useAppStore((s) => s.startMissionPlayback);

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

  // Focus on next launch and start playback
  const handleViewNext = useCallback(() => {
    if (!nextUpcoming) return;
    setPanelOpen(true);
    setSelectedLaunch(nextUpcoming);
    setCameraTarget({
      lat: nextUpcoming.launchSite.lat,
      lng: nextUpcoming.launchSite.lng,
    });
    setTimelineDate(new Date(nextUpcoming.dateUtc));
    setTrajectoryProgress(0);
    setOrbitCenter("launch");
    setTimeout(() => startMissionPlayback(), 100);
    dismiss();
  }, [
    nextUpcoming,
    setPanelOpen,
    setSelectedLaunch,
    setCameraTarget,
    setTimelineDate,
    setTrajectoryProgress,
    setOrbitCenter,
    startMissionPlayback,
    dismiss,
  ]);

  // Open panel and show tooltip after a brief delay
  useEffect(() => {
    if (!nextUpcoming || dismissedRef.current) return;

    setPanelOpen(true);

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

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 12000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  if (!show || !nextUpcoming) return null;

  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        top: 170,
        right: 40,
        background: "rgba(6, 182, 212, 0.10)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(6, 182, 212, 0.35)",
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 13,
        color: "#e2e8f0",
        lineHeight: 1.5,
        maxWidth: 300,
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.5), 0 0 20px rgba(6, 182, 212, 0.12)",
        zIndex: 82,
        pointerEvents: "auto",
        animation: "toast-slide-in 0.4s ease-out",
        cursor: "pointer",
      }}
      onClick={handleViewNext}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{"🚀"}</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            View Next Launch
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {nextUpcoming.name} &middot;{" "}
            {new Date(nextUpcoming.dateUtc).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 16,
            color: "#22d3ee",
            flexShrink: 0,
          }}
        >
          {"▶"}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        style={{
          position: "absolute",
          top: 4,
          right: 8,
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: "2px 4px",
        }}
        aria-label="Dismiss"
      >
        {"\u00D7"}
      </button>
    </div>
  );
}
