import * as THREE from "three";
import { GLOBE } from "./constants";

/**
 * Convert latitude/longitude to a position on a 3D sphere.
 * Three.js uses Y-up coordinate system.
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = GLOBE.RADIUS
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert lat/lng to a tuple for use as a position prop.
 */
export function latLngToPosition(
  lat: number,
  lng: number,
  radius: number = GLOBE.RADIUS
): [number, number, number] {
  const v = latLngToVector3(lat, lng, radius);
  return [v.x, v.y, v.z];
}

/**
 * Get a camera position that looks at a given lat/lng from a distance.
 */
export function getCameraPositionForLatLng(
  lat: number,
  lng: number,
  distance: number = 4.5
): THREE.Vector3 {
  const surfacePos = latLngToVector3(lat, lng, GLOBE.RADIUS);
  return surfacePos.normalize().multiplyScalar(distance);
}
