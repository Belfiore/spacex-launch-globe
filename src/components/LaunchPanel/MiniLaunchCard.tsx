"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSiteAccentColor, SITE_GROUPS } from "@/lib/constants";

/**
 * MiniLaunchCard — a compact, swipeable launch card at the bottom of the mobile screen.
 * Swipe left/right to navigate between launches. Tap to select + center on globe.
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
      // Default to the next upcoming launch
      const now = Date.now();
      const idx = filteredLaunches.findIndex(
        (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
      );
      return idx >= 0 ? idx : 0;
    }
    const idx = filteredLaunches.findIndex((l) => l.id === selectedLaunch.id);
    return idx >= 0 ? idx : 0;
  }, [selectedLaunch, filteredLaunches]);

  const currentLaunch = filteredLaunches[currentIdx];

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
    setSwipeOffset(touchDeltaX.current * 0.3); // Damped visual feedback
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold && currentIdx < filteredLaunches.length - 1) {
      // Swipe left → next launch
      selectLaunch(currentIdx + 1);
    } else if (touchDeltaX.current > threshold && currentIdx > 0) {
      // Swipe right → previous launch
      selectLaunch(currentIdx - 1);
    }
    setSwipeOffset(0);
    touchDeltaX.current = 0;
  }, [currentIdx, filteredLaunches.length, selectLaunch]);

  if (!isMobile || focusMode || !currentLaunch || filteredLaunches.length === 0)
    return null;

  const status = currentLaunch.status;
  const accentColor = getSiteAccentColor(currentLaunch.launchSite.id);
  const statusColor =
    status === "success"
      ? "#22c55e"
      : status === "failure"
        ? "#ef4444"
        : "#22d3ee";

  const date = new Date(currentLaunch.dateUtc);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        bottom: "12px",
        left: "12px",
        right: "12px",
        zIndex: 45,
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? "transform 0.2s ease" : "none",
      }}
    >
      <div
        style={{
          background: "rgba(18, 24, 41, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${accentColor}40`,
          borderRadius: "14px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${accentColor}15`,
        }}
      >
        {/* Left: status dot + nav info */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
            boxShadow: `0 0 6px ${statusColor}80`,
          }}
        />

        {/* Center: mission info */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          onClick={() => selectLaunch(currentIdx)}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {currentLaunch.name}
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
            <span style={{ color: "#475569" }}>|</span>
            <span>{currentLaunch.rocketType}</span>
            <span style={{ color: "#475569" }}>|</span>
            <span style={{ color: accentColor, fontWeight: 500 }}>
              {currentLaunch.launchSite.name.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Right: play button + counter */}
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
              handlePlay();
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
              fontSize: "12px",
              padding: 0,
              paddingLeft: "2px",
            }}
          >
            {"▶"}
          </button>
          <div
            style={{
              fontSize: "9px",
              color: "#475569",
              textAlign: "center",
              lineHeight: 1.2,
              fontFamily: "monospace",
            }}
          >
            {currentIdx + 1}
            <br />
            <span style={{ color: "#334155" }}>/{filteredLaunches.length}</span>
          </div>
        </div>
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
          const dotIdx = Math.max(0, currentIdx - 2) + i;
          if (dotIdx >= filteredLaunches.length) return null;
          return (
            <div
              key={dotIdx}
              style={{
                width: dotIdx === currentIdx ? "12px" : "4px",
                height: "4px",
                borderRadius: "2px",
                background:
                  dotIdx === currentIdx
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
