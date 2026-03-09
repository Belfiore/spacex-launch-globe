"use client";

import { useRef, useMemo, useState, Suspense, Component, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getVehicleConfig, type VehicleConfig } from "@/lib/vehicleRegistry";

// ── Types ────────────────────────────────────────────────────

interface VehicleModelProps {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  rocketType: string;
  progress: number;
}

interface ModelProps {
  config: VehicleConfig;
  progress: number;
}

// ── Error Boundary ───────────────────────────────────────────

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── GLB Model ────────────────────────────────────────────────

function GLBModel({ config }: ModelProps) {
  const { scene } = useGLTF(config.modelPath);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    // Traverse and set rendering properties for globe scene
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      scale={config.scale}
      rotation={config.rotationOffset}
      position={config.positionOffset}
    />
  );
}

// ── Grid Fin (reusable sub-component) ───────────────────────

function GridFin({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.014, 0.008, 0.002]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// ── Landing Leg (reusable sub-component) ────────────────────

function LandingLeg({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.002, 0.025, 0.003]} />
      <meshBasicMaterial color="#555555" />
    </mesh>
  );
}

// ── Procedural Fallback Model ────────────────────────────────
// Accurate booster geometry:
//   F9/FH: elongated cylinder, flat top, grid fins near top, landing legs at base
//   Starship Super Heavy: wider cylinder, grid fins, no nose cone

function ProceduralModel({ config }: ModelProps) {
  const { procedural } = config;
  const { bodyRadius, bodyHeight, bodyColor } = procedural;
  const isStarship = procedural.hasFins; // Starship uses fins flag

  // Interstage ring color (slightly lighter than body)
  const interstageColor = isStarship ? "#c8d0dc" : "#3a3a44";

  return (
    <group>
      {/* Main body — flat-topped cylinder (no nose cone) */}
      <mesh>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 12]} />
        <meshBasicMaterial color={bodyColor} />
      </mesh>

      {/* Flat top cap — interstage ring */}
      <mesh position={[0, bodyHeight / 2 + 0.002, 0]}>
        <cylinderGeometry args={[bodyRadius * 1.02, bodyRadius * 1.02, 0.004, 12]} />
        <meshBasicMaterial color={interstageColor} />
      </mesh>

      {/* Grid fins — 4 fins near the top of the booster */}
      <GridFin
        position={[bodyRadius + 0.008, bodyHeight / 2 - 0.01, 0]}
        rotation={[0, 0, 0]}
        color={isStarship ? "#a0a8b4" : "#2a2a32"}
      />
      <GridFin
        position={[-(bodyRadius + 0.008), bodyHeight / 2 - 0.01, 0]}
        rotation={[0, 0, 0]}
        color={isStarship ? "#a0a8b4" : "#2a2a32"}
      />
      <GridFin
        position={[0, bodyHeight / 2 - 0.01, bodyRadius + 0.008]}
        rotation={[0, Math.PI / 2, 0]}
        color={isStarship ? "#a0a8b4" : "#2a2a32"}
      />
      <GridFin
        position={[0, bodyHeight / 2 - 0.01, -(bodyRadius + 0.008)]}
        rotation={[0, Math.PI / 2, 0]}
        color={isStarship ? "#a0a8b4" : "#2a2a32"}
      />

      {/* Landing legs — 4 legs at the base (F9/FH only, Starship uses tower catch) */}
      {!isStarship && (
        <>
          <LandingLeg
            position={[bodyRadius + 0.004, -bodyHeight / 2 + 0.005, 0]}
            rotation={[0, 0, 0.25]}
          />
          <LandingLeg
            position={[-(bodyRadius + 0.004), -bodyHeight / 2 + 0.005, 0]}
            rotation={[0, 0, -0.25]}
          />
          <LandingLeg
            position={[0, -bodyHeight / 2 + 0.005, bodyRadius + 0.004]}
            rotation={[0.25, 0, 0]}
          />
          <LandingLeg
            position={[0, -bodyHeight / 2 + 0.005, -(bodyRadius + 0.004)]}
            rotation={[-0.25, 0, 0]}
          />
        </>
      )}

      {/* Engine cluster glow at the base */}
      <mesh position={[0, -bodyHeight / 2 - 0.002, 0]}>
        <circleGeometry args={[bodyRadius * 0.75, 12]} />
        <meshBasicMaterial
          color={isStarship ? "#334455" : "#1a1a22"}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Falcon Heavy side boosters — flat-topped cylinders (no nose cones) */}
      {procedural.hasSideBoosters && (
        <>
          {/* Left side booster */}
          <group position={[-0.026, -0.008, 0]}>
            <mesh>
              <cylinderGeometry args={[0.009, 0.009, 0.07, 10]} />
              <meshBasicMaterial color={bodyColor} />
            </mesh>
            {/* Left booster grid fins */}
            <GridFin
              position={[0.011, 0.028, 0]}
              rotation={[0, 0, 0]}
              color="#2a2a32"
            />
            <GridFin
              position={[-0.011, 0.028, 0]}
              rotation={[0, 0, 0]}
              color="#2a2a32"
            />
          </group>

          {/* Right side booster */}
          <group position={[0.026, -0.008, 0]}>
            <mesh>
              <cylinderGeometry args={[0.009, 0.009, 0.07, 10]} />
              <meshBasicMaterial color={bodyColor} />
            </mesh>
            {/* Right booster grid fins */}
            <GridFin
              position={[0.011, 0.028, 0]}
              rotation={[0, 0, 0]}
              color="#2a2a32"
            />
            <GridFin
              position={[-0.011, 0.028, 0]}
              rotation={[0, 0, 0]}
              color="#2a2a32"
            />
          </group>
        </>
      )}

      {/* Starship Super Heavy hot-staging ring (wider band near top) */}
      {isStarship && (
        <mesh position={[0, bodyHeight / 2 - 0.003, 0]}>
          <cylinderGeometry args={[bodyRadius * 1.08, bodyRadius * 1.08, 0.008, 12]} />
          <meshBasicMaterial color="#9a9eaa" />
        </mesh>
      )}
    </group>
  );
}

// ── Exhaust Effect (shared) ──────────────────────────────────

function ExhaustEffect({ bodyRadius }: { bodyRadius: number }) {
  const exhaustRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (exhaustRef.current) {
      const flicker = 0.8 + Math.random() * 0.4;
      exhaustRef.current.scale.setScalar(flicker);
    }
  });

  const bodyHeight = 0.095;

  return (
    <>
      {/* Orange cone glow */}
      <mesh
        ref={exhaustRef}
        position={[0, -(bodyHeight / 2 + 0.018), 0]}
        rotation={[Math.PI, 0, 0]}
      >
        <coneGeometry args={[bodyRadius * 0.65, 0.04, 8]} />
        <meshBasicMaterial
          color="#ff7700"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer halo */}
      <mesh position={[0, -(bodyHeight / 2 + 0.01), 0]}>
        <sphereGeometry args={[bodyRadius * 1.1, 8, 8]} />
        <meshBasicMaterial
          color="#ff9900"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ── Main VehicleModel Component ──────────────────────────────

export default function VehicleModel({
  position,
  tangent,
  rocketType,
  progress,
}: VehicleModelProps) {
  const config = getVehicleConfig(rocketType);
  const [glbFailed, setGlbFailed] = useState(false);

  // Quaternion: aligns the rocket's +Y axis (nose) with the tangent direction
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const t = tangent.clone().normalize();
    if (Math.abs(t.y) > 0.999) {
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), t.y > 0 ? 0 : Math.PI);
    } else {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    }
    return q;
  }, [tangent]);

  // Hide after trajectory completes (near orbit insertion)
  if (progress >= 0.95) return null;

  const modelProps: ModelProps = { config, progress };

  return (
    <group
      position={[position.x, position.y, position.z]}
      quaternion={quaternion}
    >
      {/* Model — try GLB only if file exists, otherwise procedural */}
      {config.hasGlb && !glbFailed ? (
        <ModelErrorBoundary
          fallback={<ProceduralModel {...modelProps} />}
          onError={() => setGlbFailed(true)}
        >
          <Suspense fallback={<ProceduralModel {...modelProps} />}>
            <GLBModel {...modelProps} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        <ProceduralModel {...modelProps} />
      )}

      {/* Exhaust effects — only during active flight (not static preview on pad) */}
      {progress > 0.01 && progress < 0.7 && (
        <ExhaustEffect bodyRadius={config.procedural.bodyRadius} />
      )}
    </group>
  );
}
