import { Event, Venue, Zone, Session, Speaker, Staff, Incident, AiRecommendation, Vendor, Resource } from '../types/database';

export const mockEvents: Record<string, Event> = {
  "EVT-01": { id: "EVT-01", name: "Global Tech Summit 2026", startDate: "2026-04-10T08:00:00Z", endDate: "2026-04-12T18:00:00Z", status: "LIVE" }
};

export const mockVenues: Record<string, Venue> = {
  "VEN-01": { id: "VEN-01", name: "Moscone Center West", location: "San Francisco, CA", maxCapacity: 15000, currentHealthScore: 100 }
};

export const mockZones: Record<string, Zone> = {
  "ZONE-MAIN": { id: "ZONE-MAIN", venueId: "VEN-01", name: "Main Stage", type: "MAIN_STAGE", capacity: 5000, currentOccupancy: 1200, status: "NOMINAL", updatedAt: "2026-04-10T10:00:00Z" },
  "ZONE-HALL-A": { id: "ZONE-HALL-A", venueId: "VEN-01", name: "Hall A", type: "HALL", capacity: 800, currentOccupancy: 300, status: "NOMINAL", updatedAt: "2026-04-10T10:00:00Z" },
  "ZONE-HALL-B": { id: "ZONE-HALL-B", venueId: "VEN-01", name: "Hall B", type: "HALL", capacity: 400, currentOccupancy: 250, status: "NOMINAL", updatedAt: "2026-04-10T10:00:00Z" },
  "ZONE-EXPO": { id: "ZONE-EXPO", venueId: "VEN-01", name: "Expo Floor", type: "EXPO", capacity: 8000, currentOccupancy: 4100, status: "NOMINAL", updatedAt: "2026-04-10T10:00:00Z" },
  "ZONE-QUEUE-OUTSIDE": { id: "ZONE-QUEUE-OUTSIDE", venueId: "VEN-01", name: "Outside Holding Queue", type: "QUEUE", capacity: 2000, currentOccupancy: 80, status: "NOMINAL", updatedAt: "2026-04-10T10:00:00Z" }
};

export const mockSpeakers: Record<string, Speaker> = {
  "SPK-01": { id: "SPK-01", name: "Sarah Connor", company: "Cyberdyne Systems", role: "Chief Security Officer" },
  "SPK-02": { id: "SPK-02", name: "Elon Musk", company: "SpaceX", role: "Founder" }
};

export const mockSessions: Record<string, Session> = {
  "SESS-101": { id: "SESS-101", zoneId: "ZONE-MAIN", speakerId: "SPK-02", title: "Keynote: Future of Deep Space AI", startTime: "2026-04-10T09:00:00Z", endTime: "2026-04-10T10:30:00Z", status: "LIVE" },
  "SESS-102": { id: "SESS-102", zoneId: "ZONE-HALL-B", speakerId: "SPK-01", title: "Security Paradigms for AGI", startTime: "2026-04-10T10:15:00Z", endTime: "2026-04-10T11:00:00Z", status: "SCHEDULED" }
};

export const mockStaff: Record<string, Staff> = {
  "STF-001": { id: "STF-001", name: "Alex Chen", role: "SECURITY", status: "ACTIVE", assignedZoneId: "ZONE-HALL-B", shiftStart: "08:00", shiftEnd: "16:00", skills: ["Crowd Control"] },
  "STF-002": { id: "STF-002", name: "Marcus Johnson", role: "USHER", status: "ACTIVE", assignedZoneId: "ZONE-MAIN", shiftStart: "09:00", shiftEnd: "17:00", skills: ["VIP Management"] },
  "STF-003": { id: "STF-003", name: "Priya Patel", role: "MEDIC", status: "ACTIVE", assignedZoneId: null, shiftStart: "08:00", shiftEnd: "20:00", skills: ["First Aid", "CPR"] },
  "STF-004": { id: "STF-004", name: "Diana Prince", role: "USHER", status: "ACTIVE", assignedZoneId: "ZONE-EXPO", shiftStart: "10:00", shiftEnd: "18:00", skills: ["Customer Support"] }
};

export const mockVendors: Record<string, Vendor> = {
  "VND-01": { id: "VND-01", name: "Gourmet Tech Catering", category: "CATERING", status: "ON_SITE" },
  "VND-02": { id: "VND-02", name: "Visionary Sound Systems", category: "AV", status: "ON_SITE" }
};

export const mockIncidents: Record<string, Incident> = {};

export const mockRecommendations: Record<string, AiRecommendation> = {};
