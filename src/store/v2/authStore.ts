import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ─── Security Schema ─────────────────────────────────────────────────────────

export type UserRole = 'OPERATOR' | 'ADMIN' | 'READ_ONLY';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  ipMetadata?: string;
  status: 'SUCCESS' | 'FAILURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AuthState {
  // Authentication
  isAuthenticated: boolean;
  userRole: UserRole;
  userName: string;
  sessionToken: string | null;
  
  // Security Logs
  auditLogs: AuditEntry[];
  
  // Rate Limiting (Client-side throttle state)
  lastActionTime: number;
  
  // Actions
  login: (role: UserRole) => void;
  logout: () => void;
  logSecurityAction: (action: string, severity?: AuditEntry['severity']) => void;
  canExecuteAction: () => boolean;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        isAuthenticated: false,
        userRole: 'READ_ONLY',
        userName: 'GUEST_OPERATOR',
        sessionToken: null,
        auditLogs: [],
        lastActionTime: 0,

        login: (role) => {
          const names = { 'ADMIN': 'root_admin', 'OPERATOR': 'op_alpha', 'READ_ONLY': 'guest_viewer' };
          set({ 
            isAuthenticated: true, 
            userRole: role, 
            userName: names[role],
            sessionToken: `v-os-tok-${Math.random().toString(36).substring(7)}`
          });
          get().logSecurityAction(`AUTH_LOGIN: ${role}`, 'LOW');
        },

        logout: () => {
          get().logSecurityAction('AUTH_LOGOUT', 'LOW');
          set({ isAuthenticated: false, userRole: 'READ_ONLY', sessionToken: null });
        },

        logSecurityAction: (action, severity = 'LOW') => {
          const entry: AuditEntry = {
            id: `AUD-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action,
            userId: get().userName,
            status: 'SUCCESS',
            severity
          };
          set((state) => ({ auditLogs: [entry, ...state.auditLogs].slice(0, 100) }));
        },

        canExecuteAction: () => {
          const now = Date.now();
          const { lastActionTime, userRole } = get();
          
          // Role Check
          if (userRole === 'READ_ONLY') {
            get().logSecurityAction('UNAUTHORIZED_ACTION_ATTEMPT', 'MEDIUM');
            return false;
          }

          // Simple Rate Limit (prevent rapid spamming)
          if (now - lastActionTime < 500) { // 500ms throttle
            get().logSecurityAction('RATE_LIMIT_TRIGGERED', 'LOW');
            return false;
          }

          set({ lastActionTime: now });
          return true;
        }
      }),
      { name: 'v-os-auth-seal' }
    )
  )
);
