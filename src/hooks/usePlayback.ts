"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SEQUENTIAL_DWELL_MS } from "@/lib/constants";

/**
 * Sequential playback hook — navigates from one launch to the next.
 *
 * Instead of continuously advancing a timeline, the play button steps through
 * launches one by one, centering the camera on each with cinematic framing.
 * The timeline at the bottom remains available for manual scrubbing.
 */
export function usePlayback() {
  const playbackState = useAppStore((s) => s.playbackState);
  const setPlaybackState = useAppStore((s) => s.setPlaybackState);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCinematicPhase = useAppStore((s) => s.setCinematicPhase);
  const setCurrentLaunchIndex = useAppStore((s) => s.setCurrentLaunchIndex);
  const setSequentialState = useAppStore((s) => s.setSequentialState);

  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Navigate to a specific launch by index ────────────────────
  const goToLaunch = useCallback(
    (index: number) => {
      const state = useAppStore.getState();
      const { launches } = state;
      if (index < 0 || index >= launches.length) return;

      const launch = launches[index];
      setCurrentLaunchIndex(index);
      setSelectedLaunch(launch);
      setTimelineDate(new Date(launch.dateUtc));
      setCameraTarget({
        lat: launch.launchSite.lat,
        lng: launch.launchSite.lng,
      });
      setCameraMode("auto");
      setSequentialState("transitioning");
      setCinematicPhase("liftoff");
    },
    [
      setCurrentLaunchIndex,
      setSelectedLaunch,
      setTimelineDate,
      setCameraTarget,
      setCameraMode,
      setSequentialState,
      setCinematicPhase,
    ]
  );

  // ── Next / Previous launch ────────────────────────────────────
  const nextLaunch = useCallback(() => {
    const state = useAppStore.getState();
    const nextIdx = state.currentLaunchIndex + 1;
    if (nextIdx < state.launches.length) {
      goToLaunch(nextIdx);
    } else {
      // Reached the end of launches
      setSequentialState("idle");
      setPlaybackState("paused");
    }
  }, [goToLaunch, setSequentialState, setPlaybackState]);

  const prevLaunch = useCallback(() => {
    const state = useAppStore.getState();
    const prevIdx = state.currentLaunchIndex - 1;
    if (prevIdx >= 0) {
      goToLaunch(prevIdx);
    }
  }, [goToLaunch]);

  // ── Play: start sequential from current or first upcoming ─────
  const play = useCallback(() => {
    const state = useAppStore.getState();
    let startIdx = state.currentLaunchIndex;

    if (startIdx < 0 || startIdx >= state.launches.length) {
      // If a launch is already selected, find its index
      if (state.selectedLaunch) {
        startIdx = state.launches.findIndex(
          (l) => l.id === state.selectedLaunch!.id
        );
      }

      // Otherwise start from the first upcoming launch
      if (startIdx < 0) {
        startIdx = state.launches.findIndex((l) => l.status === "upcoming");
      }

      // Fallback to first launch
      if (startIdx < 0) startIdx = 0;
    }

    setPlaybackState("playing");
    goToLaunch(startIdx);
  }, [setPlaybackState, goToLaunch]);

  // ── Pause ─────────────────────────────────────────────────────
  const pause = useCallback(() => {
    setPlaybackState("paused");
    setSequentialState("idle");
    setCinematicPhase(null);
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, [setPlaybackState, setSequentialState, setCinematicPhase]);

  // ── Toggle ────────────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    const state = useAppStore.getState();
    if (state.playbackState === "playing") {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  // ── Reset ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPlaybackState("stopped");
    setTimelineDate(new Date());
    setCameraTarget(null);
    setCameraMode("free");
    setSelectedLaunch(null);
    setCinematicPhase(null);
    setSequentialState("idle");
    setCurrentLaunchIndex(-1);
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, [
    setPlaybackState,
    setTimelineDate,
    setCameraTarget,
    setCameraMode,
    setSelectedLaunch,
    setCinematicPhase,
    setSequentialState,
    setCurrentLaunchIndex,
  ]);

  // ── Auto-advance: when "viewing" state is reached, start dwell timer ──
  const sequentialState = useAppStore((s) => s.sequentialState);

  useEffect(() => {
    const state = useAppStore.getState();
    if (
      sequentialState === "viewing" &&
      state.playbackState === "playing"
    ) {
      // Clear any existing timer
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);

      dwellTimerRef.current = setTimeout(() => {
        nextLaunch();
      }, SEQUENTIAL_DWELL_MS);
    }

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [sequentialState, nextLaunch]);

  return {
    playbackState,
    togglePlayback,
    reset,
    play,
    pause,
    nextLaunch,
    prevLaunch,
    goToLaunch,
  };
}
