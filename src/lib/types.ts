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

export interface JellyfishData {
  potential: "high" | "moderate" | "none";
  sunAltitude: number; // degrees (negative = below horizon)
  twilightPhase: "civil" | "nautical" | "astronomical" | "day" | "night";
  minutesFromTwilight: number; // how many minutes into ideal window
  description: string; // human-readable explanation
}

export interface BoosterRecoveryDetail {
  boosterId?: string;
  flightNumber?: number;
  landingType: string;
  landingLocation: string;
  outcome: "success" | "failure" | "expended";
  note?: string;
}

export interface FlightHistoryEvent {
  time: string;
  event: string;
  detail?: string;
}

export interface FlightHistory {
  flightNumber?: number;
  missionOutcome: "success" | "failure" | "partial";
  missionSummary: string;
  payloadInfo: string;
  payloadMassKg?: number;
  customer?: string;
  boosterRecovery?: BoosterRecoveryDetail[];
  keyEvents?: FlightHistoryEvent[];
  notes?: string[];
  significance?: string;
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
  jellyfish?: JellyfishData;
  flightHistory?: FlightHistory;
}

export type VehicleFamily = "falcon9" | "falconHeavy" | "starship";

export type PlaybackState = "stopped" | "playing" | "paused";
export type CameraMode = "free" | "auto";

export interface FilterState {
  search: string;
  rocketType: string | null;
  status: string | null;
  site: string | null;
  /** Multi-select site filter — site group keys like "CC", "BC", "V" */
  sites: string[];
  /** When true, only show launches with jellyfish potential */
  jellyfish: boolean;
}
