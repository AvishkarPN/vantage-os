import { create } from 'zustand';
import type { AssignmentZone } from './staffStore';

export type ResourceCategory =
  | 'Barriers'
  | 'Scanners'
  | 'Radios'
  | 'Signage'
  | 'Chairs'
  | 'Water Stations'
  | 'Medical Kits'
  | 'Security Equipment'
  | 'Registration Desks'
  | 'AV Equipment';

export type ResourcePriority = 'critical' | 'high' | 'normal';
export type SetupStatus      = 'pending' | 'in-progress' | 'ready';

export interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  required: number;
  allocated: number;
  zone: AssignmentZone | 'Global';
  priority: ResourcePriority;
  vendor: string;
  setupStatus: SetupStatus;
}

const SEED_RESOURCES: ResourceItem[] = [
  { id: 'R01', name: 'Crowd Control Barriers', category: 'Barriers', required: 150, allocated: 120, zone: 'Gate 1-4', priority: 'critical', vendor: 'EventGuard Inc.', setupStatus: 'ready' },
  { id: 'R02', name: 'Handheld Scanners', category: 'Scanners', required: 24, allocated: 20, zone: 'Gate 5-8', priority: 'critical', vendor: 'TechRentals', setupStatus: 'ready' },
  { id: 'R03', name: 'Two-Way Radios (UHF)', category: 'Radios', required: 45, allocated: 45, zone: 'Global', priority: 'high', vendor: 'CommSys', setupStatus: 'ready' },
  { id: 'R04', name: 'Wayfinding Signage', category: 'Signage', required: 30, allocated: 30, zone: 'Hall B', priority: 'normal', vendor: 'PrintWorks', setupStatus: 'in-progress' },
  { id: 'R05', name: 'Folding Chairs', category: 'Chairs', required: 2000, allocated: 1500, zone: 'Main Stage', priority: 'normal', vendor: 'EventSeats', setupStatus: 'in-progress' },
  { id: 'R06', name: 'Hydration Stations', category: 'Water Stations', required: 12, allocated: 10, zone: 'Expo Floor', priority: 'high', vendor: 'AquaLife', setupStatus: 'pending' },
  { id: 'R07', name: 'Trauma Kits', category: 'Medical Kits', required: 5, allocated: 5, zone: 'Control Desk', priority: 'critical', vendor: 'MedSupply', setupStatus: 'ready' },
  { id: 'R08', name: 'Metal Detectors', category: 'Security Equipment', required: 8, allocated: 8, zone: 'Gate 1-4', priority: 'critical', vendor: 'SecureScan', setupStatus: 'ready' },
  { id: 'R09', name: 'Check-in Kiosks', category: 'Registration Desks', required: 16, allocated: 14, zone: 'Gate 5-8', priority: 'high', vendor: 'RegTech', setupStatus: 'pending' },
  { id: 'R10', name: 'LED Video Walls', category: 'AV Equipment', required: 4, allocated: 4, zone: 'Hall A', priority: 'high', vendor: 'VisuaLab', setupStatus: 'ready' },
  { id: 'R11', name: 'Queue Stanchions', category: 'Barriers', required: 80, allocated: 50, zone: 'Queue Management', priority: 'critical', vendor: 'EventGuard Inc.', setupStatus: 'in-progress' },
  { id: 'R12', name: 'Defibrillator (AED)', category: 'Medical Kits', required: 3, allocated: 2, zone: 'Main Stage', priority: 'critical', vendor: 'MedSupply', setupStatus: 'pending' },
];

interface ResourceState {
  resources: ResourceItem[];
  isLoading: boolean;
  isSynced: boolean;
  fetchFromDatabase: () => Promise<void>;
  allocateResource: (id: string, amount: number) => Promise<void>;
  updateSetupStatus: (id: string, status: SetupStatus) => Promise<void>;
  // Triggered by mitigation to simulate resource redistribution needs
  triggerMitigationDemand: () => void;
}

export const useResourceStore = create<ResourceState>((set) => ({
  resources: SEED_RESOURCES,
  isLoading: false,
  isSynced: false,

  fetchFromDatabase: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/resources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.resources) && data.resources.length > 0) {
          const mapped: ResourceItem[] = data.resources.map((r: any) => ({
            id: r.id,
            name: r.name,
            category: r.category as ResourceCategory,
            required: r.required,
            allocated: r.allocated,
            zone: (r.zoneName || 'Global') as AssignmentZone | 'Global',
            priority: r.priority as ResourcePriority,
            vendor: r.vendor,
            setupStatus: r.setupStatus as SetupStatus,
          }));
          set({ resources: mapped, isSynced: true });
        }
      }
    } catch (err) {
      console.warn('[ResourceStore] DB fetch fallback to local seed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  allocateResource: async (id, amount) => {
    // 1. Optimistic update
    set((state) => ({
      resources: state.resources.map(r =>
        r.id === id ? { ...r, allocated: Math.min(r.required, r.allocated + amount) } : r
      )
    }));

    // 2. Persist to DB
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', resourceId: id, amount })
      });
    } catch (err) {
      console.error('[ResourceStore] Failed to persist allocation to DB:', err);
    }
  },

  updateSetupStatus: async (id, status) => {
    set((state) => ({
      resources: state.resources.map(r =>
        r.id === id ? { ...r, setupStatus: status } : r
      )
    }));

    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setupStatus', resourceId: id, setupStatus: status })
      });
    } catch (err) {
      console.error('[ResourceStore] Failed to persist setup status to DB:', err);
    }
  },

  triggerMitigationDemand: () => {
    set((state) => {
      // Simulate resource constraint shift: higher demand for queue barriers, scanners, etc.
      return {
        resources: state.resources.map(r => {
          if (r.category === 'Barriers') return { ...r, required: r.required + 40, priority: 'critical' };
          if (r.category === 'Scanners') return { ...r, required: r.required + 10, priority: 'critical' };
          if (r.category === 'Water Stations') return { ...r, required: r.required + 5, priority: 'high' };
          return r;
        })
      };
    });
  }
}));
