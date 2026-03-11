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
      if (filters.jellyfish) {
        // When jellyfish filter is active, only show "Likely" or "Very likely" from API,
        // or fallback to "high" potential from computed data
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

  return (
    <>
      {/* ── Mobile: hamburger + overlay removed — now handled by MobileBottomSheet ── */}

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

      {/* ── Panel (desktop only — mobile uses MobileBottomSheet) ── */}
      {!isMobile && <div style={desktopPanelStyle}>
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
            {/* Close X on mobile header */}
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
                  fontSize: "16px",
                  padding: 0,
                }}
              >
                {"\u00D7"}
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
      </div>}
    </>
  );
}
