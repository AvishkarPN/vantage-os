import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaffStatus =
  | 'unassigned'
  | 'assigned'
  | 'checked-in'
  | 'active'
  | 'on-break'
  | 'unavailable';

export type AssignmentZone =
  | 'Main Stage'
  | 'Hall A'
  | 'Hall B'
  | 'Expo Floor'
  | 'Gate 1-4'
  | 'Gate 5-8'
  | 'Control Desk'
  | 'Security'
  | 'Logistics'
  | 'Queue Management';

export const ALL_ZONES: AssignmentZone[] = [
  'Main Stage', 'Hall A', 'Hall B', 'Expo Floor',
  'Gate 1-4', 'Gate 5-8', 'Control Desk', 'Security',
  'Logistics', 'Queue Management',
];

export interface ZoneConfig {
  zone: AssignmentZone;
  minStaff: number;
  optimalStaff: number;
}

export const ZONE_CONFIGS: ZoneConfig[] = [
  { zone: 'Main Stage',      minStaff: 6, optimalStaff: 8 },
  { zone: 'Hall A',          minStaff: 4, optimalStaff: 5 },
  { zone: 'Hall B',          minStaff: 2, optimalStaff: 4 },
  { zone: 'Expo Floor',      minStaff: 4, optimalStaff: 6 },
  { zone: 'Gate 1-4',        minStaff: 2, optimalStaff: 3 },
  { zone: 'Gate 5-8',        minStaff: 2, optimalStaff: 3 },
  { zone: 'Control Desk',    minStaff: 2, optimalStaff: 2 },
  { zone: 'Security',        minStaff: 2, optimalStaff: 3 },
  { zone: 'Logistics',       minStaff: 2, optimalStaff: 2 },
  { zone: 'Queue Management', minStaff: 1, optimalStaff: 2 },
];

export interface StaffMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  shiftStart: string;
  shiftEnd: string;
  status: StaffStatus;
  assignedZone: AssignmentZone | null;
}

// ─── Seeded staff data ────────────────────────────────────────────────────────

const SEED_STAFF: StaffMember[] = [
  { id: 'S01', name: 'Priya Sharma',    initials: 'PS', role: 'Senior Marshal',  skills: ['Crowd Control', 'First Aid'], shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Hall A' },
  { id: 'S02', name: 'Rohan Mehta',     initials: 'RM', role: 'Marshal',         skills: ['Crowd Control'],              shiftStart: '09:00', shiftEnd: '21:00', status: 'active',      assignedZone: 'Hall B' },
  { id: 'S03', name: 'Anita Desai',     initials: 'AD', role: 'Technical Lead',  skills: ['AV', 'Lighting'],             shiftStart: '07:00', shiftEnd: '19:00', status: 'active',      assignedZone: 'Main Stage' },
  { id: 'S04', name: 'Vikram Patel',    initials: 'VP', role: 'Marshal',         skills: ['Crowd Control'],              shiftStart: '10:00', shiftEnd: '22:00', status: 'checked-in',  assignedZone: null },
  { id: 'S05', name: 'Sanya Kapoor',    initials: 'SK', role: 'Logistics Lead',  skills: ['Transport', 'Loading'],       shiftStart: '07:00', shiftEnd: '19:00', status: 'active',      assignedZone: 'Expo Floor' },
  { id: 'S06', name: 'Arjun Singh',     initials: 'AS', role: 'Security',        skills: ['Access Control'],             shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Gate 1-4' },
  { id: 'S07', name: 'Meera Nair',      initials: 'MN', role: 'Medical Officer', skills: ['First Aid', 'CPR'],           shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Control Desk' },
  { id: 'S08', name: 'Ravi Kumar',      initials: 'RK', role: 'Security',        skills: ['Access Control', 'Patrol'],   shiftStart: '09:00', shiftEnd: '21:00', status: 'active',      assignedZone: 'Security' },
  { id: 'S09', name: 'Divya Iyer',      initials: 'DI', role: 'Coordinator',     skills: ['Scheduling', 'Comms'],        shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Control Desk' },
  { id: 'S10', name: 'Karan Shah',      initials: 'KS', role: 'Marshal',         skills: ['Crowd Control'],              shiftStart: '08:00', shiftEnd: '20:00', status: 'on-break',    assignedZone: 'Hall A' },
  { id: 'S11', name: 'Pooja Gupta',     initials: 'PG', role: 'Logistics',       skills: ['Transport'],                  shiftStart: '09:00', shiftEnd: '21:00', status: 'active',      assignedZone: 'Logistics' },
  { id: 'S12', name: 'Suresh Naik',     initials: 'SN', role: 'Technical AV',    skills: ['AV', 'Sound'],                shiftStart: '07:00', shiftEnd: '19:00', status: 'active',      assignedZone: 'Main Stage' },
  { id: 'S13', name: 'Aditi Rao',       initials: 'AR', role: 'Marshal',         skills: ['Queue Management'],           shiftStart: '10:00', shiftEnd: '22:00', status: 'active',      assignedZone: 'Queue Management' },
  { id: 'S14', name: 'Nikhil Joshi',    initials: 'NJ', role: 'Security',        skills: ['Access Control'],             shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Gate 5-8' },
  { id: 'S15', name: 'Priti Bose',      initials: 'PB', role: 'Marshal',         skills: ['Crowd Control'],              shiftStart: '12:00', shiftEnd: '24:00', status: 'unavailable', assignedZone: null },
  { id: 'S16', name: 'Manish Agarwal',  initials: 'MA', role: 'Marshal',         skills: ['Crowd Control', 'First Aid'], shiftStart: '10:00', shiftEnd: '22:00', status: 'checked-in',  assignedZone: null },
  { id: 'S17', name: 'Kavya Reddy',     initials: 'KR', role: 'Medical Officer', skills: ['First Aid', 'CPR'],           shiftStart: '09:00', shiftEnd: '21:00', status: 'active',      assignedZone: 'Expo Floor' },
  { id: 'S18', name: 'Rajesh Kumar',    initials: 'RJ', role: 'Security',        skills: ['Access Control'],             shiftStart: '08:00', shiftEnd: '20:00', status: 'active',      assignedZone: 'Gate 1-4' },
  { id: 'S19', name: 'Sneha Pillai',    initials: 'SP', role: 'Logistics',       skills: ['Inventory', 'Transport'],     shiftStart: '07:00', shiftEnd: '19:00', status: 'active',      assignedZone: 'Logistics' },
  { id: 'S20', name: 'Arun Menon',      initials: 'AM', role: 'Technical',       skills: ['Lighting', 'Rigging'],        shiftStart: '06:00', shiftEnd: '18:00', status: 'unassigned',  assignedZone: null },
];

// ─── Store interface ──────────────────────────────────────────────────────────

interface StaffState {
  staff: StaffMember[];
  swapSourceId: string | null;
  isLoading: boolean;
  isSynced: boolean;

  fetchFromDatabase: () => Promise<void>;
  assignStaff: (id: string, zone: AssignmentZone | null) => Promise<void>;
  unassignStaff: (id: string) => Promise<void>;
  setStaffStatus: (id: string, status: StaffStatus) => Promise<void>;
  initiateSwap: (id: string) => void;
  completeSwap: (targetId: string) => Promise<void>;
  cancelSwap: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: SEED_STAFF,
  swapSourceId: null,
  isLoading: false,
  isSynced: false,

  fetchFromDatabase: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.staff) && data.staff.length > 0) {
          const mapped: StaffMember[] = data.staff.map((s: any) => ({
            id: s.id,
            name: s.name,
            initials: s.initials,
            role: s.role,
            skills: typeof s.skills === 'string' ? JSON.parse(s.skills) : s.skills,
            shiftStart: s.shiftStart,
            shiftEnd: s.shiftEnd,
            status: s.status as StaffStatus,
            assignedZone: s.assignedZone as AssignmentZone | null,
          }));
          set({ staff: mapped, isSynced: true });
        }
      }
    } catch (err) {
      console.warn('[StaffStore] DB fetch fallback to local seed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  assignStaff: async (id, zone) => {
    // 1. Optimistic Update
    set((state) => ({
      staff: state.staff.map((s) =>
        s.id === id
          ? { ...s, assignedZone: zone, status: zone ? (s.status === 'unassigned' ? 'assigned' : s.status) : 'unassigned' }
          : s
      ),
    }));

    // 2. Persist to Database
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', staffId: id, zoneName: zone })
      });
    } catch (err) {
      console.error('[StaffStore] Failed to persist staff assignment to DB:', err);
    }
  },

  unassignStaff: async (id) => {
    set((state) => ({
      staff: state.staff.map((s) =>
        s.id === id ? { ...s, assignedZone: null, status: 'unassigned' } : s
      ),
    }));

    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', staffId: id, zoneName: null })
      });
    } catch (err) {
      console.error('[StaffStore] Failed to persist staff unassignment to DB:', err);
    }
  },

  setStaffStatus: async (id, status) => {
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? { ...s, status } : s)),
    }));

    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', staffId: id, status })
      });
    } catch (err) {
      console.error('[StaffStore] Failed to persist staff status to DB:', err);
    }
  },

  initiateSwap: (id) => {
    const { swapSourceId } = get();
    if (swapSourceId === id) {
      set({ swapSourceId: null }); // deselect
    } else if (swapSourceId === null) {
      set({ swapSourceId: id });
    } else {
      // auto-complete if second target clicked
      get().completeSwap(id);
    }
  },

  completeSwap: async (targetId) => {
    const { swapSourceId, staff } = get();
    if (!swapSourceId || swapSourceId === targetId) {
      set({ swapSourceId: null });
      return;
    }
    const src = staff.find((s) => s.id === swapSourceId);
    const tgt = staff.find((s) => s.id === targetId);
    if (!src || !tgt) { set({ swapSourceId: null }); return; }

    const srcZone = src.assignedZone;
    const tgtZone = tgt.assignedZone;
    const sourceId = swapSourceId;

    // Optimistic update
    set((state) => ({
      swapSourceId: null,
      staff: state.staff.map((s) => {
        if (s.id === sourceId) return { ...s, assignedZone: tgtZone };
        if (s.id === targetId) return { ...s, assignedZone: srcZone };
        return s;
      }),
    }));

    // Persist swap transaction to DB
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'swap', staffId: sourceId, targetStaffId: targetId })
      });
    } catch (err) {
      console.error('[StaffStore] Failed to persist swap to DB:', err);
    }
  },

  cancelSwap: () => set({ swapSourceId: null }),
}));

// ─── Derived utilities ────────────────────────────────────────────────────────

export function getZoneStatus(zone: AssignmentZone, staff: StaffMember[]): 'ok' | 'warn' | 'critical' {
  const count = staff.filter((s) => s.assignedZone === zone && s.status !== 'unavailable').length;
  const cfg   = ZONE_CONFIGS.find((z) => z.zone === zone)!;
  if (count < cfg.minStaff)     return 'critical';
  if (count < cfg.optimalStaff) return 'warn';
  return 'ok';
}

export function getZoneCount(zone: AssignmentZone, staff: StaffMember[]): number {
  return staff.filter((s) => s.assignedZone === zone && s.status !== 'unavailable').length;
}
