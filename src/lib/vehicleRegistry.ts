/**
 * Vehicle Registry — data-driven mapping from rocket type to model configuration.
 *
 * This is the single source of truth for vehicle-specific rendering.
 * All components reference this registry instead of hardcoding rocket type checks.
 */

import type { VehicleFamily } from "./types";

export interface ProceduralConfig {
  bodyRadius: number;
  bodyHeight: number;
  bodyColor: string;
  noseColor: string;
  hasSideBoosters: boolean;
  hasFins: boolean;
}

export interface VehicleConfig {
  family: VehicleFamily;
  displayName: string;
  /** Whether the GLB model file exists and should be loaded */
  hasGlb: boolean;
  /** Path to optimized GLB in /public/models/ */
  modelPath: string;
  /** Uniform scale factor to size model for the globe scene */
  scale: number;
  /** Euler rotation [x, y, z] to align model nose to +Y axis */
  rotationOffset: [number, number, number];
  /** Position offset from trajectory point */
  positionOffset: [number, number, number];
  /** Procedural fallback geometry parameters */
  procedural: ProceduralConfig;
  /** CC-BY attribution */
  attribution: {
    author: string;
    license: string;
    sourceUrl: string;
  };
}

export const VEHICLE_REGISTRY: Partial<Record<VehicleFamily, VehicleConfig>> & Record<"falcon9" | "falconheavy" | "starship", VehicleConfig> = {
  falcon9: {
    family: "falcon9",
    displayName: "Falcon 9",
    hasGlb: false,
    modelPath: "/models/falcon9.glb",
    scale: 0.0004,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    procedural: {
      bodyRadius: 0.012,
      bodyHeight: 0.095,
      bodyColor: "#e8ecf0",
      noseColor: "#ffffff",
      hasSideBoosters: false,
      hasFins: false,
    },
    attribution: {
      author: "AllThingsSpace (sunnychen753)",
      license: "CC-BY 4.0",
      sourceUrl:
        "https://sketchfab.com/3d-models/spacex-falcon-9-block-5-61067a8b341c4b4b96053d5fa607f232",
    },
  },
  falconheavy: {
    family: "falconheavy",
    displayName: "Falcon Heavy",
    hasGlb: false,
    modelPath: "/models/falconHeavy.glb",
    scale: 0.0004,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    procedural: {
      bodyRadius: 0.012,
      bodyHeight: 0.095,
      bodyColor: "#e8ecf0",
      noseColor: "#ffffff",
      hasSideBoosters: true,
      hasFins: false,
    },
    attribution: {
      author: "AllThingsSpace (sunnychen753)",
      license: "CC-BY 4.0",
      sourceUrl:
        "https://sketchfab.com/3d-models/spacex-falcon-heavy-2f11453207944cedba00e2c6c1aa1269",
    },
  },
  starship: {
    family: "starship",
    displayName: "Starship",
    hasGlb: false,
    modelPath: "/models/starship.glb",
    scale: 0.0003,
    rotationOffset: [0, 0, 0],
    positionOffset: [0, 0, 0],
    procedural: {
      bodyRadius: 0.018,
      bodyHeight: 0.095,
      bodyColor: "#b8c0cc",
      noseColor: "#d0d8e0",
      hasSideBoosters: false,
      hasFins: true,
    },
    attribution: {
      author: "Clarence365",
      license: "CC-BY 4.0",
      sourceUrl:
        "https://sketchfab.com/3d-models/spacex-starship-ship-24-booster-7-v4-97875d14b63e4b9ca9ed425ef4253306",
    },
  },
};

/** Map human-readable rocket type to vehicle family key */
export function getVehicleFamily(rocketType: string): VehicleFamily {
  switch (rocketType) {
    case "Falcon Heavy":
      return "falconheavy";
    case "Starship":
      return "starship";
    case "Falcon 1":
      return "falcon1";
    case "Falcon 9":
    default:
      return "falcon9";
  }
}

/** Get full vehicle configuration for a rocket type */
export function getVehicleConfig(rocketType: string): VehicleConfig {
  const family = getVehicleFamily(rocketType);
  // Falcon 1 and starship_prototype use Falcon 9 config as fallback
  return VEHICLE_REGISTRY[family] ?? VEHICLE_REGISTRY.falcon9;
}
