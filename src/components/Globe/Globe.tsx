"use client";

import { Suspense, useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import Earth from "./Earth";
import Atmosphere from "./Atmosphere";
import LaunchMarker from "./LaunchMarker";
import TrajectoryArc from "./TrajectoryArc";
import CameraController from "./CameraController";
import DroneShipMarker from "./DroneShipMarker";
import ISSOrbit from "./ISSOrbit";
import { GLOBE, COLORS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

// A launch is "active" if the timeline is within a window around its launch time
const ACTIVE_WINDOW_AFTER_MS = 72 * 60 * 60 * 1000; // 72 hours after launch (slower arc traversal)
const ACTIVE_WINDOW_BEFORE_MS = 6 * 60 * 60 * 1000; // 6 hours before launch

function GlobeScene() {
  const controlsRef = useRef<OrbitControlsType>(null);

  const launches = useAppStore((s) => s.launches);
  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const cameraResetCounter = useAppStore((s) => s.cameraResetCounter);
  const timelineDate = useAppStore((s) => s.timelineDate);
  const showISS = useAppStore((s) => s.showISS);
  const trajectoryProgress = useAppStore((s) => s.trajectoryProgress);

  // Compute active launches and their progress based on timeline
  const activeLaunches = useMemo(() => {
    const timelineMs = timelineDate.getTime();
    const totalWindow = ACTIVE_WINDOW_BEFORE_MS + ACTIVE_WINDOW_AFTER_MS;

    const timelineActive = launches
      .map((launch) => {
        const launchMs = new Date(launch.dateUtc).getTime();
        const diff = timelineMs - launchMs;
        if (diff >= -ACTIVE_WINDOW_BEFORE_MS && diff <= ACTIVE_WINDOW_AFTER_MS) {
          let progress = Math.max(
            0.05,
            Math.min(1, (diff + ACTIVE_WINDOW_BEFORE_MS) / totalWindow)
          );

          // Override with cinematic-driven trajectory progress for the selected launch
          if (
            selectedLaunch &&
            launch.id === selectedLaunch.id &&
            trajectoryProgress > 0
          ) {
            progress = trajectoryProgress;
          }

          return { launch, progress, active: true };
        }
        return { launch, progress: 0, active: false };
      })
      .filter((item) => item.active);

    // Always show arc for selected launch if not already active
    if (
      selectedLaunch &&
      !timelineActive.find((a) => a.launch.id === selectedLaunch.id)
    ) {
      timelineActive.push({
        launch: selectedLaunch,
        progress: trajectoryProgress > 0 ? trajectoryProgress : 0.7,
        active: true,
      });
    }

    return timelineActive;
  }, [launches, timelineDate, selectedLaunch, trajectoryProgress]);

  const setCinematicPhase = useAppStore((s) => s.setCinematicPhase);
  const setSequentialState = useAppStore((s) => s.setSequentialState);
  const setPlaybackState = useAppStore((s) => s.setPlaybackState);

  const handleInteractionStart = useCallback(() => {
    // When user grabs globe during cinematic, break out entirely
    const state = useAppStore.getState();
    if (state.cinematicPhase && state.cameraMode === "auto") {
      setCinematicPhase(null);
      setSequentialState("idle");
      setPlaybackState("paused");
    }
    setCameraMode("free");
  }, [setCameraMode, setCinematicPhase, setSequentialState, setPlaybackState]);

  // Reset camera to initial position when resetView is triggered
  useEffect(() => {
    if (cameraResetCounter === 0) return; // skip initial mount
    const controls = controlsRef.current;
    if (!controls) return;

    controls.target.set(0, 0, 0);
    const cam = controls.object;
    const initial = new THREE.Vector3(...GLOBE.CAMERA_INITIAL);
    cam.position.copy(initial);
    cam.lookAt(0, 0, 0);
    controls.enabled = true;
    controls.update();
  }, [cameraResetCounter]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#e0e8ff" />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color="#4488ff" />

      {/* Starfield */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Earth */}
      <Earth />
      <Atmosphere />

      {/* ISS orbit ring + station (toggleable) */}
      {showISS && <ISSOrbit />}

      {/* Camera Controller */}
      <CameraController controlsRef={controlsRef} />

      {/* Launch Markers */}
      {launches.map((launch) => (
        <LaunchMarker
          key={launch.id}
          launch={launch}
          isSelected={selectedLaunch?.id === launch.id}
          onClick={() =>
            setSelectedLaunch(
              selectedLaunch?.id === launch.id ? null : launch
            )
          }
        />
      ))}

      {/* Trajectory Arcs */}
      {activeLaunches.map(({ launch, progress }) => (
        <TrajectoryArc
          key={`arc-${launch.id}`}
          launch={launch}
          progress={progress}
          visible={true}
        />
      ))}

      {/* Drone ship / landing zone markers for active launches */}
      {activeLaunches.map(({ launch }) =>
        launch.boosterReturn &&
        launch.boosterReturn.landingType !== "expended" ? (
          <DroneShipMarker
            key={`drone-${launch.id}`}
            boosterReturn={launch.boosterReturn}
          />
        ) : null
      )}

      {/* Controls — no auto-rotate, reduced sensitivity */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.5}
        zoomSpeed={0.3}
        minDistance={GLOBE.MIN_ZOOM}
        maxDistance={GLOBE.MAX_ZOOM}
        autoRotate={false}
        autoRotateSpeed={0}
        enablePan={false}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        onStart={handleInteractionStart}
      />
    </>
  );
}

export default function Globe() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{
          position: GLOBE.CAMERA_INITIAL,
          fov: GLOBE.FOV,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ background: COLORS.background }}
      >
        <Suspense fallback={null}>
          <GlobeScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
