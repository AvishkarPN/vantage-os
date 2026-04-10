export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
export type EntityStatus = 'NOMINAL' | 'DEGRADED' | 'OFFLINE';

export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
}

export interface Venue {
  id: string; // e.g. VENUE-01
  name: string;
  location: string;
  maxCapacity: number;
  currentHealthScore: number;
}

export interface Zone {
  id: string;
  venueId: string;
  name: string;
  type: 'MAIN_STAGE' | 'EXPO' | 'HALL' | 'QUEUE';
  capacity: number;
  currentOccupancy: number;
  status: EntityStatus;
  updatedAt: string;
}

export interface Session {
  id: string;
  zoneId: string;
  speakerId: string;
  title: string;
  startTime: string; // ISO
  endTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'DELAYED' | 'ENDED';
}

export interface Speaker {
  id: string;
  name: string;
  company: string;
  role: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'SECURITY' | 'USHER' | 'MEDIC' | 'TECH';
  status: 'ACTIVE' | 'BREAK' | 'UNAVAILABLE';
  assignedZoneId: string | null;
  shiftStart: string;
  shiftEnd: string;
  skills: string[];
}

export interface Incident {
  id: string;
  zoneId: string;
  type: 'CROWD_SURGE' | 'MEDICAL' | 'TECH_FAILURE' | 'VENDOR_DELAY';
  severity: Severity;
  message: string;
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  timestamp: string;
}

export interface AiRecommendation {
  id: string;
  incidentId: string;
  description: string;
  actionPayload: any; // JSON payload for deterministic execution
  confidenceScore: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface Vendor {
  id: string;
  name: string;
  category: 'CATERING' | 'AV' | 'SECURITY';
  status: 'ON_SITE' | 'DELAYED' | 'UNAVAILABLE';
}

export interface Resource {
  id: string;
  zoneId: string;
  name: string;
  required: number;
  allocated: number;
  status: 'READY' | 'DEPLOYING' | 'DEFICIT';
}
