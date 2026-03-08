"use client";

import { create } from "zustand";
import type {
  Launch,
  PlaybackState,
  CameraMode,
  FilterState,
} from "@/lib/types";

interface AppState {
  // Data
  launches: Launch[];
  setLaunches: (launches: Launch[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Selection
  selectedLaunch: Launch | null;
  setSelectedLaunch: (launch: Launch | null) => void;

  // Timeline
  timelineDate: Date;
  setTimelineDate: (date: Date) => void;

  // Playback
  playbackState: PlaybackState;
  setPlaybackState: (state: PlaybackState) => void;

  // Mini timeline playback — the single source of truth for play/pause
  miniTimelinePlaying: boolean;
  setMiniTimelinePlaying: (playing: boolean) => void;

  // Unified playback actions (used by both card ▶ and mini timeline ▶)
  startMissionPlayback: () => void;
  pauseMissionPlayback: () => void;
  toggleMissionPlayback: () => void;

  // Panel
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;

  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  cameraTarget: { lat: number; lng: number } | null;
  setCameraTarget: (target: { lat: number; lng: number } | null) => void;
  /** Incrementing counter — any change signals a camera reset */
  cameraResetCounter: number;
  resetView: () => void;

  // Trajectory progress (0..1) — driven by mini timeline during playback
  trajectoryProgress: number;
  setTrajectoryProgress: (p: number) => void;

  // Orbit center mode
  orbitCenter: "usa" | "earth" | "launch";
  setOrbitCenter: (center: "usa" | "earth" | "launch") => void;
  centerOnLaunch: () => void;

  // ISS toggle
  showISS: boolean;
  setShowISS: (show: boolean) => void;
  toggleISS: () => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  rocketType: null,
  status: null,
  site: null,
  sites: [],
  jellyfish: false,
};

export const useAppStore = create<AppState>((set) => ({
  // Data
  launches: [],
  setLaunches: (launches) => set({ launches }),
  loading: true,
  setLoading: (loading) => set({ loading }),

  // Selection
  selectedLaunch: null,
  setSelectedLaunch: (launch) => set({ selectedLaunch: launch }),

  // Timeline
  timelineDate: new Date(),
  setTimelineDate: (date) => set({ timelineDate: date }),

  // Playback
  playbackState: "stopped",
  setPlaybackState: (state) => set({ playbackState: state }),

  // Mini timeline playback
  miniTimelinePlaying: false,
  setMiniTimelinePlaying: (playing) => set({ miniTimelinePlaying: playing }),

  // Unified playback actions
  startMissionPlayback: () =>
    set({ miniTimelinePlaying: true, playbackState: "playing" }),
  pauseMissionPlayback: () =>
    set({ miniTimelinePlaying: false, playbackState: "paused" }),
  toggleMissionPlayback: () =>
    set((s) =>
      s.miniTimelinePlaying
        ? { miniTimelinePlaying: false, playbackState: "paused" }
        : { miniTimelinePlaying: true, playbackState: "playing" }
    ),

  // Panel
  panelOpen: true,
  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  // Camera
  cameraMode: "free",
  setCameraMode: (mode) => set({ cameraMode: mode }),
  cameraTarget: null,
  setCameraTarget: (target) => set({ cameraTarget: target }),
  cameraResetCounter: 0,
  resetView: () =>
    set((s) => ({
      cameraResetCounter: s.cameraResetCounter + 1,
      cameraTarget: null,
      selectedLaunch: null,
      cameraMode: "free",
      miniTimelinePlaying: false,
      playbackState: "stopped",
      trajectoryProgress: 0,
      orbitCenter: "usa" as const,
    })),

  // Trajectory progress
  trajectoryProgress: 0,
  setTrajectoryProgress: (p) => set({ trajectoryProgress: p }),

  // Orbit center mode
  orbitCenter: "usa",
  setOrbitCenter: (center) => set({ orbitCenter: center }),
  centerOnLaunch: () =>
    set((s) => {
      if (!s.selectedLaunch) return {};
      return {
        orbitCenter: "launch" as const,
        cameraTarget: {
          lat: s.selectedLaunch.launchSite.lat,
          lng: s.selectedLaunch.launchSite.lng,
        },
      };
    }),

  // ISS toggle
  showISS: true,
  setShowISS: (show) => set({ showISS: show }),
  toggleISS: () => set((s) => ({ showISS: !s.showISS })),

  // Filters
  filters: { ...defaultFilters },
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
