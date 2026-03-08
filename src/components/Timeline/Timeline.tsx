"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { STATUS_COLORS, TIMELINE } from "@/lib/constants";
import type { Launch } from "@/lib/types";

function getTimeRange() {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - TIMELINE.RANGE_MONTHS_PAST);
  const end = new Date(now);
  end.setMonth(end.getMonth() + TIMELINE.RANGE_MONTHS_FUTURE);
  return { start, end, now };
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
  if (siteId.includes("kwajalein")) return "KW";
  return "";
}

interface TooltipData {
  launch: Launch;
  x: number;
}

export default function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mounted, setMounted] = useState(false);

  const launches = useAppStore((s) => s.launches);
  const timelineDate = useAppStore((s) => s.timelineDate);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);

  // Only compute time range after mount to avoid SSR/client hydration mismatch
  const { start, end, now } = useMemo(() => {
    if (!mounted) {
      // Return a stable default for SSR — won't be rendered
      const d = new Date(0);
      return { start: d, end: d, now: d };
    }
    return getTimeRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);
  const monthTicks = useMemo(() => (mounted ? getMonthTicks(start, end) : []), [mounted, start, end]);

  const playheadPercent = mounted ? dateToPercent(timelineDate, start, end) : 0;
  const todayPercent = mounted ? dateToPercent(now, start, end) : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateFromMouse = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const newDate = percentToDate(
        Math.max(0, Math.min(100, percent)),
        start,
        end
      );
      setTimelineDate(newDate);
    },
    [start, end, setTimelineDate]
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

  function handleLaunchTickClick(launch: Launch) {
    setTimelineDate(new Date(launch.dateUtc));
    setSelectedLaunch(launch);
    setCameraTarget({
      lat: launch.launchSite.lat,
      lng: launch.launchSite.lng,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: `${TIMELINE.HEIGHT}px`,
        zIndex: 30,
        background: "rgba(18, 24, 41, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "8px 24px 12px",
        userSelect: "none",
      }}
    >
      {/* Date display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
          fontSize: "11px",
          color: "#94a3b8",
          minHeight: "16px",
        }}
      >
        {mounted && (
          <>
            <span>
              {timelineDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span style={{ fontSize: "10px", color: "#475569" }}>
              {start.toLocaleDateString("en-US", { month: "short", year: "numeric" })} —{" "}
              {end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
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
        }}
        onMouseDown={handleMouseDown}
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
                      fontSize: "9px",
                      color: "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tick.label}
                  </span>
                </div>
              );
            })}

            {/* Today / NOW marker — amber, more prominent */}
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
              {/* NOW label */}
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
              {/* Small diamond at center line */}
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

            {/* Launch ticks with site labels */}
            {launches.map((launch) => {
              const pct = dateToPercent(new Date(launch.dateUtc), start, end);
              if (pct < 0 || pct > 100) return null;
              const color = STATUS_COLORS[launch.status] ?? STATUS_COLORS.upcoming;
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
                      width: "8px",
                      height: "8px",
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
                  {/* Site abbreviation label */}
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
              {/* Vertical line from playhead */}
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
                  {new Date(tooltip.launch.dateUtc).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
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
