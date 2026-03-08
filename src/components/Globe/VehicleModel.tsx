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

// ── Procedural Fallback Model ────────────────────────────────

function ProceduralModel({ config }: ModelProps) {
  const { procedural } = config;
  const { bodyRadius, bodyHeight, bodyColor, noseColor } = procedural;

  return (
    <group>
      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[bodyRadius, bodyRadius * 1.05, bodyHeight, 8]} />
        <meshBasicMaterial color={bodyColor} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, bodyHeight / 2 + 0.014, 0]}>
        <coneGeometry args={[bodyRadius, 0.028, 8]} />
        <meshBasicMaterial color={noseColor} />
      </mesh>

      {/* Falcon Heavy side boosters */}
      {procedural.hasSideBoosters && (
        <>
          <mesh position={[-0.026, -0.005, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.065, 8]} />
            <meshBasicMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0.026, -0.005, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.065, 8]} />
            <meshBasicMaterial color={bodyColor} />
          </mesh>
          <mesh position={[-0.026, 0.029, 0]}>
            <coneGeometry args={[0.009, 0.018, 8]} />
            <meshBasicMaterial color={noseColor} />
          </mesh>
          <mesh position={[0.026, 0.029, 0]}>
            <coneGeometry args={[0.009, 0.018, 8]} />
            <meshBasicMaterial color={noseColor} />
          </mesh>
        </>
      )}

      {/* Starship fins */}
      {procedural.hasFins && (
        <>
          <mesh
            position={[bodyRadius + 0.006, -bodyHeight / 2 + 0.01, 0]}
            rotation={[0, 0, 0.3]}
          >
            <boxGeometry args={[0.012, 0.03, 0.004]} />
            <meshBasicMaterial color="#8090a0" />
          </mesh>
          <mesh
            position={[-(bodyRadius + 0.006), -bodyHeight / 2 + 0.01, 0]}
            rotation={[0, 0, -0.3]}
          >
            <boxGeometry args={[0.012, 0.03, 0.004]} />
            <meshBasicMaterial color="#8090a0" />
          </mesh>
        </>
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
