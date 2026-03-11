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
  const [playBtnRect, setPlayBtnRect] = useState<DOMRect | null>(null);
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

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    const isMobileView = !isDesktop;

    // Mobile: skip if already shown this session
    if (isMobileView && typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem("rocket-manifest-tooltip-shown") === "1") {
        dismiss();
        return;
      }
      sessionStorage.setItem("rocket-manifest-tooltip-shown", "1");
    }

    // Open the panel first (desktop only)
    if (isDesktop) {
      setPanelOpen(true);
    }

    const timer = setTimeout(() => {
      if (dismissedRef.current) return;

      if (isDesktop && targetLaunch) {
        // Desktop: position tooltip next to card
        const cardEl = document.querySelector(
          `[data-launch-id="${targetLaunch.id}"]`
        );
        if (cardEl) {
          setCardRect(cardEl.getBoundingClientRect());
        }
      } else {
        // Mobile: position tooltip above play button
        const playBtn = document.querySelector("[data-play-button]");
        if (playBtn) {
          setPlayBtnRect(playBtn.getBoundingClientRect());
        }
      }

      setShow(true);
    }, 800);

    // Mobile: auto-dismiss after 8s and on any tap
    let autoDismissTimer: ReturnType<typeof setTimeout> | undefined;
    const tapDismiss = () => {
      if (isMobileView) dismiss();
    };

    if (isMobileView) {
      autoDismissTimer = setTimeout(dismiss, 8000);
      window.addEventListener("touchstart", tapDismiss, { once: true });
    }

    return () => {
      clearTimeout(timer);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      window.removeEventListener("touchstart", tapDismiss);
    };
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

  // ── Mobile: small tooltip above play button ──
  if (isMobile) {
    const tooltipRight = playBtnRect
      ? window.innerWidth - playBtnRect.right + playBtnRect.width / 2 - 60
      : 50;
    const tooltipBottom = playBtnRect
      ? window.innerHeight - playBtnRect.top + 10
      : 165;

    return (
      <div
        role="tooltip"
        style={{
          position: "fixed",
          bottom: tooltipBottom,
          right: Math.max(12, tooltipRight),
          background: "rgba(6, 182, 212, 0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 11,
          color: "#e2e8f0",
          lineHeight: 1.4,
          maxWidth: 180,
          boxShadow:
            "0 4px 16px rgba(0,0,0,0.5), 0 0 12px rgba(6, 182, 212, 0.1)",
          zIndex: 82,
          pointerEvents: "none",
          animation: "toast-slide-in 0.3s ease-out",
          textAlign: "center",
        }}
        onClick={handleViewTarget}
      >
        <span style={{ fontWeight: 600 }}>Tap to watch last rocket launch</span>
        {/* Downward arrow */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(6, 182, 212, 0.35)",
          }}
        />
      </div>
    );
  }

  // ── Desktop: tooltip anchored to launch card ──
  const tooltipStyle: React.CSSProperties = cardRect
    ? {
        position: "fixed",
        top: cardRect.top + cardRect.height / 2 - 28,
        right: window.innerWidth - cardRect.left + 14,
      }
    : {
        position: "fixed",
        top: 170,
        right: 40,
      };

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
      {/* Arrow pointing right toward the card */}
      {cardRect && (
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
            View Next Launch
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
