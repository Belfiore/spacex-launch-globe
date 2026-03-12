"use client";

import { useState, useRef, useCallback } from "react";

interface TooltipProps {
  /** Simple text tooltip (backward-compatible) */
  text?: string;
  /** Rich content tooltip — overrides text if provided */
  content?: React.ReactNode;
  children: React.ReactNode;
  /** Position relative to the trigger element */
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * Instant tooltip — appears immediately on hover with no delay.
 * Replaces native title attribute for a consistent, styled experience.
 *
 * Supports both simple `text` and rich `content` (ReactNode) modes.
 */
export default function Tooltip({ text, content, children, position = "bottom" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  const isRich = !!content;

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    whiteSpace: isRich ? "normal" : "nowrap",
    maxWidth: isRich ? "280px" : undefined,
    padding: isRich ? "10px 14px" : "5px 10px",
    borderRadius: "6px",
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: 500,
    lineHeight: 1.3,
    pointerEvents: "none",
    zIndex: 9999,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.08s ease",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
    ...(position === "bottom" && {
      top: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)",
    }),
    ...(position === "top" && {
      bottom: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)",
    }),
    ...(position === "left" && {
      right: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)",
    }),
    ...(position === "right" && {
      left: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)",
    }),
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      <div role="tooltip" style={tooltipStyle}>
        {content ?? text}
      </div>
    </div>
  );
}
