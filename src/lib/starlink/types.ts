/** CelesTrak OMM (Orbit Mean-Elements Message) JSON format */
export interface OMMRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

/** Propagated satellite position */
export interface SatellitePosition {
  name: string;
  noradId: number;
  lat: number; // degrees
  lng: number; // degrees
  alt: number; // kilometers
  x: number; // Three.js world coords
  y: number;
  z: number;
}

/** Message from worker → main thread */
export interface WorkerResult {
  type: "positions";
  positions: Float32Array;
  metadata: SatMetadata[];
  count: number;
  timestamp: number;
}

/** Per-satellite metadata (name, noradId, alt) for tooltip */
export interface SatMetadata {
  name: string;
  noradId: number;
  alt: number;
}

/** Message from main thread → worker */
export interface WorkerCommand {
  type: "init" | "propagate";
  ommData?: OMMRecord[];
  timestamp?: number;
  globeRadius?: number;
}
