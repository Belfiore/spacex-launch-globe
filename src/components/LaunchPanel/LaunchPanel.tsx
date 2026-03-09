"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import LaunchCard from "./LaunchCard";
import FilterBar from "./FilterBar";
import { TIMELINE, SITE_GROUPS } from "@/lib/constants";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function LaunchPanel() {
  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const togglePanel = useAppStore((s) => s.togglePanel);
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
  // Always resets trajectory to 0 so the animation plays from the beginning
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
      // Reset trajectory to 0 so playback starts from the beginning
      setTrajectoryProgress(0);
      // Small delay to let state settle, then start playback
      setTimeout(() => startMissionPlayback(), 50);
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
    ]
  );

  // Pause playback
  const handlePause = useCallback(() => {
    pauseMissionPlayback();
  }, [pauseMissionPlayback]);

  // Filter launches (including year filter)
  const filteredLaunches = useMemo(() => {
    return launches.filter((l) => {
      // Year filter
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
      if (filters.status && l.status !== filters.status) return false;
      if (filters.site && l.launchSite.id !== filters.site) return false;
      // Jellyfish filter
      if (
        filters.jellyfish &&
        (!l.jellyfish || l.jellyfish.potential === "none")
      )
        return false;
      // Multi-select site filter
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

  // Find the next upcoming launch
  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return filteredLaunches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [filteredLaunches]);

  // Auto-scroll to next upcoming launch on mount
  useEffect(() => {
    if (!scrollRef.current || selectedLaunch || !nextUpcoming) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${nextUpcoming.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [nextUpcoming?.id, selectedLaunch]);

  // Scroll to selected launch when it changes (e.g. from timeline click)
  // Also open the panel if it's closed
  useEffect(() => {
    if (!selectedLaunch) return;
    if (!panelOpen) togglePanel();
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
    // Stop any active playback when switching launches
    pauseMissionPlayback();
    // Close info panel when clicking any card
    closeInfoPanel();
    setSelectedLaunch(isDeselect ? null : launch);
    if (!isDeselect) {
      setCameraTarget({
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      });
      setTimelineDate(new Date(launch.dateUtc));
      // Set trajectory to 1 = show full flight path so user can visualize the launch
      setTrajectoryProgress(1);
      // Center orbit controls on the launch site
      setOrbitCenter("launch");
    } else {
      setCameraTarget(null);
      setTrajectoryProgress(0);
      setOrbitCenter("usa");
    }
  }

  // Mobile: bottom drawer styles
  const mobileDrawerStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: `${TIMELINE.HEIGHT}px`,
    height: panelOpen ? "55vh" : "0",
    zIndex: 40,
    transition: "height 0.3s ease",
    background: "rgba(18, 24, 41, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "16px 16px 0 0",
  };

  // Desktop: right-side panel styles
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

  // Toggle button position
  const toggleStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: panelOpen ? `calc(55vh + ${TIMELINE.HEIGHT}px + 8px)` : `${TIMELINE.HEIGHT + 8}px`,
        right: "16px",
        zIndex: 50,
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        background: "rgba(18, 24, 41, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "16px",
        transition: "all 0.3s ease",
      }
    : {
        position: "fixed",
        top: "16px",
        right: panelOpen ? "396px" : "16px",
        zIndex: 50,
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        background: "rgba(18, 24, 41, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "16px",
        transition: "all 0.3s ease",
      };

  const toggleIcon = isMobile
    ? panelOpen ? "▼" : "▲"
    : panelOpen ? "›" : "‹";

  return (
    <>
      {/* Toggle button */}
      {!focusMode && (
        <button
          onClick={togglePanel}
          style={toggleStyle}
          title={panelOpen ? "Hide panel" : "Show launches"}
        >
          {toggleIcon}
        </button>
      )}

      {/* Panel */}
      <div style={isMobile ? mobileDrawerStyle : desktopPanelStyle}>
        {/* Drag handle for mobile */}
        {isMobile && (
          <div
            onClick={togglePanel}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "8px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255, 255, 255, 0.2)",
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            padding: isMobile ? "8px 16px" : "16px 16px 12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            flexShrink: 0,
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
