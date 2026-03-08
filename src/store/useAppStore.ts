"use client";

import { create } from "zustand";
import type {
  Launch,
  PlaybackState,
  CameraMode,
  FilterState,
  CinematicPhase,
  SequentialState,
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

  // Mini timeline playback (isolated from main playback)
  miniTimelinePlaying: boolean;
  setMiniTimelinePlaying: (playing: boolean) => void;

  // Sequential launch navigation
  currentLaunchIndex: number;
  setCurrentLaunchIndex: (idx: number) => void;
  sequentialState: SequentialState;
  setSequentialState: (state: SequentialState) => void;

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

  // Cinematic phase
  cinematicPhase: CinematicPhase;
  setCinematicPhase: (phase: CinematicPhase) => void;

  // Cinematic-driven trajectory progress (0..1) — overrides timeline-based progress during cinematic
  trajectoryProgress: number;
  setTrajectoryProgress: (p: number) => void;

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

  // Sequential launch navigation
  currentLaunchIndex: -1,
  setCurrentLaunchIndex: (idx) => set({ currentLaunchIndex: idx }),
  sequentialState: "idle",
  setSequentialState: (state) => set({ sequentialState: state }),

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
      cinematicPhase: null,
      sequentialState: "idle" as SequentialState,
      currentLaunchIndex: -1,
      trajectoryProgress: 0,
    })),

  // Cinematic phase
  cinematicPhase: null,
  setCinematicPhase: (phase) => set({ cinematicPhase: phase }),

  // Cinematic-driven trajectory progress
  trajectoryProgress: 0,
  setTrajectoryProgress: (p) => set({ trajectoryProgress: p }),

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
