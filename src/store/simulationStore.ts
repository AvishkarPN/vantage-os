import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity   = 'INFO' | 'WARNING' | 'CRITICAL' | 'RESOLVED';
export type RoomStatus      = 'NOMINAL' | 'WARNING' | 'CRITICAL';
export type SystemStatus    = 'NOMINAL' | 'DEGRADED' | 'CRITICAL';

export type MitigationPhase =
  | 'IDLE'
  | 'DETECTED'
  | 'ANALYZING'
  | 'RECOMMENDING'
  | 'EXECUTING'
  | 'REDISTRIBUTING'
  | 'STABILIZING'
  | 'MONITORING';

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
  // Crowd state breakdown
  queueLength: number;
  waitingExternal: number;
  rerouted: number;
}

export interface LogLine {
  id: string;
  text: string;
  type: 'OS' | 'AI' | 'WARN' | 'OK';
  timestamp: number;
}

export interface RedistributionSummary {
  movedToHallA: number;
  movedToExpo: number;
  movedToMainStage: number;
  heldInQueue: number;
  awaitingSlot: number;
  staffReassigned: number;
  notificationsSent: number;
  riskBefore: number;
  riskAfter: number;
  timeToStabilize: string;
}

export interface MitigationResult {
  issue: string;
  cause: string;
  actionTaken: string;
  redistribution: RedistributionSummary;
  finalOccupancyByZone: Record<string, { name: string; pct: number }>;
  stabilizedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _logCounter = 0;
function makeLog(text: string, type: LogLine['type']): LogLine {
  return { id: `L${Date.now()}-${++_logCounter}`, text, type, timestamp: Date.now() };
}

const LOG_CAP = 50;
function appendLog(lines: LogLine[], ...next: LogLine[]): LogLine[] {
  return [...next, ...lines].slice(0, LOG_CAP);
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_ROOMS: Room[] = [
  {
    id: 'R1', name: 'Main Stage', capacity: 1500, currentOccupancy: 420,
    status: 'NOMINAL', staffAssigned: 8, sessionCount: 3,
    history: [{ value: 380, timestamp: Date.now() - 90000 }, { value: 400, timestamp: Date.now() - 60000 }, { value: 420, timestamp: Date.now() - 30000 }],
    queueLength: 0, waitingExternal: 0, rerouted: 0,
  },
  {
    id: 'R2', name: 'Hall A', capacity: 300, currentOccupancy: 150,
    status: 'NOMINAL', staffAssigned: 4, sessionCount: 5,
    history: [{ value: 110, timestamp: Date.now() - 90000 }, { value: 132, timestamp: Date.now() - 60000 }, { value: 150, timestamp: Date.now() - 30000 }],
    queueLength: 2, waitingExternal: 0, rerouted: 0,
  },
  {
    id: 'R3', name: 'Hall B', capacity: 120, currentOccupancy: 105,
    status: 'WARNING', staffAssigned: 2, sessionCount: 2,
    history: [{ value: 82, timestamp: Date.now() - 90000 }, { value: 95, timestamp: Date.now() - 60000 }, { value: 105, timestamp: Date.now() - 30000 }],
    queueLength: 4, waitingExternal: 0, rerouted: 0,
  },
  {
    id: 'R4', name: 'Expo Floor', capacity: 800, currentOccupancy: 512,
    status: 'NOMINAL', staffAssigned: 6, sessionCount: 12,
    history: [{ value: 460, timestamp: Date.now() - 90000 }, { value: 490, timestamp: Date.now() - 60000 }, { value: 512, timestamp: Date.now() - 30000 }],
    queueLength: 0, waitingExternal: 0, rerouted: 0,
  },
];

const INITIAL_LOGS: LogLine[] = [
  makeLog('System boot complete — all 14 nodes responding', 'OK'),
  makeLog('Ticket scanner subnet synced — latency 4ms', 'OS'),
  makeLog('Spatial density model initialized', 'AI'),
  makeLog('Attendance tracking active — 1,187 checked in', 'OS'),
];

// ─── The redistribution constants (deterministic, coherent for demo) ──────────

const REDISTRIB: RedistributionSummary = {
  movedToHallA:      46,
  movedToExpo:       28,
  movedToMainStage:   3,
  heldInQueue:       19,
  awaitingSlot:       2,
  staffReassigned:    2,
  notificationsSent: 96,
  riskBefore: 98,
  riskAfter:   4,
  timeToStabilize: '3.5s',
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface SimulationState {
  totalAttendance: number;
  checkInVelocity: number;
  activeSessions: number;
  systemStatus: SystemStatus;
  rooms: Room[];
  alerts: Alert[];
  logLines: LogLine[];
  mitigationPhase: MitigationPhase;
  mitigationResult: MitigationResult | null;
  isDbConnected: boolean;
  activeIncidentDbId: string | null;

  // DB Sync
  fetchFromDatabase: () => Promise<void>;
  syncToDatabase: () => Promise<void>;

  // Simulation actions
  tickSimulation: () => void;

  // Crisis lifecycle
  triggerCriticalSurge: () => void;
  advanceToAnalyzing: () => void;
  advanceToRecommending: () => void;
  beginMitigation: () => void;
  advanceToRedistributing: () => void;
  advanceToStabilizing: () => void;
  advanceToMonitoring: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationState>((set, get) => ({
  totalAttendance: 1187,
  checkInVelocity: 42,
  activeSessions: 14,
  systemStatus: 'NOMINAL',
  rooms: INITIAL_ROOMS,
  isDbConnected: false,
  activeIncidentDbId: null,
  alerts: [
    {
      id: 'A0',
      severity: 'INFO',
      message: 'All systems nominal. 1,187 attendees checked in. Spatial model synced.',
      timestamp: new Date(Date.now() - 120000),
    },
  ],
  logLines: INITIAL_LOGS,
  mitigationPhase: 'IDLE',
  mitigationResult: null,

  fetchFromDatabase: async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.zones) && data.zones.length > 0) {
          set((state) => {
            const nextRooms = state.rooms.map((r) => {
              const matched = data.zones.find((z: any) => z.name === r.name);
              if (matched) {
                return {
                  ...r,
                  capacity: matched.capacity,
                  currentOccupancy: matched.currentOccupancy,
                  status: (matched.status as RoomStatus) || r.status,
                  queueLength: matched.queueLength ?? r.queueLength,
                  staffAssigned: matched.staffAssigned ?? r.staffAssigned,
                  sessionCount: matched.sessionCount ?? r.sessionCount,
                };
              }
              return r;
            });
            return {
              rooms: nextRooms,
              isDbConnected: true,
              totalAttendance: nextRooms.reduce((sum, room) => sum + room.currentOccupancy, 0),
            };
          });
        }
      }
    } catch (err) {
      console.warn('[SimulationStore] DB fetch fallback:', err);
    }
  },

  syncToDatabase: async () => {
    try {
      const rooms = get().rooms.map(r => ({
        name: r.name,
        currentOccupancy: r.currentOccupancy,
        status: r.status,
        queueLength: r.queueLength,
        waitingExternal: r.waitingExternal,
        rerouted: r.rerouted,
        staffAssigned: r.staffAssigned,
      }));
      await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms })
      });
    } catch (err) {
      console.warn('[SimulationStore] Failed to sync rooms to DB:', err);
    }
  },

  // ── Simulation tick ──────────────────────────────────────────────────────
  tickSimulation: () => {
    set((state) => {
      const phase = state.mitigationPhase;
      const now = Date.now();
      const noise = (val: number, delta: number) => Math.max(0, val + Math.floor((Math.random() - 0.5) * delta));

      // ── NOMINAL / MONITORING ──────────────────────────────────────────────
      if (phase === 'IDLE' || phase === 'MONITORING') {
        const newRooms = state.rooms.map((room) => {
          let occ = room.currentOccupancy;
          let q = room.queueLength;
          let w = room.waitingExternal;

          // Increase raw attendance interest
          const flowIn = Math.floor(Math.random() * 3);
          
          // Logic: If room is near 90% capacity, people start entering the queue first
          if (occ >= room.capacity * 0.9) {
            q += flowIn;
          } else {
            occ += flowIn;
          }

          // Logic: Queues slowly drain into occupancy
          const drain = q > 0 ? Math.min(q, Math.floor(Math.random() * 2) + 1) : 0;
          if (occ + drain <= room.capacity) {
            occ += drain;
            q -= drain;
          }

          // Simple saturation: if queue is also massive (>20), people wait external
          if (q > 25) {
             const overflow = q - 25;
             w += overflow;
             q = 25;
          }

          // Small organic variations
          occ = noise(occ, 3);
          occ = Math.min(occ, room.capacity);

          return {
            ...room,
            currentOccupancy: occ,
            queueLength: q,
            waitingExternal: w,
            history: [...room.history, { value: occ, timestamp: now }].slice(-12),
          };
        });

        return {
          totalAttendance: state.totalAttendance + Math.floor(Math.random() * 3),
          checkInVelocity: Math.max(38, Math.min(52, state.checkInVelocity + Math.floor((Math.random() - 0.5) * 6))),
          rooms: newRooms,
          // Only log flow sync occasionally (1 in 8 ticks) to reduce chatter
          logLines: Math.random() > 0.85 
            ? appendLog(state.logLines, makeLog('Spatial flow synchronized — queues updating', 'OS'))
            : state.logLines,
        };
      }

      // During REDISTRIBUTING/STABILIZING: velocity still declining
      if (phase === 'REDISTRIBUTING' || phase === 'STABILIZING') {
        return {
          checkInVelocity: Math.max(60, state.checkInVelocity - 15),
          logLines: state.logLines,
        };
      }

      // ── SURGE ACTIVE (DETECTED -> EXECUTING) ──────────────────────────────
      if (phase === 'DETECTED' || phase === 'ANALYZING' || phase === 'RECOMMENDING' || phase === 'EXECUTING') {
        const newRooms = state.rooms.map((room) => {
          if (room.id === 'R3') { // Hall B is spiking
            let q = room.queueLength + Math.floor(Math.random() * 4);
            let w = room.waitingExternal + Math.floor(Math.random() * 2);
            return { ...room, queueLength: q, waitingExternal: w };
          }
          return room;
        });

        return {
          totalAttendance: state.totalAttendance + Math.floor(Math.random() * 5),
          rooms: newRooms,
          logLines: state.logLines,
        };
      }

      return state;
    });
  },

  // ── Crisis: DETECTED ─────────────────────────────────────────────────────
  triggerCriticalSurge: () => {
    // Persist incident to SQLite database
    fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoneName: 'Hall B',
        type: 'CROWD_SURGE',
        message: 'Registration surge detected. Predicted fire-code breach in 8 minutes at gates 3 & 4.',
        severity: 'CRITICAL',
        predictedImpact: '+14% fire-code breach likelihood',
        mitigation: 'AUTO-MITIGATE: SWAP SESSIONS'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.incident?.id) {
          set({ activeIncidentDbId: data.incident.id });
        }
      })
      .catch(err => console.warn('[SimulationStore] Failed to persist incident to DB:', err));

    set((state) => {
      if (state.mitigationPhase !== 'IDLE') return state;
      const now = Date.now();

      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') {
          return {
            ...room,
            currentOccupancy: 118,
            status: 'CRITICAL' as const,
            queueLength: 33,
            waitingExternal: 22,
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
        mitigationAction: 'AUTO-MITIGATE: SWAP SESSIONS',
        timestamp: new Date(),
      };

      return {
        mitigationPhase: 'DETECTED',
        rooms: newRooms,
        checkInVelocity: 184,
        systemStatus: 'DEGRADED',
        alerts: [criticalAlert, ...state.alerts],
        logLines: appendLog(
          state.logLines,
          makeLog('[ANOMALY] Density threshold exceeded — Hall B sector', 'WARN'),
          makeLog('[!!] Surge at gates 3 & 4 — velocity: 184/min', 'WARN'),
          makeLog('Hall B queue exceeds safety threshold: 33 in queue', 'WARN'),
          makeLog('Predicted fire-code breach in 8 min at current rate', 'AI'),
        ),
      };
    });
  },

  // ── ANALYZING ────────────────────────────────────────────────────────────
  advanceToAnalyzing: () => {
    set((state) => {
      if (state.mitigationPhase !== 'DETECTED') return state;
      return {
        mitigationPhase: 'ANALYZING',
        logLines: appendLog(
          state.logLines,
          makeLog('Analyzing crowd vectors and available capacity...', 'AI'),
          makeLog('Scanning session schedules for swap candidates...', 'OS'),
          makeLog('Checking Hall A availability: 150/300 (50%)', 'AI'),
          makeLog('Checking Expo Floor availability: 512/800 (64%)', 'AI'),
        ),
      };
    });
  },

  // ── RECOMMENDING ─────────────────────────────────────────────────────────
  advanceToRecommending: () => {
    set((state) => {
      if (state.mitigationPhase !== 'ANALYZING') return state;
      return {
        mitigationPhase: 'RECOMMENDING',
        logLines: appendLog(
          state.logLines,
          makeLog('RECOMMENDATION: Swap Hall B → Main Stage (28% headroom)', 'AI'),
          makeLog('Candidate identified: "AI in Operations Workshop" (120 cap)', 'AI'),
          makeLog('Distribution plan: Hall A +46 / Expo +28 / Queue 19', 'AI'),
          makeLog('Awaiting operator confirmation...', 'OS'),
        ),
      };
    });
  },

  // ── EXECUTING (button click) ──────────────────────────────────────────────
  beginMitigation: () => {
    const activeIncidentId = get().activeIncidentDbId;
    if (activeIncidentId) {
      fetch('/api/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: activeIncidentId, operatorName: 'op_alpha' })
      }).catch(err => console.warn('[SimulationStore] Failed to execute DB mitigation:', err));
    }

    set((state) => {
      if (state.mitigationPhase !== 'RECOMMENDING') return state;
      return {
        mitigationPhase: 'EXECUTING',
        logLines: appendLog(
          state.logLines,
          makeLog('Operator confirmed — executing mitigation plan in DB', 'OK'),
          makeLog('EXECUTING SWAP — session_id=HALL_B → MAIN_STAGE', 'AI'),
          makeLog('Locking Hall B entry gates 3 & 4...', 'OS'),
        ),
      };
    });
  },

  // ── REDISTRIBUTING ────────────────────────────────────────────────────────
  advanceToRedistributing: () => {
    set((state) => {
      if (state.mitigationPhase !== 'EXECUTING') return state;
      const now = Date.now();

      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') { // Hall B — emptied out
          return {
            ...room,
            currentOccupancy: 22, // 2 remaining sessions still seated
            status: 'NOMINAL' as const,
            queueLength: 19,       // still draining
            waitingExternal: 8,
            rerouted: 74,          // partial redistribution done
            history: [...room.history, { value: 22, timestamp: now }].slice(-12),
          };
        }
        if (room.id === 'R2') { // Hall A — receiving
          return {
            ...room,
            currentOccupancy: 196,
            status: 'NOMINAL' as const,
            staffAssigned: 5,      // gained 1 staff
            queueLength: 12,
            history: [...room.history, { value: 196, timestamp: now }].slice(-12),
          };
        }
        if (room.id === 'R4') { // Expo Floor — receiving
          return {
            ...room,
            currentOccupancy: 540,
            history: [...room.history, { value: 540, timestamp: now }].slice(-12),
          };
        }
        if (room.id === 'R1') { // Main Stage — small overflow
          return {
            ...room,
            currentOccupancy: 438,
            staffAssigned: 6,      // lent 2 ushers to Hall B
            history: [...room.history, { value: 438, timestamp: now }].slice(-12),
          };
        }
        return room;
      });

      return {
        mitigationPhase: 'REDISTRIBUTING',
        rooms: newRooms,
        checkInVelocity: 112, // still elevated but dropping
        logLines: appendLog(
          state.logLines,
          makeLog('Routing 46 attendees → Hall A (Gate 7)', 'OS'),
          makeLog('Routing 28 attendees → Expo Floor overflow (Level 2)', 'OS'),
          makeLog('Routing 3 attendees → Main Stage via Corridor B', 'OS'),
          makeLog('19 attendees held in queue — awaiting slot release', 'WARN'),
          makeLog('Ushers reassigned: +2 from Main Stage → Hall B entrance', 'OS'),
          makeLog('Push notifications dispatched to 96 attendees', 'OK'),
        ),
      };
    });
  },

  // ── STABILIZING ──────────────────────────────────────────────────────────
  advanceToStabilizing: () => {
    set((state) => {
      if (state.mitigationPhase !== 'REDISTRIBUTING') return state;
      const now = Date.now();

      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') {
          return {
            ...room,
            queueLength: 4,
            waitingExternal: 0,
            rerouted: 96,
            history: [...room.history, { value: 22, timestamp: now }].slice(-12),
          };
        }
        if (room.id === 'R2') {
          return {
            ...room,
            queueLength: 3,
            history: [...room.history, { value: 196, timestamp: now }].slice(-12),
          };
        }
        return room;
      });

      return {
        mitigationPhase: 'STABILIZING',
        rooms: newRooms,
        checkInVelocity: 68,
        logLines: appendLog(
          state.logLines,
          makeLog('Breach probability: 98% → 4%', 'AI'),
          makeLog('Hall B occupancy confirmed: 118 → 22 (safe)', 'OK'),
          makeLog('Queue normalizing: 33 → 19 → 4', 'OS'),
          makeLog('Hall A accepting overflow — nominal at 65%', 'OS'),
          makeLog('Expo Floor at 67% — within safe threshold', 'OS'),
        ),
      };
    });
  },

  // ── MONITORING ────────────────────────────────────────────────────────────
  advanceToMonitoring: () => {
    set((state) => {
      if (state.mitigationPhase !== 'STABILIZING') return state;
      const now = Date.now();

      const newRooms = state.rooms.map((room) => {
        if (room.id === 'R3') {
          return { ...room, queueLength: 0, waitingExternal: 0, status: 'NOMINAL' as const };
        }
        return room;
      });

      const mitigationResult: MitigationResult = {
        issue: 'Hall B fire-code capacity breach (predicted)',
        cause: 'Registration surge at gates 3 & 4 — 184 check-ins/min',
        actionTaken: 'Session swap HALL_B → MAIN_STAGE. Redistribution across 3 zones.',
        redistribution: REDISTRIB,
        finalOccupancyByZone: {
          R3: { name: 'Hall B',      pct: 18 },
          R2: { name: 'Hall A',      pct: 65 },
          R4: { name: 'Expo Floor',  pct: 67 },
          R1: { name: 'Main Stage',  pct: 29 },
        },
        stabilizedAt: new Date(now),
      };

      const resolvedAlert: Alert = {
        id: `A${now}`,
        severity: 'RESOLVED',
        message: 'Hall B sessions fully migrated. All 96 attendees redirected. System nominal.',
        timestamp: new Date(now),
      };

      return {
        mitigationPhase: 'MONITORING',
        rooms: newRooms,
        checkInVelocity: 45,
        systemStatus: 'NOMINAL',
        mitigationResult,
        alerts: [resolvedAlert, ...state.alerts],
        logLines: appendLog(
          state.logLines,
          makeLog('System status: NOMINAL — all sectors clear', 'OK'),
          makeLog('Mitigation complete. Time to stabilize: 3.5s', 'OK'),
          makeLog('Entering continuous monitoring mode', 'AI'),
        ),
      };
    });

    setTimeout(() => {
      get().syncToDatabase();
    }, 500);
  },
}));
