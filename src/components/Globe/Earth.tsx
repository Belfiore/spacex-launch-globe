"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { GLOBE } from "@/lib/constants";

/**
 * Earth using a real Blue Marble texture processed through a dark
 * "mission control at night" shader — clearly recognizable geography.
 */
function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Blue Marble — full-color, shows real coastlines and continents
  const dayTexture = useTexture(
    "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg"
  );

  const material = useMemo(() => {
    dayTexture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.ShaderMaterial({
      vertexShader: `
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
      `,
      fragmentShader: `
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
          // Land tends to have balanced RGB, higher green/red
          float blueDominance = raw.b - max(raw.r, raw.g);
          float isOcean = smoothstep(-0.05, 0.1, blueDominance);

          // Ocean: deep dark navy
          vec3 ocean = vec3(0.025, 0.05, 0.13) + raw * 0.08;

          // Land: dark grey-green tint, preserving some original color
          vec3 land = vec3(0.04, 0.07, 0.05) + raw * 0.18;

          vec3 baseColor = mix(land, ocean, isOcean);

          // Coastline glow — high-contrast bright edge between land & ocean
          float coastDist = abs(blueDominance - 0.03);
          float coast = 1.0 - smoothstep(0.0, 0.06, coastDist);
          vec3 coastColor = vec3(0.12, 0.3, 0.55);
          baseColor = mix(baseColor, coastColor, coast * 0.75);

          // Extra bright coastline edge
          float coastEdge = 1.0 - smoothstep(0.0, 0.025, coastDist);
          baseColor += vec3(0.05, 0.12, 0.25) * coastEdge;

          // Polar ice caps — keep them slightly bright
          float lat = (vUv.y - 0.5) * 3.14159;
          float polar = smoothstep(1.1, 1.4, abs(lat));
          baseColor = mix(baseColor, vec3(0.12, 0.15, 0.22), polar * lum);

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
          baseColor *= 0.72 + diffuse * 0.38;

          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
      uniforms: {
        uDayMap: { value: dayTexture },
      },
    });
  }, [dayTexture]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[GLOBE.RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function Earth() {
  return <EarthMesh />;
}
