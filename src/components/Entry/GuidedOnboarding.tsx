"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  onComplete: () => void;
}

/**
 * Shows a "View Next Launch" tooltip anchored to the left of the
 * next upcoming launch card in the side panel. Clicking it focuses
 * on that launch and starts playback.
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
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const dismissedRef = useRef(false);
  const isMobile = useIsMobile();

  // Find most recent past launch (mobile) and next upcoming (desktop)
  const mostRecentLaunch = useMemo(() => {
    const now = Date.now();
    let recent: typeof launches[0] | null = null;
    for (const l of launches) {
      if (new Date(l.dateUtc).getTime() <= now) recent = l;
    }
    return recent;
  }, [launches]);

  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return launches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [launches]);

  const targetLaunch = isMobile
    ? mostRecentLaunch ?? nextUpcoming
    : nextUpcoming;

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setShow(false);
    onComplete();
  }, [onComplete]);

  // Focus on target launch and start playback
  const handleViewTarget = useCallback(() => {
    if (!targetLaunch) return;
    if (!isMobile) setPanelOpen(true);
    setSelectedLaunch(targetLaunch);
    setCameraTarget({
      lat: targetLaunch.launchSite.lat,
      lng: targetLaunch.launchSite.lng,
    });
    setTimelineDate(new Date(targetLaunch.dateUtc));
    setTrajectoryProgress(0);
    setOrbitCenter("launch");
    setTimeout(() => startMissionPlayback(), 100);
    dismiss();
  }, [
    targetLaunch,
    isMobile,
    setPanelOpen,
    setSelectedLaunch,
    setCameraTarget,
    setTimelineDate,
    setTrajectoryProgress,
    setOrbitCenter,
    startMissionPlayback,
    dismiss,
  ]);

  // Open panel and show tooltip after a brief delay.
  // Position tooltip relative to the upcoming launch card in the panel.
  useEffect(() => {
    if (!targetLaunch || dismissedRef.current) return;

    // Open the panel first (desktop only — use window.innerWidth directly
    // to avoid the useIsMobile hook's initial false state on SSR)
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (isDesktop) {
      setPanelOpen(true);
    }

    const timer = setTimeout(() => {
      if (dismissedRef.current) return;

      // Try to find the card element in the DOM
      if (isDesktop && targetLaunch) {
        const cardEl = document.querySelector(
          `[data-launch-id="${targetLaunch.id}"]`
        );
        if (cardEl) {
          setCardRect(cardEl.getBoundingClientRect());
        }
      }

      setShow(true);
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLaunch?.id]);

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

  if (!show || !targetLaunch) return null;

  // Position the tooltip to the LEFT of the card (desktop) or bottom (mobile)
  const tooltipStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 80,
        left: 16,
        right: 16,
        top: "auto",
      }
    : cardRect
      ? {
          position: "fixed",
          // Anchor to the left edge of the card, vertically centered
          top: cardRect.top + cardRect.height / 2 - 28,
          right: window.innerWidth - cardRect.left + 14,
        }
      : {
          // Fallback: right side at panel-level
          position: "fixed",
          top: 170,
          right: 40,
        };

  const tooltipTitle = isMobile ? "View Most Recent Launch" : "View Next Launch";

  return (
    <div
      role="tooltip"
      style={{
        ...tooltipStyle,
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
      onClick={handleViewTarget}
    >
      {/* Arrow pointing right toward the card (desktop only) */}
      {!isMobile && cardRect && (
        <div
          style={{
            position: "absolute",
            right: -8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderLeft: "8px solid rgba(6, 182, 212, 0.35)",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{"🚀"}</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {tooltipTitle}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {targetLaunch.name} &middot;{" "}
            {new Date(targetLaunch.dateUtc).toLocaleDateString("en-US", {
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
