import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Zone, Incident, Staff, AiRecommendation, Session, Venue, Event } from '@/types/database';
import { mockEvents, mockVenues, mockZones, mockSessions, mockStaff, mockIncidents, mockRecommendations } from '@/seed/mockData';

export interface DatabaseState {
  // ─── Collections ───
  events: Record<string, Event>;
  venues: Record<string, Venue>;
  zones: Record<string, Zone>;
  sessions: Record<string, Session>;
  staff: Record<string, Staff>;
  incidents: Record<string, Incident>;
  recommendations: Record<string, AiRecommendation>;

  // ─── Demo Actions ───
  loadSeedData: () => void;
  resetDemoScenario: () => void;
  triggerOvercrowding: (zoneId: string) => void;
  applyRecommendation: (recId: string) => void;
  resolveIncident: (incidentId: string) => void;
  reassignStaff: (staffId: string, zoneId: string | null) => void;
  delaySession: (sessionId: string, delayedMinutes: number) => void;
}

export const useDatabaseStore = create<DatabaseState>()(
  devtools((set, get) => ({
    events: {},
    venues: {},
    zones: {},
    sessions: {},
    staff: {},
    incidents: {},
    recommendations: {},

    loadSeedData: () => {
      set({
        events: { ...mockEvents },
        venues: { ...mockVenues },
        zones: { ...mockZones },
        sessions: { ...mockSessions },
        staff: { ...mockStaff },
        incidents: { ...mockIncidents },
        recommendations: { ...mockRecommendations }
      });
    },

    resetDemoScenario: () => {
      get().loadSeedData();
    },

    triggerOvercrowding: (zoneId) => {
      set((state) => {
        const targetZone = state.zones[zoneId];
        if (!targetZone) return state;

        const newIncidentId = `INC-${Date.now()}`;
        const newRecId = `REC-${Date.now()}`;

        return {
          zones: {
            ...state.zones,
            [zoneId]: {
              ...targetZone,
              currentOccupancy: targetZone.capacity + Math.floor(targetZone.capacity * 0.2), // 20% over capacity
              status: 'DEGRADED',
              updatedAt: new Date().toISOString()
            }
          },
          incidents: {
            ...state.incidents,
            [newIncidentId]: {
              id: newIncidentId,
              zoneId,
              type: 'CROWD_SURGE',
              severity: 'CRITICAL',
              message: `Registration surge detected. Capacity breach in ${targetZone.name}.`,
              status: 'ACTIVE',
              timestamp: new Date().toISOString()
            }
          },
          recommendations: {
            ...state.recommendations,
            [newRecId]: {
              id: newRecId,
              incidentId: newIncidentId,
              description: `Redistribute overflow to Main Stage. Deploy 2 additional ushers.`,
              actionPayload: {
                targetMove: 'ZONE-MAIN',
                movedCount: Math.floor(targetZone.capacity * 0.15)
              },
              confidenceScore: 0.94,
              status: 'PENDING'
            }
          }
        };
      });
    },

    applyRecommendation: (recId) => {
      const rec = get().recommendations[recId];
      if (!rec || rec.status !== 'PENDING') return;

      const incident = get().incidents[rec.incidentId];

      set((state) => {
        const nextZones = { ...state.zones };
        const nextIncidents = { ...state.incidents };
        
        if (incident && nextZones[incident.zoneId]) {
          // Resolve incident
          nextIncidents[incident.id] = { ...incident, status: 'RESOLVED' };
          
          // Reduce occupancy on the source zone via deterministic payload
          const sourceZone = nextZones[incident.zoneId];
          nextZones[incident.zoneId] = {
            ...sourceZone,
            currentOccupancy: Math.max(0, sourceZone.currentOccupancy - rec.actionPayload.movedCount),
            status: 'NOMINAL',
            updatedAt: new Date().toISOString()
          };

          // Increase occupancy on target zone
          const targetZone = nextZones[rec.actionPayload.targetMove];
          if (targetZone) {
            nextZones[targetZone.id] = {
              ...targetZone,
              currentOccupancy: targetZone.currentOccupancy + rec.actionPayload.movedCount,
              updatedAt: new Date().toISOString()
            };
          }
        }

        return {
          zones: nextZones,
          incidents: nextIncidents,
          recommendations: {
            ...state.recommendations,
            [recId]: { ...rec, status: 'ACCEPTED' }
          }
        };
      });
    },

    resolveIncident: (incidentId) => {
      set((state) => {
        if (!state.incidents[incidentId]) return state;
        return {
          incidents: {
            ...state.incidents,
            [incidentId]: { ...state.incidents[incidentId], status: 'RESOLVED' }
          }
        };
      });
    },

    reassignStaff: (staffId, zoneId) => {
      set((state) => {
        if (!state.staff[staffId]) return state;
        return {
          staff: {
            ...state.staff,
            [staffId]: { ...state.staff[staffId], assignedZoneId: zoneId }
          }
        };
      });
    },

    delaySession: (sessionId, delayedMinutes) => {
      set((state) => {
        if (!state.sessions[sessionId]) return state;
        const s = state.sessions[sessionId];
        
        // Very basic mock delay logic for visual purposes
        const newStart = new Date(new Date(s.startTime).getTime() + delayedMinutes * 60000).toISOString();
        const newEnd = new Date(new Date(s.endTime).getTime() + delayedMinutes * 60000).toISOString();

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...s, status: 'DELAYED', startTime: newStart, endTime: newEnd }
          }
        };
      });
    }
  }))
);
