"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SITE_GROUPS } from "@/lib/constants";
import LaunchCard from "./LaunchCard";
import FilterBar from "./FilterBar";
import MiniTimeline from "@/components/UI/MiniTimeline";
import MiniLaunchCard from "./MiniLaunchCard";
import Timeline from "@/components/Timeline/Timeline";

/**
 * MobileBottomSheet — unified mobile bottom container.
 * Always shows: MiniTimeline + MiniLaunchCard + Timeline (the "dock").
 * Expandable: slides up to reveal launch list + filter bar.
 * Only renders on mobile.
 */
export default function MobileBottomSheet() {
  const isMobile = useIsMobile();
  const focusMode = useAppStore((s) => s.focusMode);
  const mobileSheetExpanded = useAppStore((s) => s.mobileSheetExpanded);
  const setMobileSheetExpanded = useAppStore((s) => s.setMobileSheetExpanded);
  const toggleMobileSheet = useAppStore((s) => s.toggleMobileSheet);

  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const filters = useAppStore((s) => s.filters);
  const timelineVisible = useAppStore((s) => s.timelineVisible);
  const toggleTimeline = useAppStore((s) => s.toggleTimeline);
  const resetFilters = useAppStore((s) => s.resetFilters);

  // Swipe-down-to-close on handle
  const handleTouchStartY = useRef(0);
  const handleTouchDeltaY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter launches (same logic as LaunchPanel)
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

  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return filteredLaunches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [filteredLaunches]);

  // Batched handlers — single setState for performance
  const handleCardClick = useCallback(
    (launch: (typeof launches)[0]) => {
      const isDeselect = selectedLaunch?.id === launch.id;
      if (!isDeselect) {
        useAppStore.setState({
          miniTimelinePlaying: false,
          playbackState: "paused" as const,
          infoPanelLaunchId: null,
          selectedLaunch: launch,
          cameraTarget: {
            lat: launch.launchSite.lat,
            lng: launch.launchSite.lng,
          },
          timelineDate: new Date(launch.dateUtc),
          trajectoryProgress: 1,
          orbitCenter: "launch" as const,
          mobileSheetExpanded: false,
        });
      } else {
        useAppStore.setState({
          miniTimelinePlaying: false,
          playbackState: "paused" as const,
          infoPanelLaunchId: null,
          selectedLaunch: null,
          cameraTarget: null,
          trajectoryProgress: 0,
          orbitCenter: "usa" as const,
        });
      }
    },
    [selectedLaunch]
  );

  const handlePlay = useCallback(
    (launch: (typeof launches)[0]) => {
      const updates: Record<string, unknown> = {
        cameraTarget: {
          lat: launch.launchSite.lat - 15,
          lng: launch.launchSite.lng + 10,
        },
        trajectoryProgress: 0,
        mobileSheetExpanded: false,
      };
      if (selectedLaunch?.id !== launch.id) {
        updates.miniTimelinePlaying = false;
        updates.playbackState = "paused";
        updates.selectedLaunch = launch;
        updates.timelineDate = new Date(launch.dateUtc);
        updates.orbitCenter = "launch";
      }
      useAppStore.setState(updates);
      setTimeout(() => {
        useAppStore.setState({
          miniTimelinePlaying: true,
          playbackState: "playing" as const,
        });
      }, 50);
    },
    [selectedLaunch]
  );

  const handlePause = useCallback(() => {
    useAppStore.setState({
      miniTimelinePlaying: false,
      playbackState: "paused" as const,
    });
  }, []);

  // ── Swipe-down-to-close gesture on sheet header ──
  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    handleTouchStartY.current = e.touches[0].clientY;
    handleTouchDeltaY.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    handleTouchDeltaY.current = e.touches[0].clientY - handleTouchStartY.current;
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    if (handleTouchDeltaY.current > 60) {
      setMobileSheetExpanded(false);
    }
    handleTouchDeltaY.current = 0;
  }, [setMobileSheetExpanded]);

  // Auto-scroll to next upcoming launch when sheet expands
  useEffect(() => {
    if (!mobileSheetExpanded || !scrollRef.current || !nextUpcoming) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${nextUpcoming.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 350); // wait for expand animation
    return () => clearTimeout(timer);
  }, [mobileSheetExpanded, nextUpcoming]);

  // Go to next launch — clears filters, selects the launch, updates map, collapses sheet
  const goToNextLaunch = useCallback(() => {
    resetFilters();
    const now = Date.now();
    const next = launches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
    if (!next) return;
    // Batched state update — select launch, navigate map, collapse sheet
    useAppStore.setState({
      selectedLaunch: next,
      cameraTarget: { lat: next.launchSite.lat, lng: next.launchSite.lng },
      timelineDate: new Date(next.dateUtc),
      orbitCenter: "launch" as const,
      trajectoryProgress: 1,
      miniTimelinePlaying: false,
      playbackState: "paused" as const,
      infoPanelLaunchId: null,
      mobileSheetExpanded: false,
    });
  }, [resetFilters, launches]);

  if (!isMobile || focusMode) return null;

  return (
    <>
      {/* Dark overlay behind sheet when expanded */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 44,
          opacity: mobileSheetExpanded ? 1 : 0,
          pointerEvents: mobileSheetExpanded ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        onClick={() => setMobileSheetExpanded(false)}
      />

      {/* Main sheet container */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* List / Close toggle button — floats above the dock */}
        <button
          onClick={toggleMobileSheet}
          style={{
            position: "absolute",
            top: "-52px",
            left: "12px",
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: mobileSheetExpanded
              ? "rgba(34, 211, 238, 0.15)"
              : "rgba(18, 24, 41, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: mobileSheetExpanded
              ? "1px solid rgba(34, 211, 238, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            color: mobileSheetExpanded ? "#22d3ee" : "#94a3b8",
            cursor: "pointer",
            zIndex: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            padding: 0,
            transition: "all 0.25s ease",
            transform: mobileSheetExpanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          {mobileSheetExpanded ? (
            /* Close × icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* List icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          )}
        </button>

        {/* Timeline toggle button — floats above dock at right */}
        {!mobileSheetExpanded && (
          <button
            onClick={toggleTimeline}
            style={{
              position: "absolute",
              top: "-52px",
              right: "12px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: timelineVisible
                ? "rgba(34, 211, 238, 0.15)"
                : "rgba(18, 24, 41, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: timelineVisible
                ? "1px solid rgba(34, 211, 238, 0.3)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              color: timelineVisible ? "#22d3ee" : "#94a3b8",
              cursor: "pointer",
              zIndex: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "all 0.25s ease",
            }}
          >
            {/* Clock icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        )}

        {/* Expandable area — launch list */}
        <div
          style={{
            maxHeight: mobileSheetExpanded ? "calc(100dvh - 56px)" : "0px",
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "rgba(18, 24, 41, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: mobileSheetExpanded ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
            borderRadius: "16px 16px 0 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sheet header — drag handle + title + close */}
          <div
            onTouchStart={onHandleTouchStart}
            onTouchMove={onHandleTouchMove}
            onTouchEnd={onHandleTouchEnd}
            style={{
              padding: "12px 16px 8px",
              flexShrink: 0,
              cursor: "grab",
            }}
          >
            {/* Drag handle bar */}
            <div
              style={{
                width: "36px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255, 255, 255, 0.2)",
                margin: "0 auto 10px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#e2e8f0",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Launch Manifest
                </h2>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                  {filteredLaunches.length} of {launches.length} missions
                </p>
              </div>
              <button
                onClick={goToNextLaunch}
                style={{
                  background: "rgba(34, 211, 238, 0.1)",
                  border: "1px solid rgba(34, 211, 238, 0.25)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#22d3ee",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.03em",
                  flexShrink: 0,
                }}
              >
                Next Launch ↓
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar />

          {/* Scrollable launch list */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 12px",
              overscrollBehavior: "contain",
            }}
          >
            {filteredLaunches.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 20px",
                  color: "#475569",
                  fontSize: "13px",
                }}
              >
                {launches.length === 0
                  ? "Loading launch data..."
                  : "No missions match your filters"}
              </div>
            ) : (
              filteredLaunches.map((launch) => (
                <div key={launch.id} data-launch-id={launch.id}>
                  <LaunchCard
                    launch={launch}
                    isSelected={selectedLaunch?.id === launch.id}
                    isNext={nextUpcoming?.id === launch.id}
                    onClick={() => handleCardClick(launch)}
                    onPlay={() => handlePlay(launch)}
                    onPause={handlePause}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Dock area — hidden when sheet expanded for more list space ── */}
        {!mobileSheetExpanded && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              background: "rgba(10, 14, 26, 0.6)",
            }}
          >
            <MiniTimeline renderMode="inline" />
            <MiniLaunchCard renderMode="inline" />
            {timelineVisible && <Timeline renderMode="inline" />}
          </div>
        )}
      </div>
    </>
  );
}
