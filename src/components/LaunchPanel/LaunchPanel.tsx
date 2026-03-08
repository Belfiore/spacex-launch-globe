"use client";

import { useRef, useEffect, useMemo, useState } from "react";
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

  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter launches
  const filteredLaunches = useMemo(() => {
    return launches.filter((l) => {
      if (
        filters.search &&
        !l.name.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.rocketType && l.rocketType !== filters.rocketType)
        return false;
      if (filters.status && l.status !== filters.status) return false;
      if (filters.site && l.launchSite.id !== filters.site) return false;
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
  }, [launches, filters]);

  // Find the next upcoming launch
  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return filteredLaunches.find(
      (l) => l.status === "upcoming" && new Date(l.dateUtc).getTime() > now
    );
  }, [filteredLaunches]);

  // Auto-scroll to selected or next upcoming launch on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetId = selectedLaunch?.id ?? nextUpcoming?.id;
    if (!targetId) return;

    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector(
        `[data-launch-id="${targetId}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedLaunch?.id, nextUpcoming?.id]);

  function handleCardClick(launch: (typeof launches)[0]) {
    const isDeselect = selectedLaunch?.id === launch.id;
    setSelectedLaunch(isDeselect ? null : launch);
    if (!isDeselect) {
      setCameraTarget({
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      });
      setTimelineDate(new Date(launch.dateUtc));
    } else {
      setCameraTarget(null);
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
    width: "320px",
    zIndex: 40,
    transform: panelOpen ? "translateX(0)" : "translateX(100%)",
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
        right: panelOpen ? "336px" : "16px",
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
      <button
        onClick={togglePanel}
        style={toggleStyle}
        title={panelOpen ? "Hide panel" : "Show launches"}
      >
        {toggleIcon}
      </button>

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
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
