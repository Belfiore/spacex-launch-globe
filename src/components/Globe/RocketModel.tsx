"use client";

import * as THREE from "three";
import VehicleModel from "./VehicleModel";

interface RocketModelProps {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  rocketType: string;
  progress: number;
  isBooster?: boolean;
}

/**
 * Thin wrapper around VehicleModel for backward compatibility.
 * All rocket rendering logic now lives in VehicleModel.tsx.
 */
export default function RocketModel(props: RocketModelProps) {
  return <VehicleModel {...props} />;
}
