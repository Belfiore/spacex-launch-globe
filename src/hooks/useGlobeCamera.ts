"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { useAppStore } from "@/store/useAppStore";
import { latLngToVector3 } from "@/lib/coordUtils";
import { CINEMATIC_PHASES } from "@/lib/constants";
import {
  computeLaunchAzimuth,
  computeTrajectoryEndpoint,
  generateTrajectoryArcCurve,
} from "@/lib/trajectoryUtils";
import type { CinematicPhase } from "@/lib/types";

const DEG_TO_RAD = Math.PI / 180;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Compute a cinematic camera position perpendicular to the trajectory direction.
 * Camera is placed 90° clockwise from the launch azimuth (right-side view),
 * at a low angle near the horizon for a broadcast-style framing.
 */
function getCinematicCameraPosition(
  lat: number,
  lng: number,
  azimuthRad: number,
  distance: number,
  elevationDeg: number,
  driftRad: number
): THREE.Vector3 {
  // Camera azimuth = trajectory azimuth + 90° (right-side view) + drift
  const cameraAzimuth = azimuthRad + Math.PI / 2 + driftRad;

  // Project camera position from launch site along camera azimuth
  const offsetDeg = 12; // angular distance from launch site
  const endCoords = computeTrajectoryEndpoint(lat, lng, cameraAzimuth, offsetDeg);

  // Lower the latitude by elevationDeg to tilt camera toward horizon
  const camLat = endCoords.lat - elevationDeg;
  const camLng = endCoords.lng;

  return latLngToVector3(camLat, camLng, distance);
}

/**
 * Get the next cinematic phase in sequence.
 */
function getNextPhase(current: CinematicPhase): CinematicPhase {
  switch (current) {
    case "liftoff":
      return "pitch-over";
    case "pitch-over":
      return "downrange";
    case "downrange":
      return "orbital";
    case "orbital":
      return null; // done
    default:
      return null;
  }
}

// ── Trajectory progress ranges per cinematic phase ──────────
const PHASE_PROGRESS_RANGES: Record<string, { start: number; end: number }> = {
  liftoff: { start: 0, end: 0.15 },
  "pitch-over": { start: 0.15, end: 0.40 },
  downrange: { start: 0.40, end: 0.75 },
  orbital: { start: 0.75, end: 1.0 },
};

export function useGlobeCamera(
  controlsRef: React.RefObject<OrbitControlsType | null>
) {
  const { camera } = useThree();

  const cameraTarget = useAppStore((s) => s.cameraTarget);

  // ── Non-cinematic animation refs ────────────────────────────
  const targetPosition = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);
  const animProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // ── Cinematic refs ─────────────────────────────────────────
  const lastPhaseRef = useRef<CinematicPhase>(null);
  const cinematicProgress = useRef(0);
  const cinematicStart = useRef(new THREE.Vector3());
  const cinematicTargetPos = useRef(new THREE.Vector3());

  // Trajectory-aware refs
  const trajectoryRef = useRef<THREE.QuadraticBezierCurve3 | null>(null);
  const azimuthRef = useRef<number>(0);
  const driftRef = useRef<number>(0);
  const phaseTimer = useRef(0);

  // Trajectory progress ref — drives the trajectory animation during cinematic
  const trajProgressRef = useRef(0);

  // Dynamic look-at target (replaces camera.lookAt(0,0,0))
  const lookAtTarget = useRef(new THREE.Vector3());
  const lookAtStart = useRef(new THREE.Vector3());
  const lastLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // OrbitControls target recovery
  const controlsTargetRecovery = useRef(false);

  // ── Break out of cinematic on direct user interaction ──────
  // Controls are disabled during cinematic (to prevent fighting),
  // so we listen on the canvas for touch/pointer/wheel to break out.
  // Armed with a delay to avoid catching the initial play-button click.
  const cinematicActiveRef = useRef(false);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const breakCinematic = () => {
      if (!cinematicActiveRef.current) return;
      const s = useAppStore.getState();
      if (s.cinematicPhase && s.cameraMode === "auto") {
        s.setCameraMode("free");
        s.setCinematicPhase(null);
        s.setSequentialState("idle");
        s.setPlaybackState("paused");
      }
    };

    canvas.addEventListener("pointerdown", breakCinematic);
    canvas.addEventListener("wheel", breakCinematic);
    return () => {
      canvas.removeEventListener("pointerdown", breakCinematic);
      canvas.removeEventListener("wheel", breakCinematic);
    };
  }, []);

  // ── Non-cinematic: animate to launch site on selection ─────
  useEffect(() => {
    if (cameraTarget) {
      const state = useAppStore.getState();
      // If in cinematic mode, skip non-cinematic animation
      if (state.cinematicPhase && state.cameraMode === "auto") return;

      const az = computeLaunchAzimuth(
        cameraTarget.lat,
        state.selectedLaunch?.payloadOrbit ?? "default"
      );

      const newTarget = getCinematicCameraPosition(
        cameraTarget.lat,
        cameraTarget.lng,
        az,
        camera.position.length(),
        10,
        0
      );

      targetPosition.current = newTarget;
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(lastLookAt.current);
      isAnimating.current = true;
      animProgress.current = 0;
    }
  }, [cameraTarget, camera]);

  useFrame((_, delta) => {
    const state = useAppStore.getState();
    const { cinematicPhase, selectedLaunch, cameraMode } = state;

    // ── OrbitControls target recovery ──────────────────────────
    if (controlsTargetRecovery.current && controlsRef.current) {
      const target = controlsRef.current.target;
      target.lerp(new THREE.Vector3(0, 0, 0), delta * 1.5);
      if (target.length() < 0.05) {
        target.set(0, 0, 0);
        controlsTargetRecovery.current = false;
      }
    }

    // ── Cinematic mode ────────────────────────────────────────
    if (cinematicPhase && selectedLaunch && cameraMode === "auto") {
      // Phase changed — set up new animation
      if (cinematicPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = cinematicPhase;
        cinematicProgress.current = 0;
        phaseTimer.current = 0;
        cinematicStart.current.copy(camera.position);
        lookAtStart.current.copy(lastLookAt.current);

        // Compute trajectory and azimuth for this launch
        const curve = generateTrajectoryArcCurve(selectedLaunch);
        trajectoryRef.current = curve;
        azimuthRef.current = computeLaunchAzimuth(
          selectedLaunch.launchSite.lat,
          selectedLaunch.payloadOrbit ?? "default"
        );

        const phaseConfig = CINEMATIC_PHASES[cinematicPhase];
        const { lat, lng } = selectedLaunch.launchSite;

        cinematicTargetPos.current.copy(
          getCinematicCameraPosition(
            lat,
            lng,
            azimuthRef.current,
            phaseConfig.distance,
            phaseConfig.elevation,
            driftRef.current
          )
        );

        lookAtTarget.current.copy(curve.getPointAt(phaseConfig.targetT));

        // Initialize trajectory progress for this phase
        const phaseRange = PHASE_PROGRESS_RANGES[cinematicPhase];
        if (phaseRange) {
          trajProgressRef.current = Math.max(trajProgressRef.current, phaseRange.start);
        }
      }

      // Disable controls during cinematic so they don't fight with camera.
      // The canvas event listener (armed after a delay) handles user breakout.
      if (controlsRef.current) controlsRef.current.enabled = false;

      // Arm the breakout listener after 500ms to avoid catching the initial click
      if (!cinematicActiveRef.current) {
        setTimeout(() => { cinematicActiveRef.current = true; }, 500);
      }

      const phaseConfig = CINEMATIC_PHASES[cinematicPhase];

      // Apply drift
      driftRef.current += delta * phaseConfig.driftSpeed;

      // Recompute ideal camera position with updated drift
      const { lat, lng } = selectedLaunch.launchSite;
      const idealPos = getCinematicCameraPosition(
        lat,
        lng,
        azimuthRef.current,
        phaseConfig.distance,
        phaseConfig.elevation,
        driftRef.current
      );

      // Animate camera position (ease in during transition, then track drift)
      cinematicProgress.current = Math.min(
        1,
        cinematicProgress.current + delta * 0.5
      );
      const eased = easeInOutCubic(cinematicProgress.current);

      if (cinematicProgress.current < 1) {
        // Still transitioning — slerp from start to ideal
        const startNorm = cinematicStart.current.clone().normalize();
        const endNorm = idealPos.clone().normalize();
        const startDist = cinematicStart.current.length();
        const endDist = idealPos.length();
        const dist = startDist + (endDist - startDist) * eased;

        camera.position
          .copy(startNorm)
          .lerp(endNorm, eased)
          .normalize()
          .multiplyScalar(dist);

        // Lerp look-at target
        lastLookAt.current
          .copy(lookAtStart.current)
          .lerp(lookAtTarget.current, eased);
      } else {
        // Transition complete — smoothly follow drift position
        camera.position.lerp(idealPos, delta * 2.0);

        // Smoothly track look-at target
        lastLookAt.current.lerp(lookAtTarget.current, delta * 2.0);

        // Phase auto-progression timer
        phaseTimer.current += delta;
        if (phaseTimer.current >= phaseConfig.duration) {
          const nextPhase = getNextPhase(cinematicPhase);
          if (nextPhase) {
            state.setCinematicPhase(nextPhase);
          } else {
            // All phases complete — signal "viewing" state
            state.setSequentialState("viewing");
          }
          phaseTimer.current = 0;
        }
      }

      // ── Drive trajectory progress ──────────────────────────────
      const phaseRange = PHASE_PROGRESS_RANGES[cinematicPhase];
      if (phaseRange) {
        const range = phaseRange.end - phaseRange.start;
        const estimatedDuration = phaseConfig.duration + 2; // ~2s transition
        const rate = range / estimatedDuration;
        trajProgressRef.current = Math.min(
          phaseRange.end,
          trajProgressRef.current + delta * rate
        );
        state.setTrajectoryProgress(trajProgressRef.current);
      }

      camera.lookAt(lastLookAt.current);
      return;
    }

    // ── Clean up when cinematic ends ────────────────────────────
    if (lastPhaseRef.current !== null && !cinematicPhase) {
      lastPhaseRef.current = null;
      driftRef.current = 0;
      trajProgressRef.current = 0;
      cinematicActiveRef.current = false;
      if (controlsRef.current) {
        controlsRef.current.target.copy(lastLookAt.current);
        controlsRef.current.enabled = true;
        controlsTargetRecovery.current = true;
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

    // Smoothly transition look-at from current to origin
    lastLookAt.current.copy(startLookAt.current).lerp(
      new THREE.Vector3(0, 0, 0),
      eased
    );
    camera.lookAt(lastLookAt.current);

    if (animProgress.current >= 1) {
      isAnimating.current = false;
      targetPosition.current = null;
      lastLookAt.current.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    }
  });
}
