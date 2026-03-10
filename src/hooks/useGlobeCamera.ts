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
  const entryPhase = useAppStore((s) => s.entryPhase);

  // ── Non-cinematic animation refs ────────────────────────────
  const targetPosition = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);
  const animProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const lastLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // OrbitControls target recovery
  const controlsTargetRecovery = useRef(false);

  // ── Intro animation state ──────────────────────────────────
  const introPhase = useRef<"waiting" | "spinning" | "zooming" | "done">("waiting");
  const introTime = useRef(0);
  const introStarted = useRef(false);

  // Start far away from the globe looking at Earth center
  useEffect(() => {
    if (!introStarted.current) {
      // Start the camera far away looking at the globe from a dramatic angle
      camera.position.set(0, 8, 12);
      camera.lookAt(0, 0, 0);
      introStarted.current = true;
    }
  }, [camera]);

  // When entry phase completes, begin the intro fly-in animation
  useEffect(() => {
    if (entryPhase === "complete" && introPhase.current === "waiting") {
      introPhase.current = "spinning";
      introTime.current = 0;
      // Disable orbit controls during intro
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  }, [entryPhase, controlsRef]);

  // ── Gently pan camera to launch site on selection ─────
  useEffect(() => {
    if (cameraTarget && introPhase.current === "done") {
      // Simple overhead position at current zoom distance
      const sitePos = latLngToVector3(
        cameraTarget.lat,
        cameraTarget.lng,
        camera.position.length()
      );

      targetPosition.current = sitePos;
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(lastLookAt.current);
      isAnimating.current = true;
      animProgress.current = 0;
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

    // ── Intro animation ──────────────────────────────────────
    if (introPhase.current === "spinning") {
      introTime.current += delta;

      // Phase 1 (0-3s): Spin around the globe while zooming in
      const spinDuration = 3.0;
      const t = Math.min(introTime.current / spinDuration, 1);
      const eased = easeInOutCubic(t);

      // Spin around Y axis — 180 degrees
      const angle = Math.PI * eased;
      // Zoom from far (distance 14) to medium (distance 5.5)
      const startDist = 14;
      const endDist = 5.5;
      const dist = startDist + (endDist - startDist) * eased;

      // Camera orbits around globe center
      const y = 3 + (2.5 - 3) * eased; // slight tilt change
      camera.position.set(
        -Math.sin(angle) * dist * 0.7,
        y,
        Math.cos(angle) * dist * 0.7
      );
      camera.lookAt(0, 0, 0);

      if (t >= 1) {
        introPhase.current = "zooming";
        introTime.current = 0;
      }
      return;
    }

    if (introPhase.current === "zooming") {
      introTime.current += delta;

      // Phase 2 (0-1.5s): Zoom to final USA position
      const zoomDuration = 1.5;
      const t = Math.min(introTime.current / zoomDuration, 1);
      const eased = easeInOutCubic(t);

      const finalPos = new THREE.Vector3(...GLOBE.CAMERA_INITIAL);
      const currentPos = camera.position.clone();
      camera.position.lerpVectors(currentPos, finalPos, eased * 0.08 + (1 - (1 - eased) * (1 - eased)) * 0.02);

      // Gradually shift look-at from center to USA orbit target
      const usaTarget = getUSAOrbitTarget();
      const lookTarget = new THREE.Vector3(0, 0, 0).lerp(usaTarget, eased);
      camera.lookAt(lookTarget);
      lastLookAt.current.copy(lookTarget);

      if (t >= 1) {
        // Snap to final position
        camera.position.copy(finalPos);
        camera.lookAt(usaTarget);
        lastLookAt.current.copy(usaTarget);

        // Re-enable orbit controls and set proper target
        if (controlsRef.current) {
          controlsRef.current.target.copy(usaTarget);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }

        introPhase.current = "done";
      }
      return;
    }

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

    animProgress.current = Math.min(1, animProgress.current + delta * 1.5);
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
    }
  });
}
