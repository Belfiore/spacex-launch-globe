"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { STATUS_COLORS, TIMELINE } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Launch } from "@/lib/types";

const CINEMATIC_SPEEDS = [1, 3, 6] as const;
type CinematicSpeed = (typeof CINEMATIC_SPEEDS)[number];

function getTimeRange(selectedYear: number | "all") {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (selectedYear === "all") {
    // All years: ±15 days around now (30-day window)
    const start = new Date(now);
    start.setDate(start.getDate() - 15);
    const end = new Date(now);
    end.setDate(end.getDate() + 15);
    return { start, end, now, isCurrentYear: true };
  } else if (selectedYear === currentYear) {
    // Current year: ±6 months around now
    const start = new Date(now);
    start.setMonth(start.getMonth() - TIMELINE.RANGE_MONTHS_PAST);
    const end = new Date(now);
    end.setMonth(end.getMonth() + TIMELINE.RANGE_MONTHS_FUTURE);
    return { start, end, now, isCurrentYear: true };
  } else {
    // Historical year: Jan 1 – Dec 31
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59);
    return { start, end, now, isCurrentYear: false };
  }
}

function dateToPercent(date: Date, start: Date, end: Date): number {
  const total = end.getTime() - start.getTime();
  const offset = date.getTime() - start.getTime();
  return Math.max(0, Math.min(100, (offset / total) * 100));
}

function percentToDate(percent: number, start: Date, end: Date): Date {
  const total = end.getTime() - start.getTime();
  return new Date(start.getTime() + (percent / 100) * total);
}

function getMonthTicks(start: Date, end: Date): { date: Date; label: string }[] {
  const ticks: { date: Date; label: string }[] = [];
  const current = new Date(start);
  current.setDate(1);
  current.setHours(0, 0, 0, 0);
  if (current < start) current.setMonth(current.getMonth() + 1);

  while (current <= end) {
    ticks.push({
      date: new Date(current),
      label: current.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    });
    current.setMonth(current.getMonth() + 1);
  }
  return ticks;
}

// Map site IDs to short abbreviations for timeline dots
function getSiteAbbr(siteId: string): string {
  if (siteId.includes("cape-canaveral") || siteId.includes("ksc")) return "CC";
  if (siteId.includes("boca-chica")) return "BC";
  if (siteId.includes("vandenberg")) return "V";
  if (siteId.includes("kwajalein")) return "OI";
  return "";
}

interface TooltipData {
  launch: Launch;
  x: number;
}

interface TimelineProps {
  renderMode?: "fixed" | "inline";
}

export default function Timeline({ renderMode = "fixed" }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cinematicSpeed, setCinematicSpeed] = useState<CinematicSpeed>(3);
  const cinematicSpeedRef = useRef<CinematicSpeed>(3);
  const isMobile = useIsMobile();
  const isInline = renderMode === "inline";
  const timelineHeight = isMobile ? TIMELINE.MOBILE_HEIGHT : TIMELINE.HEIGHT;

  const launches = useAppStore((s) => s.launches);
  const timelineDate = useAppStore((s) => s.timelineDate);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const setSelectedYear = useAppStore((s) => s.setSelectedYear);
  const availableYears = useAppStore((s) => s.availableYears);
  const focusMode = useAppStore((s) => s.focusMode);
  const timelineVisible = useAppStore((s) => s.timelineVisible);
  const timelineCinematicPlaying = useAppStore((s) => s.timelineCinematicPlaying);

  // Keep speed ref in sync
  useEffect(() => { cinematicSpeedRef.current = cinematicSpeed; }, [cinematicSpeed]);

  // Track the last auto-selected launch during scrubbing
  const lastScrubLaunchId = useRef<string | null>(null);
  const lastCinematicLaunchId = useRef<string | null>(null);

  // Only compute time range after mount to avoid SSR/client hydration mismatch
  const { start, end, now, isCurrentYear } = useMemo(() => {
    if (!mounted) {
      const d = new Date(0);
      return { start: d, end: d, now: d, isCurrentYear: true };
    }
    return getTimeRange(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, selectedYear]);

  const monthTicks = useMemo(
    () => (mounted ? getMonthTicks(start, end) : []),
    [mounted, start, end]
  );

  // Filter launches to the visible year range
  const visibleLaunches = useMemo(() => {
    return launches.filter((l) => {
      const d = new Date(l.dateUtc);
      return d >= start && d <= end;
    });
  }, [launches, start, end]);

  const playheadPercent = mounted ? dateToPercent(timelineDate, start, end) : 0;
  const todayPercent = mounted && isCurrentYear ? dateToPercent(now, start, end) : -1;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateFromMouse = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const clampedPercent = Math.max(0, Math.min(100, percent));
      const newDate = percentToDate(clampedPercent, start, end);
      setTimelineDate(newDate);

      // Auto-select nearest launch when scrubbing near a launch dot
      const newDateMs = newDate.getTime();
      let closestLaunch: Launch | null = null;
      let closestPixelDist = Infinity;

      for (const launch of visibleLaunches) {
        const launchPct = dateToPercent(new Date(launch.dateUtc), start, end);
        const pixelDist = Math.abs(launchPct - clampedPercent) * rect.width / 100;
        if (pixelDist < closestPixelDist) {
          closestPixelDist = pixelDist;
          closestLaunch = launch;
        }
      }

      // If within 20px of a launch dot, select it and show trajectory
      if (closestLaunch && closestPixelDist < 20) {
        if (lastScrubLaunchId.current !== closestLaunch.id) {
          useAppStore.setState({
            miniTimelinePlaying: false,
            playbackState: "paused" as const,
            selectedLaunch: closestLaunch,
            cameraTarget: {
              lat: closestLaunch.launchSite.lat,
              lng: closestLaunch.launchSite.lng,
            },
            orbitCenter: "launch" as const,
            trajectoryProgress: 1,
          });
          lastScrubLaunchId.current = closestLaunch.id;
        } else {
          useAppStore.setState({ trajectoryProgress: 1 });
        }
      } else if (lastScrubLaunchId.current !== null) {
        lastScrubLaunchId.current = null;
      }
    },
    [start, end, setTimelineDate, visibleLaunches]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      updateFromMouse(e.clientX);
    },
    [updateFromMouse]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateFromMouse(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateFromMouse]);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updateFromMouse(e.touches[0].clientX);
    },
    [updateFromMouse]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        updateFromMouse(e.touches[0].clientX);
      }
    },
    [isDragging, updateFromMouse]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  function handleLaunchTickClick(launch: Launch) {
    useAppStore.setState({
      timelineDate: new Date(launch.dateUtc),
      selectedLaunch: launch,
      cameraTarget: {
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      },
    });
  }

  /* ── CINEMATIC PLAYBACK — DISABLED (may re-enable later) ──────
  const toggleCinematic = useCallback(() => {
    if (timelineCinematicPlaying) {
      useAppStore.setState({
        timelineCinematicPlaying: false,
        focusMode: false,
        miniTimelinePlaying: false,
        playbackState: "paused" as const,
      });
    } else {
      useAppStore.setState({
        timelineCinematicPlaying: true,
        focusMode: true,
        timelineDate: new Date(start),
        selectedLaunch: null,
        trajectoryProgress: 0,
      });
      lastCinematicLaunchId.current = null;
    }
  }, [timelineCinematicPlaying, start]);

  const cycleSpeed = useCallback(() => {
    setCinematicSpeed((prev) => {
      const idx = CINEMATIC_SPEEDS.indexOf(prev);
      return CINEMATIC_SPEEDS[(idx + 1) % CINEMATIC_SPEEDS.length];
    });
  }, []);

  // RAF loop for cinematic mode — DISABLED
  useEffect(() => {
    if (!timelineCinematicPlaying || !mounted) return;
    // ... cinematic RAF loop disabled ...
  }, [timelineCinematicPlaying, mounted, start, end, visibleLaunches]);
  ── END CINEMATIC DISABLED ── */

  // Mobile uses MobileBottomSheet (inline mode) — hide standalone fixed instance
  if (renderMode === "fixed" && isMobile) return null;

  return (
    <div
      style={{
        position: isInline ? "relative" : "fixed",
        bottom: isInline ? undefined : 0,
        left: isInline ? undefined : 0,
        right: isInline ? undefined : 0,
        height: `${timelineHeight}px`,
        zIndex: isInline ? undefined : 30,
        background: "rgba(18, 24, 41, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        padding: isMobile ? "4px 12px 6px" : "8px 24px 12px",
        userSelect: "none",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: (focusMode && !timelineCinematicPlaying) || (!isInline && isMobile && !timelineVisible) ? "translateY(100%)" : "translateY(0)",
        opacity: (focusMode && !timelineCinematicPlaying) || (!isInline && isMobile && !timelineVisible) ? 0 : 1,
      }}
    >
      {/* Date display + year selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isMobile ? "2px" : "6px",
          fontSize: isMobile ? "9px" : "11px",
          color: "#94a3b8",
          minHeight: isMobile ? "12px" : "16px",
        }}
      >
        {mounted && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Year dropdown — hidden on mobile (already in FilterBar) */}
              {!isMobile && <select
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all") {
                    setSelectedYear("all");
                    setTimelineDate(new Date());
                  } else {
                    const year = Number(val);
                    setSelectedYear(year);
                    const curYear = new Date().getFullYear();
                    if (year === curYear) {
                      setTimelineDate(new Date());
                    } else {
                      setTimelineDate(new Date(year, 6, 1));
                    }
                  }
                }}
                style={{
                  padding: "1px 3px",
                  borderRadius: "3px",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                  background: "rgba(34, 211, 238, 0.08)",
                  color: "#22d3ee",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option
                  value="all"
                  style={{ background: "#0a0e1a", color: "#e2e8f0" }}
                >
                  Current
                </option>
                {availableYears.map((year) => (
                  <option
                    key={year}
                    value={year}
                    style={{ background: "#0a0e1a", color: "#e2e8f0" }}
                  >
                    {year}
                  </option>
                ))}
              </select>}
              <span>
                {timelineDate.toLocaleDateString("en-US", {
                  weekday: isMobile ? undefined : "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {/* CINEMATIC BUTTONS DISABLED — may re-enable later
              <button onClick={toggleCinematic} style={{...}}>...</button>
              <button onClick={cycleSpeed} style={{...}}>...</button>
              */}
            </div>
            <span style={{ fontSize: "10px", color: "#475569" }}>
              {start.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}{" "}
              —{" "}
              {end.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </>
        )}
      </div>

      {/* Track area */}
      <div
        ref={trackRef}
        style={{
          position: "relative",
          flex: 1,
          cursor: isDragging ? "grabbing" : "pointer",
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "2px",
            background: "rgba(255, 255, 255, 0.08)",
            transform: "translateY(-50%)",
            borderRadius: "1px",
          }}
        />

        {/* Month ticks, today marker, launch dots, playhead — only after mount */}
        {mounted && (
          <>
            {/* Month ticks */}
            {monthTicks.map((tick, i) => {
              const pct = dateToPercent(tick.date, start, end);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: 0,
                    bottom: 0,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "1px",
                      height: "100%",
                      background: "rgba(255, 255, 255, 0.05)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      fontSize: isMobile ? "7px" : "9px",
                      color: "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tick.label}
                  </span>
                </div>
              );
            })}

            {/* Today / NOW marker — only show for current year */}
            {isCurrentYear && todayPercent >= 0 && todayPercent <= 100 && (
              <div
                style={{
                  position: "absolute",
                  left: `${todayPercent}%`,
                  top: "0px",
                  bottom: "0px",
                  width: "2px",
                  background: "rgba(245, 158, 11, 0.6)",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                  boxShadow: "0 0 6px rgba(245, 158, 11, 0.3)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "8px",
                    color: "#f59e0b",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                    textShadow: "0 0 6px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  NOW
                </span>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "6px",
                    height: "6px",
                    background: "#f59e0b",
                    transform: "translate(-50%, -50%) rotate(45deg)",
                    boxShadow: "0 0 6px rgba(245, 158, 11, 0.5)",
                  }}
                />
              </div>
            )}

            {/* Launch ticks — only show launches within the visible range */}
            {visibleLaunches.map((launch) => {
              const pct = dateToPercent(
                new Date(launch.dateUtc),
                start,
                end
              );
              if (pct < 0 || pct > 100) return null;
              const color =
                STATUS_COLORS[launch.launchStatus ?? launch.status] ?? STATUS_COLORS[launch.status] ?? STATUS_COLORS.upcoming;
              const siteAbbr = getSiteAbbr(launch.launchSite.id);
              return (
                <div
                  key={launch.id}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 3,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchTickClick(launch);
                  }}
                  onMouseEnter={(e) => {
                    const rect = trackRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        launch,
                        x: e.clientX - rect.left,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    style={{
                      width: isMobile ? "6px" : "8px",
                      height: isMobile ? "6px" : "8px",
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 6px ${color}80`,
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                  {siteAbbr && (
                    <span
                      style={{
                        fontSize: "7px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginTop: "2px",
                        letterSpacing: "0.03em",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {siteAbbr}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Playhead */}
            <div
              style={{
                position: "absolute",
                left: `${playheadPercent}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#22d3ee",
                  border: "2px solid #0a0e1a",
                  boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-12px",
                  bottom: "-12px",
                  width: "1px",
                  background: "rgba(34, 211, 238, 0.3)",
                  transform: "translateX(-50%)",
                  zIndex: -1,
                }}
              />
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                style={{
                  position: "absolute",
                  left: `${tooltip.x}px`,
                  bottom: "calc(100% + 8px)",
                  transform: "translateX(-50%)",
                  background: "rgba(10, 14, 26, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                  {tooltip.launch.name}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "10px" }}>
                  {new Date(tooltip.launch.dateUtc).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                  {" \u00B7 "}
                  {tooltip.launch.rocketType}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
