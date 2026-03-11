"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { useAppStore } from "@/store/useAppStore";
import { latLngToVector3, getUSAOrbitTarget } from "@/lib/coordUtils";
import { GLOBE } from "@/lib/constants";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useGlobeCamera(
  controlsRef: React.RefObject<OrbitControlsType | null>
) {
  const { camera } = useThree();

  const cameraTarget = useAppStore((s) => s.cameraTarget);
  const miniTimelinePlaying = useAppStore((s) => s.miniTimelinePlaying);
  const zoomInRequested = useAppStore((s) => s.zoomInRequested);
  const entryPhase = useAppStore((s) => s.entryPhase);

  // ── Non-cinematic animation refs ────────────────────────────
  const targetPosition = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);
  const animProgress = useRef(0);
  const animSpeed = useRef(1.5);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const lastLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Callback to fire when zoom-in animation completes
  const onAnimComplete = useRef<(() => void) | null>(null);

  // OrbitControls target recovery
  const controlsTargetRecovery = useRef(false);

  // ── Intro zoom-in: single smooth animation from overview → normal ─────
  // The intro modal sits on an opaque black overlay, so the globe isn't
  // visible until "Let's explore" is clicked and the overlay fades.
  // We position the camera at CAMERA_OVERVIEW first, then animate to
  // CAMERA_INITIAL when the user triggers the zoom.
  useEffect(() => {
    if (!zoomInRequested) return;

    // Ensure camera starts at the overview position
    const overviewPos = new THREE.Vector3(...GLOBE.CAMERA_OVERVIEW);
    const normalPos = new THREE.Vector3(...GLOBE.CAMERA_INITIAL);
    const usaTarget = getUSAOrbitTarget();

    camera.position.copy(overviewPos);
    camera.lookAt(usaTarget);
    lastLookAt.current.copy(usaTarget);

    // Single-phase cinematic zoom from overview → normal
    targetPosition.current = normalPos;
    startPosition.current.copy(overviewPos);
    startLookAt.current.copy(usaTarget);
    isAnimating.current = true;
    animProgress.current = 0;
    animSpeed.current = 0.6; // smooth zoom-in (~1.7s)

    onAnimComplete.current = () => {
      // Transition from "zooming" to "onboarding"
      useAppStore.getState().setZoomInRequested(false);
      useAppStore.getState().setEntryPhase("onboarding");
    };
  }, [zoomInRequested, camera]);

  // ── Gently pan camera to launch site on selection ─────
  useEffect(() => {
    if (cameraTarget) {
      // On mobile, offset camera position south so the launch site appears
      // in the upper portion of the viewport (above the bottom dock UI)
      const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
      const latOffset = isMobileView ? -5 : 0;

      const sitePos = latLngToVector3(
        cameraTarget.lat + latOffset,
        cameraTarget.lng,
        camera.position.length()
      );

      targetPosition.current = sitePos;
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(lastLookAt.current);
      isAnimating.current = true;
      animProgress.current = 0;
      animSpeed.current = 1.5;
      onAnimComplete.current = null;
    }
  }, [cameraTarget, camera]);

  // ── Keep orbit target on launch site during playback (no auto-rotate) ─────
  useEffect(() => {
    if (!controlsRef.current) return;
    // Always disable auto-rotate — camera stays still, focused on launch site
    controlsRef.current.autoRotate = false;
    controlsRef.current.autoRotateSpeed = 0;
    if (miniTimelinePlaying) {
      // Keep orbit controls target on the launch site
      const state = useAppStore.getState();
      if (state.selectedLaunch) {
        const site = state.selectedLaunch.launchSite;
        const sitePos = latLngToVector3(site.lat, site.lng);
        controlsRef.current.target.copy(sitePos);
      }
    }
  }, [miniTimelinePlaying, controlsRef]);

  useFrame((_, delta) => {
    const state = useAppStore.getState();

    // ── OrbitControls target recovery — lerp back to orbit center ──
    if (controlsTargetRecovery.current && controlsRef.current) {
      const target = controlsRef.current.target;
      let orbitTarget: THREE.Vector3;
      if (state.orbitCenter === "usa") {
        orbitTarget = getUSAOrbitTarget();
      } else if (state.orbitCenter === "launch" && state.selectedLaunch) {
        orbitTarget = latLngToVector3(
          state.selectedLaunch.launchSite.lat,
          state.selectedLaunch.launchSite.lng
        );
      } else {
        orbitTarget = new THREE.Vector3(0, 0, 0);
      }
      target.lerp(orbitTarget, delta * 1.5);
      if (target.distanceTo(orbitTarget) < 0.05) {
        target.copy(orbitTarget);
        controlsTargetRecovery.current = false;
      }
    }

    // ── Non-cinematic animation ──────────────────────────────
    if (!isAnimating.current || !targetPosition.current) return;

    animProgress.current = Math.min(1, animProgress.current + delta * animSpeed.current);
    const eased = easeInOutCubic(animProgress.current);

    const start = startPosition.current.clone().normalize();
    const end = targetPosition.current.clone().normalize();
    const startDist = startPosition.current.length();
    const endDist = targetPosition.current.length();
    const dist = startDist + (endDist - startDist) * eased;

    camera.position
      .copy(start)
      .lerp(end, eased)
      .normalize()
      .multiplyScalar(dist);

    // Smoothly transition look-at from current to orbit center
    let orbitLookAt: THREE.Vector3;
    if (state.orbitCenter === "usa") {
      orbitLookAt = getUSAOrbitTarget();
    } else if (state.orbitCenter === "launch" && state.selectedLaunch) {
      orbitLookAt = latLngToVector3(
        state.selectedLaunch.launchSite.lat,
        state.selectedLaunch.launchSite.lng
      );
    } else {
      orbitLookAt = new THREE.Vector3(0, 0, 0);
    }
    lastLookAt.current.copy(startLookAt.current).lerp(orbitLookAt, eased);
    camera.lookAt(lastLookAt.current);

    if (animProgress.current >= 1) {
      isAnimating.current = false;
      targetPosition.current = null;
      lastLookAt.current.copy(orbitLookAt);
      camera.lookAt(orbitLookAt);

      // After animation completes, update orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.copy(orbitLookAt);
      }

      // Fire completion callback (e.g., transition from zooming → onboarding)
      if (onAnimComplete.current) {
        const cb = onAnimComplete.current;
        onAnimComplete.current = null;
        cb();
      }
    }
  });
}
