export type UserRole = 'student' | 'visitor';

export type NavSection = 'home' | 'map' | 'navigation' | 'live' | 'ai';

export type TransportMode = 'walking' | 'skybridge' | 'shuttle';

export interface CampusUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  avatarUrl: string;
  isDemo?: boolean;
}

export interface FacilityRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  equipment: string[];
  available: boolean;
  studentOnly: boolean;
  nextFreeSlot: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  time: string;
  room: string;
  speaker: string;
  category: 'Lecture' | 'Workshop' | 'Public Tour' | 'Symposium';
}

export interface Facility {
  id: string;
  name: string;
  sector: string;
  quad: string;
  category: 'Research' | 'Study' | 'Transit' | 'Commons' | 'Wellness';
  coords: [number, number];
  footprint: [number, number][];
  stories: number;
  heightMeters: number;
  status: 'Open Now' | 'Restricted Access' | '24/7 Access';
  hours: string;
  description: string;
  occupancyPercent: number;
  occupancyLabel: string;
  airQualityPercent: number;
  walkMinutesFromPlaza: number;
  visitorAccess: 'Full Public Access' | 'Lobby & Guided Tours' | 'Badge Escort Required';
  rooms: FacilityRoom[];
  events: CampusEvent[];
}

export interface SkybridgeLink {
  id: string;
  name: string;
  fromId: string;
  toId: string;
  level: string;
  accessible: boolean;
  climateControlled: boolean;
  path: [number, number][];
  status: 'Active' | 'Maintenance';
}

export interface RoomBooking {
  id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  roomId: string;
  roomName: string;
  slot: string;
  purpose: string;
  createdAt: string;
}

export interface ShuttleStatus {
  id: string;
  line: string;
  nextStop: string;
  nextStopFacilityId: string;
  etaMinutes: number;
  loadPercent: number;
  status: 'On Schedule' | 'Boarding';
  coords: [number, number];
  headingLabel: string;
}

export interface CampusAlert {
  id: string;
  sector: string;
  title: string;
  detail: string;
  severity: 'Nominal' | 'Advisory';
  timestamp: string;
}

export interface LiveFeedEntry {
  id: string;
  kind: 'Shuttle' | 'Event' | 'Facility' | 'Skybridge';
  sector: string;
  facilityId?: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface CampusTelemetry {
  campusName: string;
  temperatureC: number;
  airPurityPercent: number;
  smartGridGreenPercent: number;
  campusDensity: 'Optimal' | 'Moderate' | 'Busy';
  activeShuttles: number;
  shuttleLoopPath: [number, number][];
  shuttles: ShuttleStatus[];
  alerts: CampusAlert[];
  liveFeed: LiveFeedEntry[];
  occupancyOverrides: Record<string, number>;
  updatedAt: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  landmark: string;
}

export interface ComputedRoute {
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  mode: TransportMode;
  distanceMeters: number;
  durationMinutes: number;
  accessible: boolean;
  path: [number, number][];
  steps: RouteStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedFacilityIds?: string[];
  timestamp: string;
}
