"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLOBE, EARTH_TEXTURES } from "@/lib/constants";

// Shared shader source — vertex
const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Shared shader source — fragment (dark "mission control" look)
const FRAGMENT_SHADER = `
  uniform sampler2D uDayMap;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 raw = texture2D(uDayMap, vUv).rgb;

    // Luminance — used to detect ocean vs land
    float lum = dot(raw, vec3(0.299, 0.587, 0.114));

    // Ocean tends to be blue-dominant and dark
    float blueDominance = raw.b - max(raw.r, raw.g);
    float isOcean = smoothstep(-0.05, 0.1, blueDominance);

    // Ocean: dark navy with visible blue undertone
    vec3 ocean = vec3(0.03, 0.06, 0.14) + raw * 0.25;

    // Land: clearly distinguishable — let the texture colors show through
    vec3 land = vec3(0.06, 0.09, 0.04) + raw * 0.60;

    vec3 baseColor = mix(land, ocean, isOcean);

    // Coastline glow — bright edge between land & ocean
    float coastDist = abs(blueDominance - 0.03);
    float coast = 1.0 - smoothstep(0.0, 0.06, coastDist);
    vec3 coastColor = vec3(0.18, 0.42, 0.7);
    baseColor = mix(baseColor, coastColor, coast * 0.9);

    // Extra bright coastline edge
    float coastEdge = 1.0 - smoothstep(0.0, 0.025, coastDist);
    baseColor += vec3(0.06, 0.15, 0.30) * coastEdge;

    // Polar ice caps — keep them clearly visible
    float lat = (vUv.y - 0.5) * 3.14159;
    float polar = smoothstep(1.1, 1.4, abs(lat));
    baseColor = mix(baseColor, vec3(0.22, 0.28, 0.38), polar * lum);

    // ---- Lat/Lng grid ----
    float latDeg = (vUv.y - 0.5) * 180.0;
    float lonDeg = (vUv.x - 0.5) * 360.0;
    float cosLat = max(cos(lat), 0.1);
    float gridSpacing = 15.0;
    float gridLat = abs(fract(latDeg / gridSpacing + 0.5) - 0.5);
    float gridLon = abs(fract(lonDeg / gridSpacing + 0.5) - 0.5);
    float gridLineW = 0.018;
    float gridL = smoothstep(gridLineW, gridLineW * 0.3, gridLat);
    float gridM = smoothstep(gridLineW * cosLat, gridLineW * 0.3 * cosLat, gridLon);
    float grid = max(gridL, gridM);
    baseColor += vec3(0.02, 0.04, 0.09) * grid * 0.45;

    // ---- Fresnel rim lighting ----
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    baseColor += vec3(0.06, 0.14, 0.28) * fresnel * 0.5;

    // ---- Subtle directional lighting for 3D depth ----
    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.8));
    float diffuse = max(dot(vWorldNormal, lightDir), 0.0);
    baseColor *= 0.85 + diffuse * 0.25;

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

/**
 * Earth using a real Blue Marble texture processed through a dark
 * "mission control at night" shader — clearly recognizable geography.
 *
 * Uses progressive texture loading: fast 2K texture first, then swaps
 * in a high-res 5K texture in the background for zoomed-in clarity.
 */
function EarthMesh() {
  const textureRef = useRef<THREE.Texture | null>(null);

  // Create the shader material once
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uDayMap: { value: null },
      },
    });
  }, []);

  // Progressive texture loading: low-res fast, then high-res in background
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let disposed = false;
    let lowResTexture: THREE.Texture | null = null;

    // Step 1: Load fast 2K texture
    loader.load(EARTH_TEXTURES.LOW_RES, (lowRes) => {
      if (disposed) {
        lowRes.dispose();
        return;
      }
      // Use LinearSRGBColorSpace so the shader receives raw pixel values
      // (our custom shader handles all color processing)
      lowRes.colorSpace = THREE.LinearSRGBColorSpace;
      lowResTexture = lowRes;
      textureRef.current = lowRes;

      // Step 2: Load high-res in background
      loader.load(EARTH_TEXTURES.HIGH_RES, (highRes) => {
        if (disposed) {
          highRes.dispose();
          return;
        }
        highRes.colorSpace = THREE.LinearSRGBColorSpace;
        textureRef.current = highRes;
        // Free the low-res GPU memory
        if (lowResTexture) {
          lowResTexture.dispose();
          lowResTexture = null;
        }
      });
    });

    return () => {
      disposed = true;
    };
  }, []);

  // Push texture into the uniform every frame — avoids React state/effect issues
  useFrame(() => {
    if (textureRef.current && material.uniforms.uDayMap.value !== textureRef.current) {
      material.uniforms.uDayMap.value = textureRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[GLOBE.RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function Earth() {
  return <EarthMesh />;
}
