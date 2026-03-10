"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSiteAccentColor, SITE_GROUPS } from "@/lib/constants";

/**
 * MiniLaunchCard — a horizontal swipeable carousel at the bottom of the mobile screen.
 * Shows current launch card with next/prev peeking from the sides.
 * Play button on the left, rocket info on the right.
 * Only renders on mobile.
 */
export default function MiniLaunchCard() {
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

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

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
      if (
        filters.jellyfish &&
        (!l.jellyfish || l.jellyfish.potential === "none")
      )
        return false;
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

  // Current index — default to most recent past launch
  const currentIdx = useMemo(() => {
    if (selectedLaunch) {
      const idx = filteredLaunches.findIndex((l) => l.id === selectedLaunch.id);
      return idx >= 0 ? idx : 0;
    }
    // Find the most recent past launch
    const now = Date.now();
    let lastPastIdx = 0;
    for (let i = 0; i < filteredLaunches.length; i++) {
      if (new Date(filteredLaunches[i].dateUtc).getTime() <= now) {
        lastPastIdx = i;
      }
    }
    return lastPastIdx;
  }, [selectedLaunch, filteredLaunches]);

  const currentLaunch = filteredLaunches[currentIdx];
  const prevLaunch = currentIdx > 0 ? filteredLaunches[currentIdx - 1] : null;
  const nextLaunch = currentIdx < filteredLaunches.length - 1 ? filteredLaunches[currentIdx + 1] : null;

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
    if (!currentLaunch) return;
    pauseMissionPlayback();
    setSelectedLaunch(currentLaunch);
    setCameraTarget({
      lat: currentLaunch.launchSite.lat,
      lng: currentLaunch.launchSite.lng,
    });
    setTimelineDate(new Date(currentLaunch.dateUtc));
    setOrbitCenter("launch");
    setTrajectoryProgress(0);
    setTimeout(() => startMissionPlayback(), 50);
  }, [
    currentLaunch,
    pauseMissionPlayback,
    setSelectedLaunch,
    setCameraTarget,
    setTimelineDate,
    setOrbitCenter,
    setTrajectoryProgress,
    startMissionPlayback,
  ]);

  // ── Touch handling for swipe ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    setSwipeOffset(touchDeltaX.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 60;
    if (touchDeltaX.current < -threshold && currentIdx < filteredLaunches.length - 1) {
      selectLaunch(currentIdx + 1);
    } else if (touchDeltaX.current > threshold && currentIdx > 0) {
      selectLaunch(currentIdx - 1);
    }
    setSwipeOffset(0);
    touchDeltaX.current = 0;
  }, [currentIdx, filteredLaunches.length, selectLaunch]);

  if (!isMobile || focusMode || !currentLaunch || filteredLaunches.length === 0)
    return null;

  const CARD_WIDTH = 280; // px
  const CARD_GAP = 10;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 375;
  const cardLeft = (viewportWidth - CARD_WIDTH) / 2;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        bottom: "10px",
        left: 0,
        right: 0,
        zIndex: 45,
        overflow: "hidden",
        height: "56px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          transform: `translateX(${cardLeft + swipeOffset}px)`,
          transition: swipeOffset === 0 ? "transform 0.3s ease" : "none",
          gap: `${CARD_GAP}px`,
        }}
      >
        {/* Previous card (peek from left) */}
        {prevLaunch && (
          <div style={{ width: `${CARD_WIDTH}px`, flexShrink: 0, marginLeft: `-${CARD_WIDTH + CARD_GAP}px` }}>
            <CardChip launch={prevLaunch} onPlay={() => selectLaunch(currentIdx - 1)} dimmed />
          </div>
        )}

        {/* Current card */}
        <div style={{ width: `${CARD_WIDTH}px`, flexShrink: 0 }}>
          <CardChip launch={currentLaunch} onPlay={handlePlay} />
        </div>

        {/* Next card (peek from right) */}
        {nextLaunch && (
          <div style={{ width: `${CARD_WIDTH}px`, flexShrink: 0 }}>
            <CardChip launch={nextLaunch} onPlay={() => selectLaunch(currentIdx + 1)} dimmed />
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact card chip: [▶] [name · rocket · site] */
function CardChip({
  launch,
  onPlay,
  dimmed,
}: {
  launch: { name: string; dateUtc: string; rocketType: string; launchSite: { id: string; name: string }; status: string };
  onPlay: () => void;
  dimmed?: boolean;
}) {
  const accentColor = getSiteAccentColor(launch.launchSite.id);
  const statusColor =
    launch.status === "success"
      ? "#22c55e"
      : launch.status === "failure"
        ? "#ef4444"
        : "#22d3ee";

  const date = new Date(launch.dateUtc);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "rgba(18, 24, 41, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${dimmed ? "rgba(255,255,255,0.06)" : accentColor + "40"}`,
        borderRadius: "12px",
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: dimmed ? "none" : `0 4px 16px rgba(0,0,0,0.4)`,
        opacity: dimmed ? 0.5 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Play button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(34, 211, 238, 0.15)",
          border: "1px solid rgba(34, 211, 238, 0.4)",
          color: "#22d3ee",
          cursor: "pointer",
          fontSize: "11px",
          padding: 0,
          paddingLeft: "2px",
          flexShrink: 0,
        }}
      >
        {"▶"}
      </button>

      {/* Status dot + info */}
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: statusColor,
          flexShrink: 0,
          boxShadow: `0 0 4px ${statusColor}80`,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#e2e8f0",
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
            fontSize: "9px",
            color: "#64748b",
            display: "flex",
            gap: "6px",
            marginTop: "1px",
          }}
        >
          <span>{dateStr}</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>{launch.rocketType}</span>
          <span style={{ color: "#475569" }}>·</span>
          <span style={{ color: accentColor, fontWeight: 500 }}>
            {launch.launchSite.name.split(" ")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
