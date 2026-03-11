"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSiteAccentColor, SITE_GROUPS } from "@/lib/constants";

/** Peek amount on each side — just enough to hint at adjacent cards */
const PEEK = 30;
/** Gap between cards */
const CARD_GAP = 12;
/** Fixed card height */
const CARD_HEIGHT = 64;

interface MiniLaunchCardProps {
  renderMode?: "fixed" | "inline";
}

/**
 * MiniLaunchCard — CSS scroll-snap carousel for mobile/tablet.
 * One centered active card with equal peek on both edges.
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const isScrollingRef = useRef(false);
  const programmaticScrollRef = useRef(false);

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

  // Card width: viewport minus peek on each side minus gap
  // card fills: 100vw - 2*PEEK - CARD_GAP
  const cardWidthCalc = `calc(100vw - ${2 * PEEK + CARD_GAP}px)`;

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
    const launch = filteredLaunches[activeIdx];
    if (!launch) return;
    pauseMissionPlayback();
    setSelectedLaunch(launch);
    setCameraTarget({
      lat: launch.launchSite.lat,
      lng: launch.launchSite.lng,
    });
    setTimelineDate(new Date(launch.dateUtc));
    setOrbitCenter("launch");
    setTrajectoryProgress(0);
    setTimeout(() => startMissionPlayback(), 50);
  }, [
    filteredLaunches,
    activeIdx,
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
    const launch = filteredLaunches[activeIdx];
    if (!launch) return;
    setInfoPanelLaunchId(launch.id);
  }, [filteredLaunches, activeIdx, setInfoPanelLaunchId]);

  // Detect which card is centered via scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      if (programmaticScrollRef.current) return;

      isScrollingRef.current = true;
      clearTimeout(scrollTimer);

      // Calculate which card is closest to center
      const scrollLeft = el.scrollLeft;
      // Each card occupies cardWidth + gap, and we started with PEEK padding
      // The card at index i has its left edge at i * (cardWidth + gap)
      // For 100vw container: cardWidth = 100vw - 2*PEEK - GAP
      const containerWidth = el.clientWidth;
      const cardWidth = containerWidth - 2 * PEEK - CARD_GAP;
      const cardUnit = cardWidth + CARD_GAP;

      const centeredIdx = Math.round(scrollLeft / cardUnit);
      const clamped = Math.max(0, Math.min(centeredIdx, filteredLaunches.length - 1));

      if (clamped !== activeIdx) {
        setActiveIdx(clamped);
      }

      // Detect scroll end — select the launch
      scrollTimer = setTimeout(() => {
        isScrollingRef.current = false;
        if (clamped !== activeIdx || !selectedLaunch || selectedLaunch.id !== filteredLaunches[clamped]?.id) {
          selectLaunch(clamped);
        }
      }, 150);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
    };
  }, [activeIdx, filteredLaunches, selectLaunch, selectedLaunch]);

  // Scroll to the correct card when currentIdx changes externally (e.g. launch selected from list)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isScrollingRef.current) return;

    const cardEl = el.children[currentIdx] as HTMLElement | undefined;
    if (cardEl) {
      programmaticScrollRef.current = true;
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 500);
    }
    setActiveIdx(currentIdx);
  }, [currentIdx]);

  // Index of next upcoming launch (for NEXT LAUNCH tag)
  const nextUpcomingIdx = useMemo(() => {
    const now = Date.now();
    return filteredLaunches.findIndex(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [filteredLaunches]);

  // Is this launch currently playing?
  const displayLaunch = filteredLaunches[activeIdx];
  const isPlaying = displayLaunch && selectedLaunch?.id === displayLaunch.id && miniTimelinePlaying;

  // MiniLaunchCard is mobile-only; on mobile, only render in inline mode (inside MobileBottomSheet)
  if (!isMobile || renderMode === "fixed") return null;
  if (focusMode || !displayLaunch || filteredLaunches.length === 0)
    return null;

  return (
    <div
      style={{
        position: isInline ? "relative" : "fixed",
        bottom: isInline ? undefined : "12px",
        left: isInline ? undefined : 0,
        right: isInline ? undefined : 0,
        zIndex: isInline ? undefined : 45,
        marginBottom: isInline ? "6px" : undefined,
      }}
    >
      {/* Scroll-snap container */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          overflowX: "scroll",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          padding: `0 ${PEEK}px`,
          gap: `${CARD_GAP}px`,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {filteredLaunches.map((launch, idx) => {
          const isNext = nextUpcomingIdx >= 0 && idx === nextUpcomingIdx;
          return (
            <CardSlot
              key={launch.id}
              launch={launch}
              cardWidthCalc={cardWidthCalc}
              isActive={idx === activeIdx}
              isNext={isNext}
              onTap={() => {
                if (idx !== activeIdx) {
                  // Scroll to tapped card — animate only, select after scroll completes
                  const el = scrollRef.current;
                  const cardEl = el?.children[idx] as HTMLElement | undefined;
                  if (cardEl) {
                    programmaticScrollRef.current = true;
                    cardEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                    setTimeout(() => {
                      programmaticScrollRef.current = false;
                      selectLaunch(idx);
                    }, 400);
                  }
                  setActiveIdx(idx);
                } else {
                  selectLaunch(idx);
                }
              }}
              isPlaying={idx === activeIdx && !!isPlaying}
              onPlay={idx === activeIdx ? handlePlay : undefined}
              onPause={idx === activeIdx ? handlePause : undefined}
              onInfoOpen={idx === activeIdx ? handleInfoOpen : undefined}
              counterText={idx === activeIdx ? `${activeIdx + 1}/${filteredLaunches.length}` : undefined}
            />
          );
        })}
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
          const dotIdx = Math.max(0, activeIdx - 2) + i;
          if (dotIdx >= filteredLaunches.length) return null;
          const accentColor = getSiteAccentColor(filteredLaunches[dotIdx]?.launchSite.id ?? "");
          return (
            <div
              key={dotIdx}
              style={{
                width: dotIdx === activeIdx ? "12px" : "4px",
                height: "4px",
                borderRadius: "2px",
                background:
                  dotIdx === activeIdx
                    ? accentColor
                    : "rgba(255, 255, 255, 0.15)",
                transition: "all 0.2s ease",
              }}
            />
          );
        })}
      </div>

      {/* Hide scrollbar via style tag */}
      <style>{`
        div[style*="scroll-snap-type"]::-webkit-scrollbar { display: none; }
      `}</style>
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
  cardWidthCalc: string;
  isActive: boolean;
  isNext?: boolean;
  onTap: () => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onInfoOpen?: () => void;
  counterText?: string;
}

function CardSlot({
  launch,
  cardWidthCalc,
  isActive,
  isNext,
  onTap,
  isPlaying,
  onPlay,
  onPause,
  onInfoOpen,
  counterText,
}: CardSlotProps) {
  const accentColor = getSiteAccentColor(launch.launchSite.id);
  const dimmed = false; // Never dim — full visibility for peek cards

  const date = new Date(launch.dateUtc);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: cardWidthCalc,
        minWidth: cardWidthCalc,
        flexShrink: 0,
        scrollSnapAlign: "center",
        height: `${CARD_HEIGHT}px`,
        opacity: dimmed ? 0.45 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "rgba(18, 24, 41, 0.92)",
          backdropFilter: dimmed ? "none" : "blur(16px)",
          WebkitBackdropFilter: dimmed ? "none" : "blur(16px)",
          border: `1px solid ${accentColor}${dimmed ? "20" : "40"}`,
          borderRadius: "14px",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: dimmed
            ? "none"
            : `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${accentColor}15`,
          overflow: "hidden",
        }}
        onClick={onTap}
      >
        {/* Left: play/pause button (only on active card) */}
        {isActive && onPlay && onPause ? (
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
          {isNext && isActive && (
            <div
              style={{
                fontSize: "8px",
                fontWeight: 700,
                color: "#22d3ee",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "1px",
              }}
            >
              NEXT LAUNCH
            </div>
          )}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: isActive ? "#e2e8f0" : "#94a3b8",
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
              whiteSpace: "nowrap",
            }}
          >
            <span>{dateStr}</span>
            {isActive && (
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
        {isActive && onInfoOpen && (
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
