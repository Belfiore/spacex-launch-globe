"use client";

import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { useGlobeCamera } from "@/hooks/useGlobeCamera";

interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsType | null>;
}

/**
 * Invisible component placed inside the R3F Canvas
 * to drive camera animations and cinematic sequences from the store.
 */
export default function CameraController({
  controlsRef,
}: CameraControllerProps) {
  useGlobeCamera(controlsRef);
  return null;
}
