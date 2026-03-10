"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import LaunchCard from "./LaunchCard";
import FilterBar from "./FilterBar";
import ControlsPanel from "@/components/UI/ControlsPanel";
import { TIMELINE, SITE_GROUPS } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function LaunchPanel() {
  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const setPanelOpen = useAppStore((s) => s.setPanelOpen);
  const filters = useAppStore((s) => s.filters);

  const setTrajectoryProgress = useAppStore((s) => s.setTrajectoryProgress);
  const startMissionPlayback = useAppStore((s) => s.startMissionPlayback);
  const pauseMissionPlayback = useAppStore((s) => s.pauseMissionPlayback);
  const setOrbitCenter = useAppStore((s) => s.setOrbitCenter);

  const selectedYear = useAppStore((s) => s.selectedYear);
  const focusMode = useAppStore((s) => s.focusMode);

  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Play mission — ensure the launch is selected + centered first
  const handlePlay = useCallback(
    (launch: (typeof launches)[0]) => {
      if (selectedLaunch?.id !== launch.id) {
        pauseMissionPlayback();
        setSelectedLaunch(launch);
        setCameraTarget({
          lat: launch.launchSite.lat,
          lng: launch.launchSite.lng,
        });
        setTimelineDate(new Date(launch.dateUtc));
        setOrbitCenter("launch");
      }
      setTrajectoryProgress(0);
      setTimeout(() => startMissionPlayback(), 50);
      // Auto-close mobile panel on play
      if (isMobile) setPanelOpen(false);
    },
    [
      selectedLaunch,
      pauseMissionPlayback,
      setSelectedLaunch,
      setCameraTarget,
      setTimelineDate,
      setTrajectoryProgress,
      setOrbitCenter,
      startMissionPlayback,
      isMobile,
      setPanelOpen,
    ]
  );

  const handlePause = useCallback(() => {
    pauseMissionPlayback();
  }, [pauseMissionPlayback]);

  // Filter launches (including year filter)
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

  // Find the most recent completed launch (the one right before the next upcoming)
  const mostRecentLaunch = useMemo(() => {
    const now = Date.now();
    let lastPast: (typeof filteredLaunches)[0] | null = null;
    for (const l of filteredLaunches) {
      if (new Date(l.dateUtc).getTime() <= now && l.status !== "upcoming") {
        lastPast = l;
      }
    }
    return lastPast;
  }, [filteredLaunches]);

  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return filteredLaunches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [filteredLaunches]);

  // Auto-open panel on desktop after isMobile is resolved
  useEffect(() => {
    // Wait a tick so useIsMobile has measured the viewport
    const timer = setTimeout(() => {
      if (window.innerWidth >= 768) {
        setPanelOpen(true);
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to most recent launch on mount (so upcoming is just below)
  useEffect(() => {
    if (!scrollRef.current || selectedLaunch) return;
    const targetLaunch = mostRecentLaunch ?? nextUpcoming;
    if (!targetLaunch) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${targetLaunch.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [mostRecentLaunch?.id, nextUpcoming?.id, selectedLaunch]);

  // Scroll to selected launch when it changes
  useEffect(() => {
    if (!selectedLaunch) return;
    // On desktop, auto-open panel when selecting a launch
    if (!isMobile && !panelOpen) togglePanel();
    if (!scrollRef.current) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${selectedLaunch.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLaunch?.id]);

  const closeInfoPanel = useAppStore((s) => s.closeInfoPanel);

  function handleCardClick(launch: (typeof launches)[0]) {
    const isDeselect = selectedLaunch?.id === launch.id;
    pauseMissionPlayback();
    closeInfoPanel();
    setSelectedLaunch(isDeselect ? null : launch);
    if (!isDeselect) {
      setCameraTarget({
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      });
      setTimelineDate(new Date(launch.dateUtc));
      setTrajectoryProgress(1);
      setOrbitCenter("launch");
      // Auto-close mobile panel when a card is tapped
      if (isMobile) setPanelOpen(false);
    } else {
      setCameraTarget(null);
      setTrajectoryProgress(0);
      setOrbitCenter("usa");
    }
  }

  // ── Mobile: hamburger + slide-in from right ──────────────────

  const mobileOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 49,
    opacity: panelOpen ? 1 : 0,
    pointerEvents: panelOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  const mobileSlideInStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(85vw, 360px)",
    zIndex: 50,
    transform: panelOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease",
    background: "rgba(18, 24, 41, 0.96)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    flexDirection: "column",
  };

  // Hamburger button style (mobile)
  const hamburgerBg = panelOpen
    ? "rgba(34, 211, 238, 0.15)"
    : "rgba(18, 24, 41, 0.85)";
  const hamburgerBorder = panelOpen
    ? "1px solid rgba(34, 211, 238, 0.3)"
    : "1px solid rgba(255, 255, 255, 0.08)";
  const barColor = panelOpen ? "#22d3ee" : "#94a3b8";

  // ── Desktop: right-side panel styles ─────────────────────────

  const desktopPanelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: `${TIMELINE.HEIGHT}px`,
    width: "380px",
    zIndex: 40,
    transform: panelOpen && !focusMode ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease",
    background: "rgba(18, 24, 41, 0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    flexDirection: "column",
  };

  const desktopToolbarStyle: React.CSSProperties = {
    position: "fixed",
    top: "16px",
    right: panelOpen ? "396px" : "16px",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(18, 24, 41, 0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "4px",
    transition: "right 0.3s ease",
  };

  const toggleIcon = panelOpen ? "\u203A" : "\u2039";

  const showISS = useAppStore((s) => s.showISS);
  const toggleISS = useAppStore((s) => s.toggleISS);
  const showStarlink = useAppStore((s) => s.showStarlink);
  const toggleStarlink = useAppStore((s) => s.toggleStarlink);
  const starlinkCount = useAppStore((s) => s.starlinkCount);

  return (
    <>
      {/* ── Mobile: Top-right toolbar (ISS + Starlink + Hamburger) ── */}
      {isMobile && !focusMode && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 55,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* ISS toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleISS(); }}
            title={showISS ? "Hide ISS" : "Show ISS"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: showISS ? "rgba(34, 211, 238, 0.15)" : "rgba(18, 24, 41, 0.85)",
              backdropFilter: "blur(12px)",
              border: showISS ? "1px solid rgba(34, 211, 238, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              color: showISS ? "#22d3ee" : "#94a3b8",
              cursor: "pointer",
              fontSize: "14px",
              padding: 0,
            }}
          >
            {"🛰"}
          </button>
          {/* Starlink toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleStarlink(); }}
            title={showStarlink ? `Hide Starlink (${starlinkCount.toLocaleString()})` : "Show Starlink"}
            style={{
              height: "36px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              background: showStarlink ? "rgba(165, 200, 255, 0.15)" : "rgba(18, 24, 41, 0.85)",
              backdropFilter: "blur(12px)",
              border: showStarlink ? "1px solid rgba(165, 200, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              color: showStarlink ? "#a5c8ff" : "#94a3b8",
              cursor: "pointer",
              fontSize: "10px",
              padding: "0 8px",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            <span style={{ fontSize: "13px" }}>✦</span>
            <span>{showStarlink && starlinkCount > 0 ? `${(starlinkCount / 1000).toFixed(1)}k` : "SL"}</span>
          </button>
          {/* Hamburger */}
          <button
            onClick={togglePanel}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              borderRadius: "10px",
              background: hamburgerBg,
              backdropFilter: "blur(12px)",
              border: hamburgerBorder,
              cursor: "pointer",
              transition: "all 0.2s ease",
              padding: 0,
            }}
          >
            <span
              style={{
                width: "20px",
                height: "2px",
                background: barColor,
                borderRadius: "1px",
                transition: "all 0.2s ease",
                transform: panelOpen
                  ? "rotate(45deg) translate(2.5px, 2.5px)"
                  : "none",
              }}
            />
            <span
              style={{
                width: "20px",
                height: "2px",
                background: barColor,
                borderRadius: "1px",
                transition: "all 0.2s ease",
                opacity: panelOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                width: "20px",
                height: "2px",
                background: barColor,
                borderRadius: "1px",
                transition: "all 0.2s ease",
                transform: panelOpen
                  ? "rotate(-45deg) translate(2.5px, -2.5px)"
                  : "none",
              }}
            />
          </button>
        </div>
      )}

      {/* ── Mobile: backdrop overlay ── */}
      {isMobile && (
        <div style={mobileOverlayStyle} onClick={() => setPanelOpen(false)} />
      )}

      {/* ── Desktop: Toolbar + Toggle ── */}
      {!isMobile && !focusMode && (
        <div style={desktopToolbarStyle}>
          <ControlsPanel />
          <div
            style={{
              width: "1px",
              height: "18px",
              background: "rgba(255, 255, 255, 0.08)",
              flexShrink: 0,
            }}
          />
          <button
            onClick={togglePanel}
            title={panelOpen ? "Hide panel" : "Show launches"}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "16px",
              padding: 0,
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            {toggleIcon}
          </button>
        </div>
      )}

      {/* ── Panel (mobile = slide-in from right, desktop = right panel) ── */}
      <div style={isMobile ? mobileSlideInStyle : desktopPanelStyle}>
        {/* Header */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Launch Manifest
            </h2>
            {/* Close arrow on mobile header */}
            {isMobile && (
              <button
                onClick={() => setPanelOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: 0,
                }}
              >
                {"\u203A"}
              </button>
            )}
          </div>
          <p style={{ fontSize: "11px", color: "#64748b" }}>
            {filteredLaunches.length} of {launches.length} missions
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar />

        {/* Launch list */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
          }}
        >
          {filteredLaunches.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
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
    </>
  );
}
