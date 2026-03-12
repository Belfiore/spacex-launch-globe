"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import LaunchCard from "./LaunchCard";
import FilterBar from "./FilterBar";
import ControlsPanel from "@/components/UI/ControlsPanel";
import { TIMELINE, SITE_GROUPS } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import Tooltip from "@/components/UI/Tooltip";

export default function LaunchPanel() {
  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const setPanelOpen = useAppStore((s) => s.setPanelOpen);
  const filters = useAppStore((s) => s.filters);

  const entryPhase = useAppStore((s) => s.entryPhase);

  const selectedYear = useAppStore((s) => s.selectedYear);
  const focusMode = useAppStore((s) => s.focusMode);

  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Play mission — batched into a single setState for performance
  const handlePlay = useCallback(
    (launch: (typeof launches)[0]) => {
      const updates: Partial<{
        miniTimelinePlaying: boolean;
        playbackState: "stopped" | "playing" | "paused";
        selectedLaunch: typeof launch | null;
        timelineDate: Date;
        orbitCenter: "usa" | "earth" | "launch";
        cameraTarget: { lat: number; lng: number } | null;
        trajectoryProgress: number;
        panelOpen: boolean;
      }> = {
        cameraTarget: {
          lat: launch.launchSite.lat - 15,
          lng: launch.launchSite.lng + 10,
        },
        trajectoryProgress: 0,
      };

      if (selectedLaunch?.id !== launch.id) {
        updates.miniTimelinePlaying = false;
        updates.playbackState = "paused";
        updates.selectedLaunch = launch;
        updates.timelineDate = new Date(launch.dateUtc);
        updates.orbitCenter = "launch";
      }

      if (isMobile) updates.panelOpen = false;

      useAppStore.setState(updates);
      setTimeout(() => {
        useAppStore.setState({
          miniTimelinePlaying: true,
          playbackState: "playing" as const,
        });
      }, 50);
    },
    [selectedLaunch, isMobile]
  );

  const handlePause = useCallback(() => {
    useAppStore.setState({
      miniTimelinePlaying: false,
      playbackState: "paused" as const,
    });
  }, []);

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

  // Auto-scroll to next upcoming launch on mount / after entry completes
  useEffect(() => {
    if (!scrollRef.current || selectedLaunch || !nextUpcoming) return;
    if (entryPhase !== "complete") return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${nextUpcoming.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [nextUpcoming?.id, selectedLaunch, entryPhase]);

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

  function handleCardClick(launch: (typeof launches)[0]) {
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
        ...(isMobile ? { panelOpen: false } : {}),
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
          <Tooltip text={panelOpen ? "Hide panel" : "Show launches"}>
          <button
            onClick={togglePanel}
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
          </Tooltip>
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
