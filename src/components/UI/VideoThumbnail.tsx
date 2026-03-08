"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

type VideoMode = "collapsed" | "normal" | "expanded";

/** Extract YouTube video ID from a URL */
function extractVideoId(url: string): string | null {
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Handle youtube.com/embed/ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

export default function VideoThumbnail() {
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);

  const [mode, setMode] = useState<VideoMode>("normal");
  const [position, setPosition] = useState({ x: 20, y: 60 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastLaunchId = useRef<string | null>(null);

  // Reset mode & position when selected launch changes
  useEffect(() => {
    if (selectedLaunch?.id !== lastLaunchId.current) {
      lastLaunchId.current = selectedLaunch?.id ?? null;
      setMode("normal");
      setPosition({ x: 20, y: 60 });
    }
  }, [selectedLaunch?.id]);

  // ── Drag handlers ─────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "expanded") return;
      dragging.current = true;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    },
    [mode, position]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ── Don't render if no webcast URL or if launch is upcoming ────
  if (!selectedLaunch?.webcastUrl) return null;
  if (selectedLaunch.status === "upcoming") return null;

  const videoId = extractVideoId(selectedLaunch.webcastUrl);
  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`;

  // ── Collapsed mode — just a small icon ─────────────────────────
  if (mode === "collapsed") {
    return (
      <button
        onClick={() => setMode("normal")}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 50,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(18, 24, 41, 0.9)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.2s",
        }}
        title="Show webcast"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" fill="#22d3ee" />
        </svg>
      </button>
    );
  }

  // ── Expanded mode — fullscreen overlay ─────────────────────────
  if (mode === "expanded") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0, 0, 0, 0.92)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Top bar */}
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
            WEBCAST — {selectedLaunch.name}
          </span>
          <button
            onClick={() => setMode("normal")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 20,
              padding: "4px 8px",
              lineHeight: 1,
            }}
            title="Exit fullscreen"
          >
            ✕
          </button>
        </div>

        {/* Iframe */}
        <iframe
          src={embedUrl}
          width="80%"
          height="80%"
          style={{
            border: "none",
            borderRadius: 8,
            maxWidth: 1280,
            maxHeight: 720,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // ── Normal mode — floating 240×135 thumbnail ───────────────────
  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        width: 240,
        borderRadius: 8,
        overflow: "hidden",
        background: "rgba(18, 24, 41, 0.95)",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Title bar — draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          cursor: "grab",
          background: "rgba(148, 163, 184, 0.06)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          ▶ WEBCAST
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Expand button */}
          <button
            onClick={() => setMode("expanded")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
              padding: "0 4px",
              lineHeight: 1,
            }}
            title="Expand fullscreen"
          >
            ⛶
          </button>
          {/* Collapse button */}
          <button
            onClick={() => setMode("collapsed")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
              padding: "0 4px",
              lineHeight: 1,
            }}
            title="Collapse"
          >
            ✕
          </button>
        </div>
      </div>

      {/* YouTube iframe */}
      <iframe
        src={embedUrl}
        width="240"
        height="135"
        style={{ border: "none", display: "block" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
