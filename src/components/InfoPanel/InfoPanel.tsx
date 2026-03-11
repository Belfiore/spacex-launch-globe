"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Launch, BoosterRecoveryDetail, FlightHistoryEvent } from "@/lib/types";
import { TIMELINE } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";

/** Extract YouTube video ID from a URL */
function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

const OUTCOME_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  success: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.4)",
    text: "#22c55e",
  },
  failure: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.4)",
    text: "#ef4444",
  },
  partial: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#f59e0b",
  },
};

const RECOVERY_OUTCOME_COLORS: Record<string, string> = {
  success: "#22c55e",
  failure: "#ef4444",
  expended: "#64748b",
};

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: "9px",
        fontWeight: 700,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "8px",
        marginTop: "16px",
      }}
    >
      {children}
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors = OUTCOME_COLORS[outcome] ?? OUTCOME_COLORS.success;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {outcome}
    </span>
  );
}

function BoosterCard({ booster }: { booster: BoosterRecoveryDetail }) {
  const outcomeColor = RECOVERY_OUTCOME_COLORS[booster.outcome] ?? "#64748b";
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "6px",
        padding: "8px 10px",
        marginBottom: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        {booster.boosterId && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#e2e8f0",
              fontFamily: "monospace",
            }}
          >
            {booster.boosterId}
          </span>
        )}
        {booster.flightNumber && (
          <span style={{ fontSize: "9px", color: "#64748b" }}>
            Flight #{booster.flightNumber}
          </span>
        )}
        <span
          style={{
            fontSize: "9px",
            fontWeight: 600,
            color: outcomeColor,
            textTransform: "uppercase",
            marginLeft: "auto",
          }}
        >
          {booster.outcome}
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: 1.4 }}>
        <div>
          <span style={{ color: "#64748b" }}>Landing: </span>
          {booster.landingType}
        </div>
        <div>
          <span style={{ color: "#64748b" }}>Location: </span>
          {booster.landingLocation}
        </div>
        {booster.note && (
          <div style={{ marginTop: "4px", color: "#64748b", fontStyle: "italic" }}>
            {booster.note}
          </div>
        )}
      </div>
    </div>
  );
}

function EventTimeline({ events }: { events: FlightHistoryEvent[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: "16px" }}>
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: "4px",
          top: "4px",
          bottom: "4px",
          width: "1px",
          background: "rgba(34, 211, 238, 0.2)",
        }}
      />
      {events.map((evt, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            marginBottom: "8px",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: "-14px",
              top: "4px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#22d3ee",
              border: "1px solid rgba(10, 14, 26, 0.8)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#22d3ee",
              fontFamily: "monospace",
              minWidth: "44px",
              flexShrink: 0,
            }}
          >
            {evt.time}
          </span>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#e2e8f0" }}>
              {evt.event}
            </div>
            {evt.detail && (
              <div style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.3 }}>
                {evt.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getRocketTypePill(rocketType: string): { bg: string; color: string } {
  if (rocketType.includes("Heavy")) return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
  if (rocketType.includes("Starship")) return { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" };
  return { bg: "rgba(34, 211, 238, 0.12)", color: "#22d3ee" };
}

/** Format a launch status into a human-readable label */
function formatLaunchStatus(launch: Launch): string {
  const ls = launch.launchStatus ?? launch.status;
  switch (ls) {
    case "partial_failure": return "Partial Failure";
    case "prelaunch_failure": return "Prelaunch Failure";
    default: return ls.charAt(0).toUpperCase() + ls.slice(1);
  }
}

/** Status color mapping for the new granular statuses */
function getStatusColors(launch: Launch): { bg: string; border: string; text: string } {
  const ls = launch.launchStatus ?? launch.status;
  switch (ls) {
    case "success": return OUTCOME_COLORS.success;
    case "failure":
    case "prelaunch_failure": return OUTCOME_COLORS.failure;
    case "partial_failure": return OUTCOME_COLORS.partial;
    default: return { bg: "rgba(34, 211, 238, 0.12)", border: "rgba(34, 211, 238, 0.4)", text: "#22d3ee" };
  }
}

/** Failure category display name */
function formatFailureCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InfoPanelContent({ launch }: { launch: Launch }) {
  const [videoExpanded, setVideoExpanded] = useState(false);
  const fh = launch.flightHistory;
  const pill = getRocketTypePill(launch.rocketType);

  const videoId = launch.webcastUrl ? extractVideoId(launch.webcastUrl) : null;
  const showWebcast =
    videoId && launch.status !== "upcoming";

  const hasFailureInfo = launch.failureCategory || launch.failureSummary;
  const hasCoreInfo = launch.cores && launch.cores.length > 0;
  const hasPayloadInfo = launch.payloads && launch.payloads.length > 0;

  return (
    <div
      style={{
        padding: "16px",
        overflowY: "auto",
        flex: 1,
      }}
    >
      {/* Rocket type pill + variant + flight number + date */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 600,
            background: pill.bg,
            color: pill.color,
            border: `1px solid ${pill.color}40`,
          }}
        >
          {launch.rocketType}
        </span>
        {launch.vehicleVariant && (
          <span style={{ fontSize: "10px", color: "#64748b" }}>
            {launch.vehicleVariant}
          </span>
        )}
        {(launch.familyFlightNumber || fh?.flightNumber != null) && (
          <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>
            {launch.familyFlightNumber ?? `Flight #${fh?.flightNumber}`}
          </span>
        )}
        {/* Granular launch status badge */}
        {launch.launchStatus && launch.launchStatus !== launch.status && (
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "9px",
              fontWeight: 700,
              ...getStatusColors(launch),
              border: `1px solid ${getStatusColors(launch).border}`,
              textTransform: "uppercase",
            }}
          >
            {formatLaunchStatus(launch)}
          </span>
        )}
      </div>

      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>
        {new Date(launch.dateUtc).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        {" at "}
        {new Date(launch.dateUtc).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })}
      </div>

      {/* Webcast */}
      {showWebcast && (
        <>
          <div
            style={{
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`}
              width="100%"
              height="195"
              style={{ border: "none", display: "block" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setVideoExpanded(true)}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Expand fullscreen"
            >
              {"⛶"}
            </button>
          </div>

          {/* Fullscreen overlay */}
          {videoExpanded && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "rgba(0, 0, 0, 0.92)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                  }}
                >
                  WEBCAST — {launch.name}
                </span>
                <button
                  onClick={() => setVideoExpanded(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 20,
                    padding: "4px 8px",
                    lineHeight: 1,
                  }}
                >
                  {"\u2715"}
                </button>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`}
                width="80%"
                height="80%"
                style={{ border: "none", borderRadius: 8, maxWidth: 1280, maxHeight: 720 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </>
      )}

      {/* Flight History content (rich hand-curated data) */}
      {fh ? (
        <>
          {/* Mission Outcome */}
          <SectionTitle>Mission Outcome</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <OutcomeBadge outcome={fh.missionOutcome} />
            {fh.significance && (
              <span style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic" }}>
                {fh.significance}
              </span>
            )}
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5, margin: "6px 0 0" }}>
            {fh.missionSummary}
          </p>

          {/* Payload */}
          <SectionTitle>Payload</SectionTitle>
          <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
            {fh.customer && (
              <div>
                <span style={{ color: "#64748b" }}>Customer: </span>
                <span style={{ color: "#e2e8f0" }}>{fh.customer}</span>
              </div>
            )}
            <div>
              <span style={{ color: "#64748b" }}>Payload: </span>
              {fh.payloadInfo}
            </div>
            {fh.payloadMassKg && (
              <div>
                <span style={{ color: "#64748b" }}>Mass: </span>
                <span style={{ color: "#22d3ee" }}>
                  {fh.payloadMassKg.toLocaleString()} kg
                </span>
              </div>
            )}
            {launch.payloadOrbit && (
              <div>
                <span style={{ color: "#64748b" }}>Orbit: </span>
                <span style={{ color: "#22d3ee" }}>{launch.payloadOrbit}</span>
              </div>
            )}
          </div>

          {/* Booster Recovery */}
          {fh.boosterRecovery && fh.boosterRecovery.length > 0 && (
            <>
              <SectionTitle>Booster Recovery</SectionTitle>
              {fh.boosterRecovery.map((b, i) => (
                <BoosterCard key={i} booster={b} />
              ))}
            </>
          )}

          {/* Key Events */}
          {fh.keyEvents && fh.keyEvents.length > 0 && (
            <>
              <SectionTitle>Key Events</SectionTitle>
              <EventTimeline events={fh.keyEvents} />
            </>
          )}

          {/* Notes */}
          {fh.notes && fh.notes.length > 0 && (
            <>
              <SectionTitle>Notes</SectionTitle>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "16px",
                  fontSize: "10px",
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {fh.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        /* Auto-generated info from database fields */
        <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
          {/* Failure details (new rich data) */}
          {hasFailureInfo && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "6px",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                Failure Detail
              </div>
              {launch.failureCategory && (
                <div style={{ marginBottom: "2px" }}>
                  <span style={{ color: "#64748b" }}>Category: </span>
                  <span style={{ color: "#fca5a5" }}>{formatFailureCategory(launch.failureCategory)}</span>
                </div>
              )}
              {launch.explosionPhase && (
                <div style={{ marginBottom: "2px" }}>
                  <span style={{ color: "#64748b" }}>Phase: </span>
                  <span style={{ color: "#fca5a5" }}>{formatFailureCategory(launch.explosionPhase)}</span>
                </div>
              )}
              {launch.failureSummary && (
                <div style={{ color: "#94a3b8", marginTop: "4px" }}>{launch.failureSummary}</div>
              )}
              {launch.failureDetail && (
                <div style={{ color: "#64748b", marginTop: "4px", fontSize: "10px" }}>{launch.failureDetail}</div>
              )}
            </div>
          )}

          {/* Outcome summary row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {launch.payloadOutcome && (
              <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                Payload: {launch.payloadOutcome}
              </span>
            )}
            {launch.boosterRecoveryOutcome && (
              <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                Booster: {launch.boosterRecoveryOutcome}
              </span>
            )}
            {launch.shipRecoveryOutcome && (
              <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                Ship: {launch.shipRecoveryOutcome}
              </span>
            )}
          </div>

          {launch.payloadOrbit && (
            <div style={{ marginBottom: "4px" }}>
              <span style={{ color: "#64748b" }}>Orbit: </span>
              <span style={{ color: "#22d3ee" }}>{launch.payloadOrbit}</span>
              {launch.inclinationDeg != null && (
                <span style={{ color: "#64748b" }}> ({launch.inclinationDeg}°)</span>
              )}
            </div>
          )}

          {/* Core / booster info (from database) */}
          {hasCoreInfo && (
            <>
              <SectionTitle>Booster Details</SectionTitle>
              {launch.cores!.map((core, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    marginBottom: "4px",
                    fontSize: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    {core.core_serial && (
                      <span style={{ fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>
                        {core.core_serial}
                      </span>
                    )}
                    {core.core_flight_number && (
                      <span style={{ color: "#64748b" }}>Flight #{core.core_flight_number}</span>
                    )}
                    {core.reused && (
                      <span style={{ fontSize: "8px", padding: "1px 4px", borderRadius: "2px", background: "rgba(34, 211, 238, 0.12)", color: "#22d3ee", fontWeight: 600 }}>
                        REUSED
                      </span>
                    )}
                    {core.landing_success != null && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "9px",
                          fontWeight: 600,
                          color: core.landing_success ? "#22c55e" : "#ef4444",
                          textTransform: "uppercase",
                        }}
                      >
                        {core.landing_success ? "LANDED" : "LOST"}
                      </span>
                    )}
                  </div>
                  {core.landing_type && (
                    <div>
                      <span style={{ color: "#64748b" }}>Landing: </span>
                      <span style={{ color: "#94a3b8" }}>{core.landing_type}</span>
                      {core.landing_pad && <span style={{ color: "#64748b" }}> ({core.landing_pad})</span>}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Payload info (from database) */}
          {hasPayloadInfo && (
            <>
              <SectionTitle>Payloads</SectionTitle>
              {launch.payloads!.map((pl, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "10px",
                    marginBottom: "4px",
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {pl.payload_name ?? pl.payload_id ?? `Payload ${i + 1}`}
                  </span>
                  {pl.payload_type && (
                    <span style={{ color: "#64748b" }}> ({pl.payload_type})</span>
                  )}
                  {pl.customer_name && (
                    <div>
                      <span style={{ color: "#64748b" }}>Customer: </span>
                      <span style={{ color: "#94a3b8" }}>{pl.customer_name}</span>
                    </div>
                  )}
                  {pl.orbit && (
                    <div>
                      <span style={{ color: "#64748b" }}>Orbit: </span>
                      <span style={{ color: "#22d3ee" }}>{pl.orbit}</span>
                    </div>
                  )}
                  {pl.mass_kg != null && (
                    <div>
                      <span style={{ color: "#64748b" }}>Mass: </span>
                      <span style={{ color: "#22d3ee" }}>{pl.mass_kg.toLocaleString()} kg</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {launch.boosterReturn && (
            <div style={{ marginBottom: "4px" }}>
              <span style={{ color: "#64748b" }}>Recovery: </span>
              <span style={{ color: "#f59e0b" }}>
                {launch.boosterReturn.landingType}
              </span>
              {launch.landingZone && (
                <span style={{ color: "#64748b" }}> ({launch.landingZone})</span>
              )}
            </div>
          )}
          {launch.details && (
            <div style={{ color: "#94a3b8", marginTop: "8px" }}>{launch.details}</div>
          )}
          <div style={{ marginTop: "8px" }}>
            <span style={{ color: "#64748b" }}>Site: </span>
            {launch.launchSite.fullName}
          </div>

          {/* Trajectory inference info */}
          {launch.trajectoryInference && (
            <div style={{ marginTop: "8px" }}>
              <span style={{ color: "#64748b" }}>Trajectory: </span>
              <span style={{ color: "#2dd4bf" }}>
                {launch.trajectoryInference.direction_label} ({launch.trajectoryInference.heading_deg}°)
              </span>
              <span style={{ color: "#475569", fontSize: "9px" }}>
                {" "}[{launch.trajectoryInference.confidence}]
              </span>
            </div>
          )}

          {/* UI flags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
            {launch.isCrewed && (
              <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontWeight: 600, border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                CREWED
              </span>
            )}
            {launch.isStarlink && (
              <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(34, 211, 238, 0.08)", color: "#67e8f9", fontWeight: 600, border: "1px solid rgba(34, 211, 238, 0.2)" }}>
                STARLINK
              </span>
            )}
            {launch.testFlight && (
              <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", fontWeight: 600, border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                TEST FLIGHT
              </span>
            )}
          </div>

          {!launch.details && !launch.payloadOrbit && !launch.boosterReturn && !hasCoreInfo && !hasPayloadInfo && !hasFailureInfo && (
            <div style={{ color: "#475569", fontStyle: "italic", marginTop: "12px" }}>
              No additional details available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InfoPanel() {
  const infoPanelLaunchId = useAppStore((s) => s.infoPanelLaunchId);
  const closeInfoPanel = useAppStore((s) => s.closeInfoPanel);
  const launches = useAppStore((s) => s.launches);
  const focusMode = useAppStore((s) => s.focusMode);
  const isMobile = useIsMobile();

  const launch = useMemo(() => {
    if (!infoPanelLaunchId) return null;
    return launches.find((l) => l.id === infoPanelLaunchId) ?? null;
  }, [infoPanelLaunchId, launches]);

  const isOpen = launch !== null;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(18, 24, 41, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        opacity: isOpen && !focusMode ? 1 : 0,
        pointerEvents: isOpen && !focusMode ? "auto" : "none",
        transition: "opacity 0.25s ease",
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        bottom: `${TIMELINE.HEIGHT}px`,
        width: "380px",
        zIndex: 40,
        transform: isOpen && !focusMode ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        background: "rgba(18, 24, 41, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        pointerEvents: isOpen && !focusMode ? "auto" : "none",
      };

  const closeButtonSize = isMobile ? 44 : 28;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: isMobile ? "16px 16px 12px" : "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#e2e8f0",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {launch?.name ?? ""}
          </h2>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
            {launch?.launchSite.name ?? ""}
          </div>
        </div>
        <button
          onClick={closeInfoPanel}
          style={{
            width: `${closeButtonSize}px`,
            height: `${closeButtonSize}px`,
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: isMobile ? "18px" : "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Close info panel"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Content */}
      {launch && <InfoPanelContent launch={launch} />}
    </div>
  );
}
