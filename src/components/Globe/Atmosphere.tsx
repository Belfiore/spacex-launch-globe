"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GLOBE } from "@/lib/constants";

/**
 * Atmospheric glow around the Earth — thin blue-white rim light.
 * Uses a custom shader for a Fresnel-based glow effect.
 */
export default function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 3.0);
          vec3 color = mix(vec3(0.4, 0.6, 1.0), vec3(0.7, 0.85, 1.0), rim);
          gl_FragColor = vec4(color, rim * 0.6);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]}>
      <sphereGeometry args={[GLOBE.ATMOSPHERE_RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}
