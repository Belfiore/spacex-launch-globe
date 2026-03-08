"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

interface MissionPhase {
  label: string;
  tSeconds: number;
  color: string;
  narration: string;
}

// ── Falcon 9 mission phases ─────────────────────────────────────
function getFalcon9Phases(): MissionPhase[] {
  return [
    { label: "Ignition", tSeconds: -3, color: "#f59e0b", narration: "Engine chill-down sequence initiated" },
    { label: "Liftoff", tSeconds: 0, color: "#22d3ee", narration: "Main engine ignition \u2014 liftoff!" },
    { label: "Max-Q", tSeconds: 72, color: "#818cf8", narration: "Max aerodynamic pressure (Max-Q)" },
    { label: "MECO", tSeconds: 155, color: "#f59e0b", narration: "Main engine cutoff (MECO)" },
    { label: "Sep", tSeconds: 158, color: "#ef4444", narration: "First stage separation confirmed" },
    { label: "SES-1", tSeconds: 165, color: "#22d3ee", narration: "Second engine start \u2014 upper stage ignition" },
    { label: "Entry", tSeconds: 390, color: "#f97316", narration: "First stage entry burn initiated" },
    { label: "Landing", tSeconds: 510, color: "#22c55e", narration: "First stage landing burn \u2014 touchdown!" },
    { label: "SECO", tSeconds: 520, color: "#a78bfa", narration: "Second engine cutoff \u2014 orbit achieved" },
    { label: "Deploy", tSeconds: 930, color: "#3b82f6", narration: "Payload deployment confirmed" },
  ];
}

// ── Falcon Heavy mission phases ─────────────────────────────────
function getFalconHeavyPhases(): MissionPhase[] {
  return [
    { label: "Ignition", tSeconds: -3, color: "#f59e0b", narration: "Twenty-seven Merlin engines igniting" },
    { label: "Liftoff", tSeconds: 0, color: "#22d3ee", narration: "All engines nominal \u2014 Falcon Heavy liftoff!" },
    { label: "Max-Q", tSeconds: 65, color: "#818cf8", narration: "Maximum dynamic pressure" },
    { label: "Side Sep", tSeconds: 150, color: "#ef4444", narration: "Side booster separation confirmed" },
    { label: "MECO", tSeconds: 210, color: "#f59e0b", narration: "Center core main engine cutoff" },
    { label: "Sep", tSeconds: 213, color: "#ef4444", narration: "Center core separation" },
    { label: "SES-1", tSeconds: 220, color: "#22d3ee", narration: "Upper stage engine start" },
    { label: "Side Land", tSeconds: 450, color: "#22c55e", narration: "Side boosters landing \u2014 simultaneous touchdown!" },
    { label: "Core Land", tSeconds: 510, color: "#22c55e", narration: "Center core landing burn" },
    { label: "SECO", tSeconds: 540, color: "#a78bfa", narration: "Second engine cutoff \u2014 coast phase" },
  ];
}

// ── Starship mission phases ─────────────────────────────────────
function getStarshipPhases(): MissionPhase[] {
  return [
    { label: "Ignition", tSeconds: -5, color: "#f59e0b", narration: "Raptor engine ignition sequence" },
    { label: "Liftoff", tSeconds: 0, color: "#22d3ee", narration: "All engines nominal \u2014 Starship liftoff!" },
    { label: "Max-Q", tSeconds: 62, color: "#818cf8", narration: "Maximum dynamic pressure" },
    { label: "Hot Sep", tSeconds: 170, color: "#ef4444", narration: "Hot-staging separation \u2014 ship engines ignite" },
    { label: "Boostback", tSeconds: 195, color: "#f97316", narration: "Super Heavy boostback burn initiated" },
    { label: "Ship SES", tSeconds: 200, color: "#22d3ee", narration: "Ship engines at full thrust" },
    { label: "Land Burn", tSeconds: 410, color: "#22c55e", narration: "Super Heavy landing burn \u2014 tower approach" },
    { label: "Catch", tSeconds: 430, color: "#22c55e", narration: "Mechazilla catch attempt!" },
    { label: "SECO", tSeconds: 510, color: "#a78bfa", narration: "Ship engine cutoff \u2014 orbit insertion" },
  ];
}

function getPhasesForRocket(rocketType: string): MissionPhase[] {
  if (rocketType === "Falcon Heavy") return getFalconHeavyPhases();
  if (rocketType === "Starship") return getStarshipPhases();
  return getFalcon9Phases();
}

function formatT(seconds: number): string {
  const sign = seconds < 0 ? "-" : "+";
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  return `T${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Mini timeline playback speed: 10x real time => 15-min mission plays in ~90 seconds */
const MINI_PLAYBACK_SPEED = 10;

export default function MiniTimeline() {
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const timelineDate = useAppStore((s) => s.timelineDate);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const miniTimelinePlaying = useAppStore((s) => s.miniTimelinePlaying);
  const setMiniTimelinePlaying = useAppStore((s) => s.setMiniTimelinePlaying);
  const setPlaybackState = useAppStore((s) => s.setPlaybackState);
  const setCameraMode = useAppStore((s) => s.setCameraMode);

  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Local time state for isolated mini timeline playback (seconds relative to T-0)
  const [localT, setLocalT] = useState<number | null>(null);
  const localTRef = useRef<number | null>(null);

  const phases = useMemo(() => {
    if (!selectedLaunch) return [];
    return getPhasesForRocket(selectedLaunch.rocketType);
  }, [selectedLaunch]);

  // Current T from global timeline (used when NOT in mini-playback mode)
  const globalT = useMemo(() => {
    if (!selectedLaunch) return null;
    const launchMs = new Date(selectedLaunch.dateUtc).getTime();
    return (timelineDate.getTime() - launchMs) / 1000;
  }, [selectedLaunch, timelineDate]);

  // Display T: use localT when mini timeline is playing, else use globalT
  const displayT = miniTimelinePlaying && localT !== null ? localT : globalT;

  // Reset localT when selected launch changes
  useEffect(() => {
    localTRef.current = null;
    setLocalT(null);
    setMiniTimelinePlaying(false);
  }, [selectedLaunch?.id, setMiniTimelinePlaying]);

  // ── Isolated RAF loop for mini timeline playback ──────────────
  useEffect(() => {
    if (!miniTimelinePlaying || !selectedLaunch || phases.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastFrameTimeRef.current = 0;

    function tick(timestamp: number) {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const delta = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const prev = localTRef.current;
      if (prev === null) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const newT = prev + delta * MINI_PLAYBACK_SPEED;
      const store = useAppStore.getState();
      const phasesArr = getPhasesForRocket(store.selectedLaunch?.rocketType ?? "Falcon 9");
      const maxT = phasesArr[phasesArr.length - 1].tSeconds + 30;

      if (newT >= maxT) {
        // Auto-stop at end of mission phases
        localTRef.current = maxT;
        setLocalT(maxT);
        // Defer store updates to avoid setState-during-render
        queueMicrotask(() => {
          useAppStore.getState().setMiniTimelinePlaying(false);
          if (store.selectedLaunch) {
            const launchMs = new Date(store.selectedLaunch.dateUtc).getTime();
            useAppStore.getState().setTimelineDate(new Date(launchMs + maxT * 1000));
          }
        });
        return; // Don't request another frame
      }

      localTRef.current = newT;
      setLocalT(newT);

      // Sync global timeline so the globe shows matching state (deferred)
      if (store.selectedLaunch) {
        const launchMs = new Date(store.selectedLaunch.dateUtc).getTime();
        useAppStore.getState().setTimelineDate(new Date(launchMs + newT * 1000));
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [miniTimelinePlaying, selectedLaunch, phases]);

  // ── Play/pause handler (isolated from main playback) ──────────
  const handlePlayPause = useCallback(() => {
    if (miniTimelinePlaying) {
      setMiniTimelinePlaying(false);
    } else {
      // Pause main playback to avoid conflicts
      setPlaybackState("paused");
      setCameraMode("auto");

      // Initialize localT from current global timeline position
      if (selectedLaunch) {
        const launchMs = new Date(selectedLaunch.dateUtc).getTime();
        const initT = (useAppStore.getState().timelineDate.getTime() - launchMs) / 1000;
        const minT = phases.length > 0 ? phases[0].tSeconds : 0;
        const startT = Math.max(minT, initT);
        localTRef.current = startT;
        setLocalT(startT);
      }

      setMiniTimelinePlaying(true);
    }
  }, [miniTimelinePlaying, setMiniTimelinePlaying, setPlaybackState, setCameraMode, selectedLaunch, phases]);

  // ── Scrub handler ─────────────────────────────────────────────
  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedLaunch || !trackRef.current || phases.length === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const minT = phases[0].tSeconds;
      const maxT = phases[phases.length - 1].tSeconds;
      const targetT = minT + pct * (maxT - minT);
      localTRef.current = targetT;
      setLocalT(targetT);
      const launchMs = new Date(selectedLaunch.dateUtc).getTime();
      setTimelineDate(new Date(launchMs + targetT * 1000));
    },
    [selectedLaunch, phases, setTimelineDate]
  );

  // ── Current narration ─────────────────────────────────────────
  const currentNarration = useMemo(() => {
    if (displayT === null || phases.length === 0) return null;
    let active: MissionPhase | null = null;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (displayT >= phases[i].tSeconds) {
        active = phases[i];
        break;
      }
    }
    return active;
  }, [displayT, phases]);

  if (!selectedLaunch || displayT === null || phases.length === 0) return null;

  const maxPhaseT = phases[phases.length - 1].tSeconds;
  const minT = phases[0].tSeconds;
  if (displayT < minT - 120 || displayT > maxPhaseT + 120) return null;

  const range = maxPhaseT - minT;
  const progressPct = Math.max(0, Math.min(100, ((displayT - minT) / range) * 100));

  return (
    <div
      style={{
        position: "fixed",
        bottom: "92px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
      }}
    >
      {/* Inject animations */}
      <style>{`
        @keyframes miniNarrationFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes miniPlayPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(34, 211, 238, 0.4); }
          50% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.7); }
        }
      `}</style>

      {/* Narration overlay */}
      {currentNarration && (
        <div
          key={currentNarration.label}
          style={{
            fontSize: "11px",
            fontFamily: "monospace",
            color: currentNarration.color,
            textAlign: "center",
            padding: "4px 14px",
            background: "rgba(10, 14, 26, 0.8)",
            borderRadius: "4px",
            border: `1px solid ${currentNarration.color}33`,
            maxWidth: "min(520px, 70vw)",
            animation: "miniNarrationFadeIn 0.4s ease-out",
            textShadow: `0 0 8px ${currentNarration.color}44`,
            whiteSpace: "nowrap",
          }}
        >
          {currentNarration.narration}
        </div>
      )}

      {/* Header: mission name + T count + play button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "10px",
          fontFamily: "monospace",
          color: "#94a3b8",
        }}
      >
        <button
          onClick={handlePlayPause}
          style={{
            background: miniTimelinePlaying
              ? "rgba(34, 211, 238, 0.25)"
              : "rgba(34, 211, 238, 0.15)",
            border: "1px solid rgba(34, 211, 238, 0.5)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#22d3ee",
            fontSize: "16px",
            padding: 0,
            pointerEvents: "auto",
            boxShadow: "0 0 12px rgba(34, 211, 238, 0.4)",
            animation: miniTimelinePlaying
              ? "miniPlayPulse 2s ease-in-out infinite"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          {miniTimelinePlaying ? "\u23F8" : "\u25B6"}
        </button>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
          {selectedLaunch.name}
        </span>
        <span style={{ color: displayT >= 0 ? "#22d3ee" : "#f59e0b" }}>
          {formatT(displayT)}
        </span>
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onClick={handleScrub}
        style={{
          position: "relative",
          width: "min(520px, 70vw)",
          height: "28px",
          background: "rgba(10, 14, 26, 0.88)",
          borderRadius: "5px",
          border: "1px solid #1e293b",
          backdropFilter: "blur(6px)",
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            top: "13px",
            left: "0",
            right: "0",
            height: "2px",
            background: "#1e293b",
          }}
        />

        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: "13px",
            left: "0",
            width: `${progressPct}%`,
            height: "2px",
            background: displayT >= 0 ? "#22d3ee" : "#f59e0b",
            transition: miniTimelinePlaying ? "none" : "width 0.15s linear",
          }}
        />

        {/* Playhead */}
        <div
          style={{
            position: "absolute",
            top: "9px",
            left: `${progressPct}%`,
            width: "6px",
            height: "10px",
            background: displayT >= 0 ? "#22d3ee" : "#f59e0b",
            borderRadius: "2px",
            transform: "translateX(-50%)",
            boxShadow: `0 0 6px ${displayT >= 0 ? "#22d3ee" : "#f59e0b"}`,
            transition: miniTimelinePlaying ? "none" : "left 0.15s linear",
          }}
        />

        {/* Phase dots */}
        {phases.map((phase, i) => {
          const pct = ((phase.tSeconds - minT) / range) * 100;
          const isPast = displayT >= phase.tSeconds;
          const isCurrent =
            displayT >= phase.tSeconds &&
            (i === phases.length - 1 || displayT < phases[i + 1].tSeconds);

          return (
            <div
              key={phase.label}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "0",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: isCurrent ? "7px" : "4px",
                  height: isCurrent ? "7px" : "4px",
                  borderRadius: "50%",
                  background: isPast ? phase.color : "#334155",
                  marginTop: isCurrent ? "10px" : "12px",
                  boxShadow: isCurrent ? `0 0 6px ${phase.color}` : "none",
                }}
              />
              {/* Labels — show every 3rd + current */}
              {(isCurrent || i % 3 === 0) && (
                <div
                  style={{
                    fontSize: "6px",
                    fontFamily: "monospace",
                    color: isPast ? phase.color : "#475569",
                    whiteSpace: "nowrap",
                    marginTop: "1px",
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {phase.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
