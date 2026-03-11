"use client";

import { useEffect, useRef, useState } from "react";
import "./entry-animations.css";

interface Props {
  onStartOnboarding: () => void;
  onDismiss: () => void;
}

/* ── Combined rocket + globe icon (48px, centered above title) ── */
function RocketGlobeIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Globe */}
      <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="1.2" opacity="0.5" />
      <path d="M4 16h24" stroke="white" strokeWidth="0.8" opacity="0.3" />
      <path d="M16 4c2.5 2.5 4 7.5 4 12s-1.5 9.5-4 12c-2.5-2.5-4-7.5-4-12s1.5-9.5 4-12z" stroke="white" strokeWidth="0.8" opacity="0.3" />
      {/* Rocket */}
      <path
        d="M16 6c0 0-4 4-4 10c0 3 1 5 2 6.5l2-2.5l2 2.5c1-1.5 2-3.5 2-6.5c0-6-4-10-4-10z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="16" cy="14" r="1.5" fill="#0a0e1a" />
    </svg>
  );
}

/* ── Small rocket icon for CTA launch animation ───────────── */
function SmallRocketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

/* Jellyfish cursor data URI */
const JELLYFISH_CURSOR = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='28' font-size='28'>%F0%9F%AA%BC</text></svg>") 16 16, auto`;

export default function IntroModal({ onStartOnboarding, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [ctaHovered, setCtaHovered] = useState(false);

  // Delay entry by 500ms
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Focus CTA on mount
  useEffect(() => {
    if (visible && ctaRef.current) {
      ctaRef.current.focus();
    }
  }, [visible]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  const handleCTAClick = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    // After micro-animation completes, trigger the camera zoom
    setTimeout(() => {
      onStartOnboarding();
    }, 650);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        animation: "modal-enter 0.4s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-heading"
        style={{
          maxWidth: 520,
          width: "calc(100% - 48px)",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column" as const,
          background: "rgba(10, 15, 25, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 14,
          border: "1px solid rgba(6, 182, 212, 0.15)",
          padding: "28px 28px 24px",
          animation: "modal-enter 0.4s ease-out",
        }}
      >
        {/* Icon — centered */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <RocketGlobeIcon />
        </div>

        {/* Title */}
        <h2
          id="intro-heading"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "0.04em",
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Rocket Manifest
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 15,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          What this does:
        </p>

        {/* Feature list — all items including jellyfish as regular bullets */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
            padding: "0 4px",
          }}
        >
          <FeatureBullet text="Visualize trajectories of past, present & future launches" />
          <FeatureBullet text="Full SpaceX flight schedule on a live timeline" />
          <FeatureBullet text="See drone ship positions and booster landings" />
          <FeatureBullet text="Browse launch history \u2014 successes, failures, and context" />
          <FeatureBullet text="Detailed info on every individual launch" />

          {/* Jellyfish — same style as other bullets, cursor easter egg on link */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#94a3b8",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22d3ee",
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <span>
              Jellyfish visibility predictions powered by{" "}
              <a
                href="https://jellyfish.johnkrausphotos.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#c084fc",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  cursor: JELLYFISH_CURSOR,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                John Kraus&apos;s Jellyfish Predictor
              </a>
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: "center" }}>
          <button
            ref={ctaRef}
            onClick={handleCTAClick}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              background: "#06B6D4",
              color: "#0a0e1a",
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: isLaunching ? "default" : "pointer",
              letterSpacing: "0.02em",
              transition: "transform 0.15s ease, filter 0.15s ease",
              transform: ctaHovered && !isLaunching ? "scale(1.02)" : "scale(1)",
              filter: ctaHovered && !isLaunching ? "brightness(1.1)" : "brightness(1)",
              outline: "none",
              minWidth: 220,
              minHeight: 48,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Button text — fades out when launching */}
            <span
              style={{
                display: "inline-block",
                transition: "all 0.3s ease",
                opacity: isLaunching ? 0 : 1,
                transform: isLaunching ? "translateY(-8px)" : "translateY(0)",
              }}
            >
              Let&apos;s explore launches
            </span>

            {/* Rocket icon — fades in and flies up when launching */}
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: isLaunching
                  ? "translate(-50%, -120%)"
                  : "translate(-50%, 50%)",
                opacity: isLaunching ? 1 : 0,
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                color: "#0a0e1a",
              }}
            >
              <SmallRocketIcon />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable feature bullet ── */
function FeatureBullet({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13,
        lineHeight: 1.5,
        color: "#94a3b8",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#22d3ee",
          flexShrink: 0,
          marginTop: 7,
        }}
      />
      <span>{text}</span>
    </div>
  );
}
