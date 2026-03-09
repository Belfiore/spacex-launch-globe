"use client";

import { useEffect, useRef, useState } from "react";
import "./entry-animations.css";

interface Props {
  onStartOnboarding: () => void;
  onDismiss: () => void;
}

function GlobeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06B6D4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06B6D4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06B6D4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const FEATURES = [
  { icon: <GlobeIcon />, label: "3 Launch Sites" },
  { icon: <RocketIcon />, label: "Full Mission Profiles" },
  { icon: <ClockIcon />, label: "Past, Present & Future" },
];

export default function IntroModal({ onStartOnboarding, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
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
        background: "rgba(0, 0, 0, 0.4)",
        animation: "modal-enter 0.4s ease-out",
      }}
      onClick={(e) => {
        // Click outside modal dismisses
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
          background: "rgba(10, 15, 25, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 14,
          border: "1px solid rgba(6, 182, 212, 0.15)",
          padding: "36px 32px 28px",
          animation: "modal-enter 0.4s ease-out",
        }}
      >
        {/* Heading */}
        <h2
          id="intro-heading"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#e2e8f0",
            letterSpacing: "0.04em",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Welcome to Rocket Manifest
        </h2>

        {/* Body text */}
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: "#94a3b8",
            marginBottom: 24,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            Explore every SpaceX launch — past, present, and future — visualized
            on an interactive 3D globe.
          </p>
          <p style={{ marginBottom: 0 }}>
            Watch Falcon 9, Falcon Heavy, and Starship missions lift off from
            Cape Canaveral, Vandenberg, and Starbase. See full mission profiles
            including stage separation, booster landings, and orbital insertion.
          </p>
        </div>

        {/* Feature callouts */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 28,
            marginBottom: 28,
            padding: "16px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {f.icon}
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: "center" }}>
          <button
            ref={ctaRef}
            onClick={onStartOnboarding}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              background: "#06B6D4",
              color: "#0a0e1a",
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "transform 0.15s ease, filter 0.15s ease",
              transform: ctaHovered ? "scale(1.02)" : "scale(1)",
              filter: ctaHovered ? "brightness(1.1)" : "brightness(1)",
              outline: "none",
            }}
          >
            Let&apos;s Start
          </button>
        </div>

        {/* Don't show again */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
              textDecoration: "underline",
              textDecorationColor: "rgba(71,85,105,0.4)",
              textUnderlineOffset: 3,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#94a3b8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#475569")
            }
          >
            Don&apos;t show this again
          </button>
        </div>
      </div>
    </div>
  );
}
