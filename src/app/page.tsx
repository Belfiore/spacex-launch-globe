"use client";

import dynamic from "next/dynamic";
import { useSpaceXData } from "@/hooks/useSpaceXData";
import LaunchPanel from "@/components/LaunchPanel/LaunchPanel";
import Timeline from "@/components/Timeline/Timeline";

import LoadingScreen from "@/components/UI/LoadingScreen";
import ControlsPanel from "@/components/UI/ControlsPanel";
import MiniTimeline from "@/components/UI/MiniTimeline";
import VideoThumbnail from "@/components/UI/VideoThumbnail";

const Globe = dynamic(() => import("@/components/Globe/Globe"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  useSpaceXData();

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <Globe />

      {/* Controls panel — bottom left */}
      <ControlsPanel />

      {/* Title overlay - top left */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          left: "20px",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "-0.01em",
            lineHeight: 1,
            marginBottom: "3px",
          }}
        >
          SpaceX Launch Globe
        </h1>
        <p
          style={{
            fontSize: "10px",
            color: "#475569",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Mission Control
        </p>
      </div>

      {/* Mini mission timeline — above main timeline */}
      <MiniTimeline />

      {/* Floating video thumbnail — top left */}
      <VideoThumbnail />

      <LaunchPanel />
      <Timeline />
      <LoadingScreen />
    </main>
  );
}
