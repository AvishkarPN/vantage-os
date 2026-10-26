"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Users, Radio, Activity, ServerCrash,
  AlertTriangle, CheckCircle2, ArrowLeftRight,
  X, ChevronDown, Package
} from "lucide-react";
import {
  useStaffStore,
  ALL_ZONES, ZONE_CONFIGS,
  getZoneStatus, getZoneCount,
  type StaffMember, type StaffStatus, type AssignmentZone,
} from "@/store/staffStore";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StaffStatus, string> = {
  'active':      'text-primary border-primary/40 bg-primary/10',
  'assigned':    'text-primary border-primary/30 bg-primary/5',
  'checked-in':  'text-warning border-warning/40 bg-warning/10',
  'on-break':    'text-warning border-warning/30 bg-warning/5',
  'unassigned':  'text-muted-foreground border-white/10 bg-white/5',
  'unavailable': 'text-destructive border-destructive/30 bg-destructive/5',
};

const ALL_STATUSES: StaffStatus[] = [
  'active', 'assigned', 'checked-in', 'on-break', 'unassigned', 'unavailable',
];

// ─── Zone summary sidebar ─────────────────────────────────────────────────────

function ZoneSummary({ staff }: { staff: StaffMember[] }) {
  return (
    <aside className="w-64 border-l border-white/5 flex flex-col overflow-hidden shrink-0">
      <div className="px-4 py-4 border-b border-white/5 bg-background shrink-0">
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-foreground flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-warning" />
          Zone Coverage
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {ZONE_CONFIGS.map(({ zone, minStaff, optimalStaff }) => {
          const count  = getZoneCount(zone, staff);
          const status = getZoneStatus(zone, staff);
          const pct    = Math.min(Math.round((count / optimalStaff) * 100), 100);

          const badge =
            status === 'critical' ? 'text-destructive border-destructive/40' :
            status === 'warn'     ? 'text-warning border-warning/40' :
            'text-primary border-primary/30';

          const bar =
            status === 'critical' ? 'bg-destructive' :
            status === 'warn'     ? 'bg-warning' : 'bg-primary';

          return (
            <div key={zone} className="border border-white/5 bg-card p-3">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[10px] font-mono text-foreground uppercase tracking-wide">{zone}</span>
                <span className={`text-[9px] font-mono border px-1 py-0.5 ${badge}`}>
                  {count}/{optimalStaff}
                </span>
              </div>
              <div className="w-full bg-background h-1 mb-1.5">
                <div className={`h-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                <span>min {minStaff}</span>
                <span>
                  {status === 'critical' ? '⚠ UNDERSTAFFED' :
                   status === 'warn'     ? '△ BELOW OPTIMAL' :
                                           '✓ COVERED'}
                </span>
              </div>
            </div>
          );
        })}

        {/* Unassigned summary */}
        <div className="border border-white/5 bg-card p-3 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Unassigned</span>
            <span className="text-[10px] font-mono font-bold text-warning">
              {staff.filter(s => !s.assignedZone && s.status !== 'unavailable').length}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Unavailable</span>
            <span className="text-[10px] font-mono font-bold text-destructive">
              {staff.filter(s => s.status === 'unavailable').length}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">On Break</span>
            <span className="text-[10px] font-mono font-bold text-warning">
              {staff.filter(s => s.status === 'on-break').length}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Total Staff</span>
            <span className="text-[10px] font-mono font-bold text-foreground">
              {staff.length}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Staff row ────────────────────────────────────────────────────────────────

function StaffRow({
  member, swapSourceId, onAssign, onUnassign, onStatus, onSwap,
}: {
  member: StaffMember;
  swapSourceId: string | null;
  onAssign: (zone: AssignmentZone | null) => void;
  onUnassign: () => void;
  onStatus: (status: StaffStatus) => void;
  onSwap: () => void;
}) {
  const isSwapSource  = swapSourceId === member.id;
  const isSwapTarget  = swapSourceId !== null && swapSourceId !== member.id;
  const isUnavailable = member.status === 'unavailable';

  return (
    <div className={[
      "border p-3 flex items-center gap-3 transition-all duration-200",
      isSwapSource  ? "border-warning bg-warning/5"  :
      isSwapTarget  ? "border-primary/40 hover:border-primary cursor-pointer" :
      "border-white/5 bg-card",
    ].join(" ")}
      onClick={isSwapTarget ? onSwap : undefined}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 shrink-0 flex items-center justify-center text-[10px] font-mono font-bold border ${
        isSwapSource ? 'border-warning text-warning' : 'border-white/10 text-muted-foreground'
      }`}>
        {member.initials}
      </div>

      {/* Name + role */}
      <div className="min-w-0 w-36 shrink-0">
        <p className="text-xs font-sans text-foreground truncate">{member.name}</p>
        <p className="text-[9px] font-mono text-muted-foreground truncate">{member.role}</p>
      </div>

      {/* Skills */}
      <div className="flex gap-1 flex-wrap min-w-0 w-40 shrink-0">
        {member.skills.slice(0, 2).map((sk) => (
          <span key={sk} className="text-[8px] font-mono border border-white/10 px-1 py-0.5 text-muted-foreground uppercase whitespace-nowrap">
            {sk}
          </span>
        ))}
      </div>

      {/* Shift */}
      <div className="text-[9px] font-mono text-muted-foreground w-24 shrink-0 tabular-nums">
        {member.shiftStart}–{member.shiftEnd}
      </div>

      {/* Status badge + dropdown */}
      <div className="w-32 shrink-0 relative">
        <select
          value={member.status}
          onChange={(e) => onStatus(e.target.value as StaffStatus)}
          className={[
            "w-full text-[9px] font-mono uppercase border px-2 py-1 appearance-none bg-background cursor-pointer focus:outline-none",
            STATUS_COLORS[member.status],
          ].join(" ")}
          disabled={isUnavailable && member.status === 'unavailable'}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Zone assignment */}
      <div className="flex-1 min-w-0">
        <select
          value={member.assignedZone ?? ''}
          onChange={(e) => onAssign(e.target.value ? e.target.value as AssignmentZone : null)}
          disabled={isUnavailable}
          className="w-full text-[9px] font-mono uppercase border border-white/10 bg-background text-foreground px-2 py-1 appearance-none focus:outline-none focus:border-primary disabled:opacity-40 cursor-pointer"
        >
          <option value="">— UNASSIGNED —</option>
          {ALL_ZONES.map((z) => (
            <option key={z} value={z}>{z.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Unassign */}
        <button
          onClick={onUnassign}
          disabled={!member.assignedZone || isUnavailable}
          title="Unassign"
          className="w-6 h-6 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 disabled:opacity-20 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Swap */}
        <button
          onClick={(e) => { e.stopPropagation(); onSwap(); }}
          disabled={isUnavailable}
          title={isSwapSource ? 'Cancel Swap' : 'Initiate Swap'}
          className={[
            "w-6 h-6 border flex items-center justify-center transition-colors disabled:opacity-20",
            isSwapSource
              ? "border-warning text-warning"
              : "border-white/10 text-muted-foreground hover:text-warning hover:border-warning/40",
          ].join(" ")}
        >
          <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const {
    staff, swapSourceId, isLoading, isSynced,
    assignStaff, unassignStaff, setStaffStatus,
    initiateSwap, cancelSwap, fetchFromDatabase
  } = useStaffStore();

  useEffect(() => {
    fetchFromDatabase();
  }, [fetchFromDatabase]);

  const [filterStatus, setFilterStatus] = useState<StaffStatus | 'all'>('all');
  const [filterZone,   setFilterZone]   = useState<AssignmentZone | 'all'>('all');
  const [search,       setSearch]       = useState('');

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterZone   !== 'all' && s.assignedZone !== filterZone) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.role.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [staff, filterStatus, filterZone, search]);

  const shortageCount = ZONE_CONFIGS.filter(({ zone }) => getZoneStatus(zone, staff) === 'critical').length;

  return (
    <div className="h-screen flex overflow-hidden" style={{ paddingLeft: '64px' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-background flex flex-col items-center py-6 gap-7 z-50">
        <Link href="/">
          <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/80 transition-colors">
            <span className="font-mono font-bold text-background text-[9px] tracking-tight">VOS</span>
          </div>
        </Link>
        <nav className="flex flex-col items-center gap-6 flex-1 text-muted-foreground">
          <Link href="/" className="opacity-30 hover:opacity-80 transition-opacity">
            <Radio className="w-5 h-5" />
          </Link>
          {/* Users icon — active */}
          <div className="relative w-full flex justify-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
            <Users className="w-5 h-5 text-primary" />
          </div>
          <Link href="/resources" className="opacity-30 hover:opacity-80 transition-opacity">
            <Package className="w-5 h-5" />
          </Link>
          <Link href="/reports" className="opacity-30 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5" />
          </Link>
        </nav>
        {shortageCount > 0 && (
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" />
        )}
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 shrink-0">
            <div>
              <h1 className="text-base font-sans tracking-[0.2em] uppercase font-semibold text-foreground">
                Staff Allocation
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
                VANTAGE_OS // OPS MODULE //
                <span className="ml-2 text-foreground tabular-nums">{staff.length} PERSONNEL</span>
                {shortageCount > 0 && (
                  <span className="ml-3 text-destructive">⚠ {shortageCount} ZONE{shortageCount > 1 ? 'S' : ''} UNDERSTAFFED</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {swapSourceId && (
                <div className="flex items-center gap-2 border border-warning/40 bg-warning/5 px-3 py-1.5">
                  <ArrowLeftRight className="w-3 h-3 text-warning" />
                  <span className="text-[10px] font-mono text-warning uppercase">Swap mode — click target</span>
                  <button onClick={cancelSwap} className="text-muted-foreground hover:text-foreground ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-2.5 py-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-primary animate-pulse' : 'bg-warning'}`} />
                <span className="text-[9px] font-mono text-primary uppercase tracking-wider">
                  {isLoading ? 'SYNCING...' : isSynced ? 'DB PERSISTED' : 'LOCAL FALLBACK'}
                </span>
              </div>
              <Link href="/" className="text-[10px] font-mono text-muted-foreground border border-white/10 px-3 py-1.5 hover:border-primary hover:text-primary transition-colors uppercase tracking-widest">
                ← Control Center
              </Link>
            </div>
          </header>

          {/* Filters */}
          <div className="flex items-center gap-3 px-8 py-3 border-b border-white/5 shrink-0 bg-background">
            {/* Search */}
            <input
              type="text"
              placeholder="Search name / role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border border-white/10 text-foreground text-[10px] font-mono px-3 py-1.5 w-48 focus:outline-none focus:border-primary placeholder:text-muted-foreground uppercase"
            />

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StaffStatus | 'all')}
              className="bg-card border border-white/10 text-foreground text-[10px] font-mono px-2 py-1.5 focus:outline-none focus:border-primary appearance-none uppercase cursor-pointer"
            >
              <option value="all">ALL STATUSES</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>

            {/* Zone filter */}
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value as AssignmentZone | 'all')}
              className="bg-card border border-white/10 text-foreground text-[10px] font-mono px-2 py-1.5 focus:outline-none focus:border-primary appearance-none uppercase cursor-pointer"
            >
              <option value="all">ALL ZONES</option>
              {ALL_ZONES.map((z) => (
                <option key={z} value={z}>{z.toUpperCase()}</option>
              ))}
            </select>

            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              Showing {filtered.length} of {staff.length}
            </span>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-8 py-2 border-b border-white/5 shrink-0 bg-background">
            <div className="w-8 shrink-0" />
            <div className="w-36 shrink-0 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Name / Role</div>
            <div className="w-40 shrink-0 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Skills</div>
            <div className="w-24 shrink-0 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Shift</div>
            <div className="w-32 shrink-0 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Status</div>
            <div className="flex-1 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Zone Assignment</div>
            <div className="w-16 shrink-0 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Actions</div>
          </div>

          {/* Staff list */}
          <div className="flex-1 overflow-y-auto px-8 py-3 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[10px] font-mono text-muted-foreground uppercase">
                No staff match filters
              </div>
            ) : (
              filtered.map((member) => (
                <StaffRow
                  key={member.id}
                  member={member}
                  swapSourceId={swapSourceId}
                  onAssign={(zone) => assignStaff(member.id, zone)}
                  onUnassign={() => unassignStaff(member.id)}
                  onStatus={(status) => setStaffStatus(member.id, status)}
                  onSwap={() => initiateSwap(member.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Zone summary sidebar */}
        <ZoneSummary staff={staff} />
      </main>
    </div>
  );
}
