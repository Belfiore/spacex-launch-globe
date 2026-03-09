"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "./entry-animations.css";

interface Props {
  isShortened: boolean;
  dataReady: boolean;
  onComplete: () => void;
}

const STATUS_LINES = [
  "Fetching launch manifest",
  "Loading orbital parameters",
  "Calculating trajectories",
  "Syncing ISS telemetry",
  "Initializing globe renderer",
];

export default function CinematicLoading({
  isShortened,
  dataReady,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [checkedLines, setCheckedLines] = useState<number[]>([]);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [progressWidth, setProgressWidth] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const completedRef = useRef(false);
  const skipRef = useRef(false);

  // Timing multipliers
  const t = isShortened ? 0.6 : 1;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Phase 1 → Phase 2 transition (slower — give time to see icon + title)
  useEffect(() => {
    const delay = isShortened ? 1000 : 2200;
    const timer = setTimeout(() => setPhase(2), delay);
    return () => clearTimeout(timer);
  }, [isShortened]);

  // Phase 2: Show status lines staggered (slower pacing)
  useEffect(() => {
    if (phase !== 2) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const lineDelay = isShortened ? 220 : 500;
    const checkDelay = isShortened ? 200 : 400;

    STATUS_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
        }, i * lineDelay)
      );
      const randomExtra = 150 + Math.random() * 300;
      timers.push(
        setTimeout(() => {
          setCheckedLines((prev) => [...prev, i]);
          setProgressWidth(((i + 1) / STATUS_LINES.length) * 80);
        }, i * lineDelay + checkDelay + randomExtra)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [phase, isShortened]);

  // Phase 2 → Phase 3 transition (wait for data + animation)
  useEffect(() => {
    if (phase !== 2) return;
    const totalLineTime = isShortened
      ? STATUS_LINES.length * 220 + 600
      : STATUS_LINES.length * 500 + 1000;
    const timer = setTimeout(() => {
      if (dataReady) {
        setProgressWidth(100);
        setTimeout(() => setPhase(3), 400);
      }
    }, totalLineTime);
    return () => clearTimeout(timer);
  }, [phase, isShortened, dataReady]);

  // If data arrives while stuck in phase 2, proceed to phase 3
  useEffect(() => {
    if (phase === 2 && dataReady && visibleLines.length === STATUS_LINES.length) {
      setProgressWidth(100);
      const timer = setTimeout(() => setPhase(3), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, dataReady, visibleLines.length]);

  // Phase 3: Simple fade-out
  useEffect(() => {
    if (phase !== 3 || skipRef.current) return;
    setFadeOut(true);
    const timer = setTimeout(finish, 800 * t);
    return () => clearTimeout(timer);
  }, [phase, t, finish]);

  // Escape key to skip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipRef.current = true;
        setFadeOut(true);
        setTimeout(finish, 300);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [finish]);

  if (fadeOut && completedRef.current) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: `opacity ${skipRef.current ? "0.3s" : `${0.8 * t}s`} ease-out`,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
      role="progressbar"
      aria-valuenow={progressWidth}
      aria-label="Loading application"
    >
      {/* Content wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Rocket Globe Icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rocket-globe.svg"
          alt="Rocket Manifest"
          width={64}
          height={64}
          style={{
            marginBottom: 20,
            opacity: 0,
            animation: `subtitle-fade 0.6s ease-out 0.1s forwards`,
            filter: "drop-shadow(0 0 12px rgba(6, 182, 212, 0.3))",
          }}
        />

        {/* Phase 1: Title */}
        <div
          style={{
            position: "relative",
            marginBottom: 12,
          }}
        >
          {/* Scanline */}
          {phase >= 1 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: 2,
                height: "120%",
                transform: "translateY(-50%)",
                background: "#06B6D4",
                boxShadow:
                  "0 0 12px #06B6D4, 0 0 25px rgba(6, 182, 212, 0.4)",
                animation: `scanline-sweep ${1.0 * t}s ease-out ${0.4 * t}s forwards`,
                opacity: phase > 1 ? 0 : 1,
                transition: "opacity 0.3s ease",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Title text */}
          <h1
            style={{
              fontSize: "clamp(18px, 4vw, 28px)",
              fontWeight: 600,
              color: "#e2e8f0",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              lineHeight: 1,
              margin: 0,
              clipPath: "inset(0 100% 0 0)",
              animation: `title-reveal ${1.0 * t}s ease-out ${0.4 * t}s forwards`,
            }}
          >
            Rocket Manifest
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(11px, 1.5vw, 14px)",
            color: "#94a3b8",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            margin: 0,
            opacity: 0,
            animation:
              phase >= 1
                ? `subtitle-fade 0.6s ease-out ${(0.4 + 1.0) * t + 0.3}s forwards`
                : undefined,
          }}
        >
          SpaceX Launch Visualization System
        </p>

        {/* Phase 2: Status lines */}
        {phase >= 2 && (
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "clamp(10px, 1.2vw, 13px)",
              minWidth: 280,
            }}
          >
            {STATUS_LINES.map((line, i) => {
              const isVisible = visibleLines.includes(i);
              const isChecked = checkedLines.includes(i);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translateX(0)"
                      : "translateX(-12px)",
                    transition: "opacity 0.3s ease, transform 0.3s ease, color 0.3s ease",
                    color: isChecked ? "#e2e8f0" : "#475569",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "#06B6D4", fontSize: "0.8em" }}>
                    {"\u25B8"}
                  </span>
                  <span style={{ flex: 1 }}>{line}...</span>
                  <span
                    style={{
                      color: "#22C55E",
                      fontWeight: 700,
                      fontSize: "1.1em",
                      opacity: isChecked ? 1 : 0,
                      transform: isChecked ? "scale(1)" : "scale(0)",
                      transition: "opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      display: "inline-block",
                      width: 16,
                      textAlign: "center",
                    }}
                  >
                    {"\u2713"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "rgba(255,255,255,0.05)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressWidth}%`,
            background: "#06B6D4",
            boxShadow: "0 0 8px rgba(6, 182, 212, 0.5)",
            transition: "width 0.5s ease",
            animation:
              phase === 2 && !dataReady && progressWidth >= 80
                ? "progress-pulse 1.5s ease infinite"
                : undefined,
          }}
        />
      </div>
    </div>
  );
}
