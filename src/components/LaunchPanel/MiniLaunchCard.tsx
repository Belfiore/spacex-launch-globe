"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSiteAccentColor, SITE_GROUPS } from "@/lib/constants";

/** Gap between cards in the carousel strip */
const CARD_GAP = 8;
/** How much of prev/next card peeks from the edges */
const PEEK = 40;

interface MiniLaunchCardProps {
  renderMode?: "fixed" | "inline";
}

/**
 * MiniLaunchCard — a compact, swipeable launch card carousel.
 * Prev/next cards peek from edges and slide together with the current card.
 * Tap to select + center on globe.
 */
export default function MiniLaunchCard({ renderMode = "fixed" }: MiniLaunchCardProps) {
  const isMobile = useIsMobile();
  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const setTrajectoryProgress = useAppStore((s) => s.setTrajectoryProgress);
  const setOrbitCenter = useAppStore((s) => s.setOrbitCenter);
  const pauseMissionPlayback = useAppStore((s) => s.pauseMissionPlayback);
  const startMissionPlayback = useAppStore((s) => s.startMissionPlayback);
  const closeInfoPanel = useAppStore((s) => s.closeInfoPanel);
  const focusMode = useAppStore((s) => s.focusMode);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const filters = useAppStore((s) => s.filters);
  const miniTimelinePlaying = useAppStore((s) => s.miniTimelinePlaying);
  const setInfoPanelLaunchId = useAppStore((s) => s.setInfoPanelLaunchId);

  const isInline = renderMode === "inline";
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const [displayIdx, setDisplayIdx] = useState(0);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Card width: container minus peek on each side
  const cardWidth = containerWidth > 0 ? containerWidth - 2 * PEEK : 300;
  // Full card unit including gap
  const cardUnit = cardWidth + CARD_GAP;

  // Filter launches the same way the panel does
  const filteredLaunches = useMemo(() => {
    return launches.filter((l) => {
      if (selectedYear !== "all") {
        const launchYear = new Date(l.dateUtc).getFullYear();
        if (launchYear !== selectedYear) return false;
      }
      if (
        filters.search &&
        !l.name.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.rocketType && l.rocketType !== filters.rocketType)
        return false;
      if (filters.status) {
        if (filters.status === "failure") {
          const ls = l.launchStatus ?? l.status;
          if (ls !== "failure" && ls !== "partial_failure" && ls !== "prelaunch_failure") return false;
        } else if (l.status !== filters.status) {
          return false;
        }
      }
      if (filters.site && l.launchSite.id !== filters.site) return false;
      if (filters.jellyfish) {
        if (!l.jellyfish) return false;
        if (l.jellyfish.apiLabel) {
          const label = l.jellyfish.apiLabel.toLowerCase();
          if (label !== "likely" && label !== "very likely") return false;
        } else if (l.jellyfish.potential !== "high") {
          return false;
        }
      }
      if (filters.sites.length > 0) {
        const matchesSiteGroup = SITE_GROUPS.some(
          (g) =>
            filters.sites.includes(g.key) &&
            g.siteIds.includes(l.launchSite.id)
        );
        if (!matchesSiteGroup) return false;
      }
      return true;
    });
  }, [launches, filters, selectedYear]);

  // Current index based on selected launch
  const currentIdx = useMemo(() => {
    if (!selectedLaunch) {
      const now = Date.now();
      const idx = filteredLaunches.findIndex(
        (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
      );
      return idx >= 0 ? idx : 0;
    }
    const idx = filteredLaunches.findIndex((l) => l.id === selectedLaunch.id);
    return idx >= 0 ? idx : 0;
  }, [selectedLaunch, filteredLaunches]);

  // Keep displayIdx in sync when currentIdx changes externally
  useEffect(() => {
    if (!isSnapping) {
      setDisplayIdx(currentIdx);
    }
  }, [currentIdx, isSnapping]);

  const displayLaunch = filteredLaunches[displayIdx];

  const selectLaunch = useCallback(
    (idx: number) => {
      const launch = filteredLaunches[idx];
      if (!launch) return;
      pauseMissionPlayback();
      closeInfoPanel();
      setSelectedLaunch(launch);
      setCameraTarget({
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      });
      setTimelineDate(new Date(launch.dateUtc));
      setTrajectoryProgress(1);
      setOrbitCenter("launch");
    },
    [
      filteredLaunches,
      pauseMissionPlayback,
      closeInfoPanel,
      setSelectedLaunch,
      setCameraTarget,
      setTimelineDate,
      setTrajectoryProgress,
      setOrbitCenter,
    ]
  );

  const handlePlay = useCallback(() => {
    if (!displayLaunch) return;
    pauseMissionPlayback();
    setSelectedLaunch(displayLaunch);
    setCameraTarget({
      lat: displayLaunch.launchSite.lat,
      lng: displayLaunch.launchSite.lng,
    });
    setTimelineDate(new Date(displayLaunch.dateUtc));
    setOrbitCenter("launch");
    setTrajectoryProgress(0);
    setTimeout(() => startMissionPlayback(), 50);
  }, [
    displayLaunch,
    pauseMissionPlayback,
    setSelectedLaunch,
    setCameraTarget,
    setTimelineDate,
    setOrbitCenter,
    setTrajectoryProgress,
    startMissionPlayback,
  ]);

  const handlePause = useCallback(() => {
    pauseMissionPlayback();
  }, [pauseMissionPlayback]);

  const handleInfoOpen = useCallback(() => {
    if (!displayLaunch) return;
    setInfoPanelLaunchId(displayLaunch.id);
  }, [displayLaunch, setInfoPanelLaunchId]);

  // Is this launch currently playing?
  const isPlaying = displayLaunch && selectedLaunch?.id === displayLaunch.id && miniTimelinePlaying;

  // ── Touch handling — connected carousel ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsSnapping(false);
    setSwipeOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    // Dampen at edges
    let offset = touchDeltaX.current;
    if ((displayIdx === 0 && offset > 0) || (displayIdx >= filteredLaunches.length - 1 && offset < 0)) {
      offset *= 0.2; // rubber-band at edges
    }
    setSwipeOffset(offset);
  }, [displayIdx, filteredLaunches.length]);

  const handleTouchEnd = useCallback(() => {
    const threshold = 50;
    const goNext = touchDeltaX.current < -threshold && displayIdx < filteredLaunches.length - 1;
    const goPrev = touchDeltaX.current > threshold && displayIdx > 0;

    if (goNext || goPrev) {
      // Snap to next/prev card
      const snapTarget = goNext ? -cardUnit : cardUnit;
      setIsSnapping(true);
      setSwipeOffset(snapTarget);

      // After snap animation, update index
      setTimeout(() => {
        const newIdx = goNext ? displayIdx + 1 : displayIdx - 1;
        setDisplayIdx(newIdx);
        selectLaunch(newIdx);
        setSwipeOffset(0);
        setIsSnapping(false);
      }, 250);
    } else {
      // Snap back
      setIsSnapping(true);
      setSwipeOffset(0);
      setTimeout(() => setIsSnapping(false), 250);
    }
    touchDeltaX.current = 0;
  }, [displayIdx, filteredLaunches.length, selectLaunch, cardUnit]);

  // MiniLaunchCard is mobile-only; on mobile, only render in inline mode (inside MobileBottomSheet)
  if (!isMobile || renderMode === "fixed") return null;
  if (focusMode || !displayLaunch || filteredLaunches.length === 0)
    return null;

  // Cards to render: [prev, current, next]
  const prevLaunch = displayIdx > 0 ? filteredLaunches[displayIdx - 1] : null;
  const nextLaunch = displayIdx < filteredLaunches.length - 1 ? filteredLaunches[displayIdx + 1] : null;

  // The strip offset: prev card occupies position 0, current at cardUnit, next at 2*cardUnit
  // We want current card centered: translate = -(has prev ? cardUnit : 0) + PEEK
  const hasSlot0 = prevLaunch !== null;
  const baseOffset = hasSlot0 ? -cardUnit + PEEK : PEEK;
  const stripTransform = `translateX(${baseOffset + swipeOffset}px)`;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: isInline ? "relative" : "fixed",
        bottom: isInline ? undefined : "12px",
        left: isInline ? undefined : "12px",
        right: isInline ? undefined : "12px",
        zIndex: isInline ? undefined : 45,
        overflow: "hidden",
        padding: isInline ? "0 0" : undefined,
        marginBottom: isInline ? "6px" : undefined,
        touchAction: "pan-y",
      }}
    >
      {/* Carousel strip — all cards sit side by side */}
      <div
        style={{
          display: "flex",
          gap: `${CARD_GAP}px`,
          transform: stripTransform,
          transition: isSnapping ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          willChange: "transform",
        }}
      >
        {/* Previous card (peek) */}
        {prevLaunch && (
          <CardSlot
            launch={prevLaunch}
            cardWidth={cardWidth}
            onTap={() => {
              setDisplayIdx(displayIdx - 1);
              selectLaunch(displayIdx - 1);
            }}
            dimmed
          />
        )}

        {/* Current card (active) */}
        <CardSlot
          launch={displayLaunch}
          cardWidth={cardWidth}
          onTap={() => selectLaunch(displayIdx)}
          isPlaying={!!isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onInfoOpen={handleInfoOpen}
          counterText={`${displayIdx + 1}/${filteredLaunches.length}`}
        />

        {/* Next card (peek) */}
        {nextLaunch && (
          <CardSlot
            launch={nextLaunch}
            cardWidth={cardWidth}
            onTap={() => {
              setDisplayIdx(displayIdx + 1);
              selectLaunch(displayIdx + 1);
            }}
            dimmed
          />
        )}
      </div>

      {/* Swipe hint dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "3px",
          marginTop: "6px",
        }}
      >
        {Array.from({ length: Math.min(5, filteredLaunches.length) }, (_, i) => {
          const dotIdx = Math.max(0, displayIdx - 2) + i;
          if (dotIdx >= filteredLaunches.length) return null;
          const accentColor = getSiteAccentColor(filteredLaunches[dotIdx]?.launchSite.id ?? "");
          return (
            <div
              key={dotIdx}
              style={{
                width: dotIdx === displayIdx ? "12px" : "4px",
                height: "4px",
                borderRadius: "2px",
                background:
                  dotIdx === displayIdx
                    ? accentColor
                    : "rgba(255, 255, 255, 0.15)",
                transition: "all 0.2s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Individual card slot component ─────────────────────────────

interface CardSlotProps {
  launch: {
    id: string;
    name: string;
    dateUtc: string;
    rocketType: string;
    launchSite: { id: string; name: string; lat: number; lng: number };
    status: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  cardWidth: number;
  onTap: () => void;
  dimmed?: boolean;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onInfoOpen?: () => void;
  counterText?: string;
}

function CardSlot({
  launch,
  cardWidth,
  onTap,
  dimmed,
  isPlaying,
  onPlay,
  onPause,
  onInfoOpen,
  counterText,
}: CardSlotProps) {
  const accentColor = getSiteAccentColor(launch.launchSite.id);

  const date = new Date(launch.dateUtc);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        opacity: dimmed ? 0.45 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          background: "rgba(18, 24, 41, 0.92)",
          backdropFilter: dimmed ? "none" : "blur(16px)",
          WebkitBackdropFilter: dimmed ? "none" : "blur(16px)",
          border: `1px solid ${accentColor}${dimmed ? "20" : "40"}`,
          borderRadius: "14px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: dimmed
            ? "none"
            : `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${accentColor}15`,
        }}
        onClick={onTap}
      >
        {/* Left: play/pause button (only on active card) */}
        {!dimmed && onPlay && onPause ? (
          <button
            data-play-button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlaying) {
                onPause();
              } else {
                onPlay();
              }
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isPlaying
                ? "rgba(34, 211, 238, 0.25)"
                : "rgba(34, 211, 238, 0.15)",
              border: "1px solid rgba(34, 211, 238, 0.4)",
              color: "#22d3ee",
              cursor: "pointer",
              fontSize: isPlaying ? "11px" : "12px",
              padding: 0,
              paddingLeft: isPlaying ? "0px" : "2px",
              flexShrink: 0,
              boxShadow: isPlaying
                ? "0 0 12px rgba(34, 211, 238, 0.4)"
                : "none",
              transition: "all 0.2s ease",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        ) : (
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: accentColor,
              flexShrink: 0,
              opacity: 0.5,
            }}
          />
        )}

        {/* Center: mission info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: dimmed ? "#94a3b8" : "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {launch.name}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#64748b",
              display: "flex",
              gap: "8px",
              marginTop: "2px",
            }}
          >
            <span>{dateStr}</span>
            {!dimmed && (
              <>
                <span style={{ color: "#475569" }}>|</span>
                <span>{launch.rocketType}</span>
                <span style={{ color: "#475569" }}>|</span>
                <span style={{ color: accentColor, fontWeight: 500 }}>
                  {launch.launchSite.name.split(" ")[0]}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: info button + counter (only on active card) */}
        {!dimmed && onInfoOpen && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfoOpen();
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "serif",
                padding: 0,
              }}
              title="View flight details"
            >
              {"i"}
            </button>
            {counterText && (
              <div
                style={{
                  fontSize: "9px",
                  color: "#475569",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                }}
              >
                {counterText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
