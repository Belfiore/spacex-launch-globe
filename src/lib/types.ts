// ═══════════════════════════════════════════════════════════════
// SpaceX Launch Database — TypeScript Type Definitions
// ═══════════════════════════════════════════════════════════════

export interface LaunchSite {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
}

export type LandingType =
  | "RTLS" // Return to Launch Site
  | "ASDS" // Autonomous Spaceport Drone Ship
  | "catch" // Mechazilla tower catch (Starship)
  | "ocean" // Controlled ocean splashdown / water landing test
  | "expended"; // No recovery attempted

export interface BoosterReturn {
  landingType: LandingType;
  landingCoords: { lat: number; lng: number };
  landingTime?: string;
}

// ── Jellyfish plume data ─────────────────────────────────────
export interface JellyfishData {
  potential: "high" | "moderate" | "none";
  sunAltitude: number; // degrees (negative = below horizon)
  twilightPhase: "civil" | "nautical" | "astronomical" | "day" | "night";
  minutesFromTwilight: number; // how many minutes into ideal window
  description: string; // human-readable explanation
}

// ── Rich historical data ─────────────────────────────────────
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

// ── Trajectory inference ─────────────────────────────────────
export interface TrajectoryControlPoint {
  lat: number;
  lon: number;
  alt_km?: number;
  t_plus_sec?: number;
}

export interface TrajectoryInference {
  method: string; // "orbit_inclination" | "landing_geometry" | "mission_class_default"
  heading_deg: number; // initial azimuth
  direction_label: string; // "NE", "E", "SSE", "S", etc.
  confidence: "low" | "medium" | "high";
  control_points?: TrajectoryControlPoint[];
  notes?: string;
}

// ── Failure detail ───────────────────────────────────────────
export type FailureCategory =
  | "engine_failure"
  | "propulsion_anomaly"
  | "stage_separation_failure"
  | "guidance_control_failure"
  | "structural_failure"
  | "pad_anomaly"
  | "static_fire_anomaly"
  | "booster_landing_failure"
  | "ship_reentry_loss"
  | "communications_loss"
  | "mission_rule_abort"
  | "unknown";

export type ExplosionPhase =
  | "in_flight"
  | "pad_static_fire_prep"
  | "ascent"
  | "stage_separation"
  | "boostback"
  | "entry_burn"
  | "landing_burn"
  | "reentry"
  | "post_landing"
  | null;

// ── Core / booster record ────────────────────────────────────
export interface LaunchCore {
  core_role?: string; // "center", "side_booster_1", "side_booster_2", "booster", "single"
  core_serial?: string; // e.g. "B1060"
  core_flight_number?: number;
  reused?: boolean;
  landing_attempt?: boolean;
  landing_success?: boolean;
  landing_type?: string; // "RTLS", "ASDS", "Ocean", "expended"
  landing_pad?: string; // "LZ-1", "OCISLY", "JRTI", etc.
  outcome_summary?: string;
}

// ── Payload record ───────────────────────────────────────────
export interface LaunchPayload {
  payload_id?: string;
  payload_name?: string;
  payload_type?: string; // "Satellite", "Dragon", "Crew Dragon", etc.
  customer_name?: string;
  customer_country?: string;
  orbit?: string; // "LEO", "GTO", "SSO", "ISS", "Polar", etc.
  mass_kg?: number;
  deploy_outcome?: string;
}

// ── Main launch record ───────────────────────────────────────
export type LaunchStatus =
  | "success"
  | "partial_failure"
  | "failure"
  | "prelaunch_failure"
  | "upcoming"
  | "scrubbed"
  | "unknown";

export type VehicleFamily =
  | "falcon1"
  | "falcon9"
  | "falconheavy"
  | "starship"
  | "starship_prototype";

export interface Launch {
  id: string;
  name: string;
  dateUtc: string;
  dateUnix: number;
  launchSite: LaunchSite;

  /** Simple 3-state for backward compat with existing UI */
  status: "upcoming" | "success" | "failure";

  rocketType: string; // "Falcon 1", "Falcon 9", "Falcon Heavy", "Starship"

  // ── Extended fields (new) ────────────────────────────────
  /** Vehicle family code */
  family?: VehicleFamily;
  /** Vehicle variant e.g. "Block 5", "v1.0", "v1.1", "FT" */
  vehicleVariant?: string;
  /** Global sequential flight number */
  flightNumber?: number;
  /** Family-specific flight number e.g. "F9-150", "FH-7" */
  familyFlightNumber?: string;

  /** Granular launch status (superset of `status`) */
  launchStatus?: LaunchStatus;

  /** Payload outcome: "delivered", "lost", "partial", "degraded_orbit" */
  payloadOutcome?: string;
  /** Booster recovery outcome: "success", "failure", "expended", "ocean_landing" */
  boosterRecoveryOutcome?: string;
  /** Ship/upper stage outcome (Starship): "success", "failure", "controlled_splashdown" */
  shipRecoveryOutcome?: string;
  /** Crew outcome if crewed */
  crewOutcome?: string;

  // ── Failure detail ──────────────────────────────────────
  failureCategory?: FailureCategory;
  failureSummary?: string;
  failureDetail?: string;
  exploded?: boolean;
  explosionPhase?: ExplosionPhase;
  brokeUp?: boolean;

  // ── Orbit / trajectory ──────────────────────────────────
  payloadOrbit?: string; // "LEO", "GTO", "SSO", "ISS", "Polar", "MEO", "HEO", "Heliocentric", "Sub-orbital"
  inclinationDeg?: number;
  trajectoryClass?: string; // "LEO_direct", "GTO", "polar_SSO", "suborbital_test"
  trajectoryInference?: TrajectoryInference;

  // ── Landing ─────────────────────────────────────────────
  landingAttempted?: boolean;
  landingSuccess?: boolean;
  landingMode?: string; // "RTLS", "ASDS", "ocean", "catch"
  landingZone?: string; // "LZ-1", "OCISLY", "JRTI", "ASOG", etc.

  // ── Rich data ───────────────────────────────────────────
  cores?: LaunchCore[];
  payloads?: LaunchPayload[];

  // ── UI flags ────────────────────────────────────────────
  isCrewed?: boolean;
  isStarlink?: boolean;
  isReusableLaunch?: boolean;
  firstStageRecovered?: boolean;
  vehicleLost?: boolean;
  testFlight?: boolean;

  // ── Links / media ───────────────────────────────────────
  missionPatch?: string;
  details?: string;
  webcastUrl?: string;
  articleUrl?: string;
  wikipediaUrl?: string;

  // ── Source provenance ───────────────────────────────────
  sourceUrls?: string[];
  sourceLastVerified?: string;

  // ── Existing enrichment ─────────────────────────────────
  boosterReturn?: BoosterReturn;
  /** Multiple booster returns for FH (side boosters + center core) */
  boosterReturns?: BoosterReturn[];
  jellyfish?: JellyfishData;
  flightHistory?: FlightHistory;
}

// ── App state types ──────────────────────────────────────────
export type PlaybackState = "stopped" | "playing" | "paused";
export type CameraMode = "free" | "auto";

export interface FilterState {
  search: string;
  rocketType: string | null;
  status: string | null;
  site: string | null;
  /** Multi-select site filter — site group keys like "CC", "BC", "V", "OI" */
  sites: string[];
  /** When true, only show launches with jellyfish potential */
  jellyfish: boolean;
}
