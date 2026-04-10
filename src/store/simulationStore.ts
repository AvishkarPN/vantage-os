import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'RESOLVED';
export type RoomStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';
export type SystemStatus = 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
export type MitigationPhase = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'SETTLED';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  predictedImpact?: string;
  mitigationAction?: string;
  timestamp: Date;
}

export interface OccupancySnapshot {
  value: number;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  staffAssigned: number;
  sessionCount: number;
  history: OccupancySnapshot[];
}

export interface LogLine {
  id: string;
  text: string;
  type: 'OS' | 'AI' | 'WARN' | 'OK';
  timestamp: number;
}

// ─── Interface ────────────────────────────────────────────────────────────────

interface SimulationState {
  totalAttendance: number;
  checkInVelocity: number;
  activeSessions: number;
  systemStatus: SystemStatus;
  rooms: Room[];
  alerts: Alert[];
  threatResolved: boolean;
  mitigationPhase: MitigationPhase;
  logLines: LogLine[];

  // Actions
  tickSimulation: () => void;
  triggerCriticalSurge: () => void;
  beginMitigation: () => void;
  _advanceMitigationToSuccess: () => void;
  _advanceMitigationToSettled: () => void;
  pushLog: (text: string, type: LogLine['type']) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLog(text: string, type: LogLine['type']): LogLine {
  return { id: `L${Date.now()}-${Math.random()}`, text, type, timestamp: Date.now() };
}

const LOG_CAP = 40; // max lines in rolling log

function appendLog(lines: LogLine[], next: LogLine): LogLine[] {
  const updated = [next, ...lines];
  return updated.slice(0, LOG_CAP);
}

const INITIAL_ROOMS: Room[] = [
  {
    id: 'R1', name: 'Main Stage', capacity: 1500, currentOccupancy: 420,
    status: 'NOMINAL', staffAssigned: 8, sessionCount: 3,
    history: [{ value: 380, timestamp: Date.now() - 60000 }],
  },
  {
    id: 'R2', name: 'Hall A', capacity: 300, currentOccupancy: 150,
    status: 'NOMINAL', staffAssigned: 4, sessionCount: 5,
    history: [{ value: 120, timestamp: Date.now() - 60000 }],
  },
  {
    id: 'R3', name: 'Hall B', capacity: 120, currentOccupancy: 105,
    status: 'WARNING', staffAssigned: 2, sessionCount: 2,
    history: [{ value: 88, timestamp: Date.now() - 60000 }],
  },
  {
    id: 'R4', name: 'Expo Floor', capacity: 800, currentOccupancy: 512,
    status: 'NOMINAL', staffAssigned: 6, sessionCount: 12,
    history: [{ value: 480, timestamp: Date.now() - 60000 }],
  },
];

const INITIAL_LOGS: LogLine[] = [
  makeLog('Polling node check vectors... OK', 'OS'),
  makeLog('Aggregating ticket subnets... OK', 'OS'),
  makeLog('Analyzing density heuristics... NOMINAL', 'AI'),
  makeLog('Syncing clock delta (4ms)... OK', 'OS'),
];

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationState>((set) => ({
  totalAttendance: 1187,
  checkInVelocity: 42,
  activeSessions: 14,
  systemStatus: 'NOMINAL',
  rooms: INITIAL_ROOMS,
  alerts: [
    {
      id: 'A0',
      severity: 'INFO',
      message: 'All systems nominal. 1,187 attendees checked in. Network latency 4ms.',
      timestamp: new Date(Date.now() - 120000),
    },
  ],
  threatResolved: false,
  mitigationPhase: 'IDLE',
  logLines: INITIAL_LOGS,

  pushLog: (text, type) => {
    set((state) => ({
      logLines: appendLog(state.logLines, makeLog(text, type)),
    }));
  },

  tickSimulation: () => {
    set((state) => {
      if (state.threatResolved) return state;

      const now = Date.now();
      const newAttendance = state.totalAttendance + Math.floor(Math.random() * 3);
      const newVelocity = state.mitigationPhase === 'PROCESSING'
        ? Math.max(state.checkInVelocity - 8, 120) // starts declining during mitigation
        : state.checkInVelocity;

      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R4' || room.id === 'R1') {
          const bump = Math.floor(Math.random() * 2);
          const newOcc = room.currentOccupancy + bump;
          return {
            ...room,
            currentOccupancy: newOcc,
            history: [...room.history, { value: newOcc, timestamp: now }].slice(-12),
          };
        }
        return room;
      });

      // Push a passive OS log line every tick
      const passiveLogs = [
        'Heartbeat OK — all 14 nodes responding',
        'Ticket scanner subnet latency: 3ms',
        'Attendance delta: +2 in last 1500ms',
        'Spatial model refreshed',
      ];
      const randomLog = passiveLogs[Math.floor(Math.random() * passiveLogs.length)];
      const newLog = makeLog(randomLog, 'OS');

      return {
        totalAttendance: newAttendance,
        checkInVelocity: newVelocity,
        rooms: newRooms,
        logLines: appendLog(state.logLines, newLog),
      };
    });
  },

  triggerCriticalSurge: () => {
    set((state) => {
      if (state.threatResolved || state.mitigationPhase !== 'IDLE') return state;

      const now = Date.now();
      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') {
          return {
            ...room,
            currentOccupancy: 118,
            status: 'CRITICAL' as const,
            history: [...room.history, { value: 118, timestamp: now }].slice(-12),
          };
        }
        return room;
      });

      const criticalAlert: Alert = {
        id: `A${Date.now()}`,
        severity: 'CRITICAL',
        message: 'PREDICTION: Hall B will breach fire-code capacity in 8 minutes. Registration surge detected at entrance gates 3 & 4.',
        predictedImpact: '+14% fire-code breach likelihood',
        mitigationAction: 'AUTO-MITIGATE: Swap with Main Stage',
        timestamp: new Date(),
      };

      const surgeLog1 = makeLog('[ANOMALY] Density threshold exceeded — Hall B sector', 'AI');
      const surgeLog2 = makeLog('[WARN] Entry velocity spike: 184/min at gates 3,4', 'WARN');

      return {
        rooms: newRooms,
        checkInVelocity: 184,
        systemStatus: 'DEGRADED',
        alerts: [criticalAlert, ...state.alerts],
        logLines: appendLog(appendLog(state.logLines, surgeLog2), surgeLog1),
      };
    });
  },

  beginMitigation: () => {
    set((state) => {
      // Guard: only actionable if IDLE and there is a critical alert with an action
      if (state.mitigationPhase !== 'IDLE') return state;

      const initLog = makeLog('[OS] EXECUTING SWAP — session_id=HALL_B → MAIN_STAGE', 'AI');
      const routeLog = makeLog('[OS] Updating attendee routing rules...', 'OS');

      return {
        mitigationPhase: 'PROCESSING',
        logLines: appendLog(appendLog(state.logLines, routeLog), initLog),
      };
    });
  },

  _advanceMitigationToSuccess: () => {
    set((state) => {
      if (state.mitigationPhase !== 'PROCESSING') return state;

      const now = Date.now();
      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') {
          return {
            ...room,
            currentOccupancy: 22,
            status: 'NOMINAL' as const,
            history: [...room.history, { value: 22, timestamp: now }].slice(-12),
          };
        }
        if (room.id === 'R1') {
          return {
            ...room,
            currentOccupancy: 520,
            status: 'NOMINAL' as const,
            history: [...room.history, { value: 520, timestamp: now }].slice(-12),
          };
        }
        return room;
      });

      const successLog = makeLog('[AI] Mitigation confirmed — breach probability: 0.2%', 'AI');
      const notifyLog = makeLog('[OS] Attendee notifications dispatched via app push', 'OK');

      return {
        mitigationPhase: 'SUCCESS',
        rooms: newRooms,
        checkInVelocity: 68, // Dropping back but not fully settled yet
        logLines: appendLog(appendLog(state.logLines, notifyLog), successLog),
      };
    });
  },

  _advanceMitigationToSettled: () => {
    set((state) => {
      if (state.mitigationPhase !== 'SUCCESS') return state;

      const resolvedAlert: Alert = {
        id: `A${Date.now()}`,
        severity: 'RESOLVED',
        message: 'Hall B sessions migrated to Main Stage. All attendees notified. System nominal.',
        timestamp: new Date(),
      };

      const settleLog = makeLog('[OS] System status: NOMINAL — all nodes clear', 'OK');

      return {
        mitigationPhase: 'SETTLED',
        checkInVelocity: 45,
        systemStatus: 'NOMINAL',
        threatResolved: true,
        alerts: [resolvedAlert, ...state.alerts],
        logLines: appendLog(state.logLines, settleLog),
      };
    });
  },
}));
