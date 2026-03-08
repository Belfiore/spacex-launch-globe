export interface LaunchSite {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
}

export type LandingType = "RTLS" | "ASDS" | "expended";

export interface BoosterReturn {
  landingType: LandingType;
  landingCoords: { lat: number; lng: number };
  landingTime?: string;
}

export interface Launch {
  id: string;
  name: string;
  dateUtc: string;
  dateUnix: number;
  launchSite: LaunchSite;
  status: "upcoming" | "success" | "failure";
  rocketType: string;
  payloadOrbit?: string;
  missionPatch?: string;
  details?: string;
  boosterReturn?: BoosterReturn;
  webcastUrl?: string;
}

export type PlaybackState = "stopped" | "playing" | "paused";
export type CameraMode = "free" | "auto";
export type CinematicPhase = "liftoff" | "pitch-over" | "downrange" | "orbital" | null;
export type SequentialState = "idle" | "viewing" | "transitioning";

/** @deprecated Alias for backward compatibility */
export type CinematicStage = CinematicPhase;

export interface FilterState {
  search: string;
  rocketType: string | null;
  status: string | null;
  site: string | null;
  /** Multi-select site filter — site group keys like "CC", "BC", "V" */
  sites: string[];
}
