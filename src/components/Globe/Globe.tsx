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
import SiteLabels from "./SiteLabels";
import { GLOBE, COLORS } from "@/lib/constants";
import { getUSAOrbitTarget, latLngToVector3 } from "@/lib/coordUtils";
import { useAppStore } from "@/store/useAppStore";

function GlobeScene() {
  const controlsRef = useRef<OrbitControlsType>(null);

  const selectedLaunch = useAppStore((s) => s.selectedLaunch);
  const setSelectedLaunch = useAppStore((s) => s.setSelectedLaunch);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const cameraResetCounter = useAppStore((s) => s.cameraResetCounter);
  const showISS = useAppStore((s) => s.showISS);
  const trajectoryProgress = useAppStore((s) => s.trajectoryProgress);
  const orbitCenter = useAppStore((s) => s.orbitCenter);

  // Only show the trajectory for the single selected launch.
  // Progress is driven by trajectoryProgress (0 = static preview, >0 = cinematic playback).
  const activeLaunches = useMemo(() => {
    if (!selectedLaunch) return [];
    return [{ launch: selectedLaunch, progress: trajectoryProgress, active: true }];
  }, [selectedLaunch, trajectoryProgress]);

  const handleInteractionStart = useCallback(() => {
    setCameraMode("free");
  }, [setCameraMode]);

  // Set orbit target based on orbitCenter mode
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    let target: THREE.Vector3;
    if (orbitCenter === "usa") {
      target = getUSAOrbitTarget();
    } else if (orbitCenter === "launch" && selectedLaunch) {
      const { lat, lng } = selectedLaunch.launchSite;
      target = latLngToVector3(lat, lng);
    } else {
      target = new THREE.Vector3(0, 0, 0);
    }
    controls.target.copy(target);
    controls.update();
  }, [orbitCenter, selectedLaunch]);

  // Reset camera to initial position when resetView is triggered
  useEffect(() => {
    if (cameraResetCounter === 0) return; // skip initial mount
    const controls = controlsRef.current;
    if (!controls) return;

    const orbitTarget = useAppStore.getState().orbitCenter === "usa"
      ? getUSAOrbitTarget()
      : new THREE.Vector3(0, 0, 0);
    controls.target.copy(orbitTarget);
    const cam = controls.object;
    const initial = new THREE.Vector3(...GLOBE.CAMERA_INITIAL);
    cam.position.copy(initial);
    cam.lookAt(orbitTarget);
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

      {/* Permanent launch-site markers (CC, BC, V) */}
      <SiteLabels />

      {/* ISS orbit ring + station (toggleable) */}
      {showISS && <ISSOrbit />}

      {/* Camera Controller */}
      <CameraController controlsRef={controlsRef} />

      {/* Launch Marker — only for selected launch (site labels provide permanent dots) */}
      {selectedLaunch && (
        <LaunchMarker
          key={selectedLaunch.id}
          launch={selectedLaunch}
          isSelected={true}
          onClick={() => setSelectedLaunch(null)}
        />
      )}

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
        enablePan={true}
        panSpeed={0.4}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
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
