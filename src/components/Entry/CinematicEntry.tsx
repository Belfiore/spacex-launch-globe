"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import CinematicLoading from "./CinematicLoading";
import IntroModal from "./IntroModal";
import GuidedOnboarding from "./GuidedOnboarding";

export default function CinematicEntry() {
  const loading = useAppStore((s) => s.loading);
  const entryPhase = useAppStore((s) => s.entryPhase);
  const setEntryPhase = useAppStore((s) => s.setEntryPhase);

  const [isReturning, setIsReturning] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage on mount (client only)
  useEffect(() => {
    const seen = localStorage.getItem("rocket-manifest-seen");
    setIsReturning(seen === "1");
    localStorage.setItem(
      "rocket-manifest-last-visit",
      new Date().toISOString()
    );
    setHydrated(true);
  }, []);

  // Track data readiness
  useEffect(() => {
    if (!loading) setDataReady(true);
  }, [loading]);

  // Loading complete → decide next phase
  const handleLoadingComplete = useCallback(() => {
    if (isReturning) {
      setEntryPhase("complete");
    } else {
      setEntryPhase("intro");
    }
  }, [isReturning, setEntryPhase]);

  const setZoomInRequested = useAppStore((s) => s.setZoomInRequested);

  // Intro CTA → start zoom-in animation, then onboarding
  const handleStartOnboarding = useCallback(() => {
    setEntryPhase("zooming");
    setZoomInRequested(true);
  }, [setEntryPhase, setZoomInRequested]);

  // Intro dismissed ("Don't show again" or Escape)
  const handleDismiss = useCallback(() => {
    localStorage.setItem("rocket-manifest-seen", "1");
    setEntryPhase("complete");
  }, [setEntryPhase]);

  // Onboarding complete
  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("rocket-manifest-seen", "1");
    setEntryPhase("complete");
  }, [setEntryPhase]);

  // Don't render anything until hydrated (avoids SSR/client mismatch)
  if (!hydrated) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "#000",
        }}
      />
    );
  }

  // Once complete, unmount entirely
  if (entryPhase === "complete") return null;

  // During zooming — the globe is visible, camera is animating. No overlay needed.
  if (entryPhase === "zooming") return null;

  return (
    <>
      {entryPhase === "loading" && (
        <CinematicLoading
          isShortened={isReturning}
          dataReady={dataReady}
          onComplete={handleLoadingComplete}
        />
      )}

      {entryPhase === "intro" && (
        <IntroModal
          onStartOnboarding={handleStartOnboarding}
          onDismiss={handleDismiss}
        />
      )}

      {entryPhase === "onboarding" && (
        <GuidedOnboarding onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
