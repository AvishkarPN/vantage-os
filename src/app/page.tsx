"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Activity, Users, AlertTriangle, Radio, Cpu, ShieldAlert,
  CheckCircle2, GitMerge, ServerCrash, ChevronDown, ChevronUp,
  Zap, ArrowRight, Clock, TrendingDown, Package
} from "lucide-react";
import {
  useSimulationStore,
  type Room, type Alert, type LogLine,
  type MitigationPhase, type MitigationResult,
} from "@/store/simulationStore";
import { useResourceStore } from "@/store/resourceStore";
import { useAuthStore } from "@/store/v2/authStore";
import { Lock, ShieldCheck, User as UserIcon, LogOut } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_PIPELINE: MitigationPhase[] = [
  'DETECTED', 'ANALYZING', 'RECOMMENDING',
  'EXECUTING', 'REDISTRIBUTING', 'STABILIZING', 'MONITORING',
];

const PHASE_LABELS: Record<MitigationPhase, string> = {
  IDLE:          'IDLE',
  DETECTED:      'DETECTED',
  ANALYZING:     'ANALYZING',
  RECOMMENDING:  'RECOMMEND',
  EXECUTING:     'EXECUTING',
  REDISTRIBUTING:'REDISTRIB',
  STABILIZING:   'STABILIZE',
  MONITORING:    'MONITOR',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  unit?: string;
  status?: string;
  flash?: boolean;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ title, value, icon: Icon, unit = "", status = "NOMINAL", flash = false }: MetricCardProps) {
  const isCritical = status === "CRITICAL" || status === "DEGRADED";
  return (
    <div className={[
      "p-4 border flex flex-col justify-between bg-card transition-all duration-700 panel-enter",
      isCritical ? "border-destructive critical-pulse" : "border-white/5",
      flash ? "success-flash" : "",
    ].join(" ")}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest">{title}</span>
        <Icon className={`w-4 h-4 ${isCritical ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-mono text-foreground tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-xs font-mono text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

// ─── PhasePipeline ────────────────────────────────────────────────────────────

function PhasePipeline({ current }: { current: MitigationPhase }) {
  const currentIdx = PHASE_PIPELINE.indexOf(current);
  return (
    <div className="flex items-center gap-0 mt-3 mb-1 overflow-x-auto pb-1">
      {PHASE_PIPELINE.map((phase, i) => {
        const done   = i <  currentIdx;
        const active = i === currentIdx;
        return (
          <div key={phase} className="flex items-center shrink-0">
            <div className={[
              "flex flex-col items-center gap-0.5",
            ].join("")}>
              <div className={[
                "w-2 h-2 border",
                done   ? "bg-primary border-primary" :
                active ? "bg-destructive border-destructive animate-pulse" :
                         "bg-transparent border-white/20",
              ].join(" ")} />
              <span className={[
                "text-[8px] font-mono uppercase",
                done   ? "text-primary" :
                active ? "text-destructive" :
                         "text-white/20",
              ].join(" ")}>{PHASE_LABELS[phase]}</span>
            </div>
            {i < PHASE_PIPELINE.length - 1 && (
              <div className={`w-5 h-px mb-3 ${done ? "bg-primary/50" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── RedistributionSummary ────────────────────────────────────────────────────

function RedistributionSummaryCard({ phase, result }: { phase: MitigationPhase; result: MitigationResult | null }) {
  const showRedistrib = ['REDISTRIBUTING', 'STABILIZING', 'MONITORING'].includes(phase);
  if (!showRedistrib) return null;

  const r = result?.redistribution;
  const rows = r ? [
    { label: 'Moved → Hall A',        value: `${r.movedToHallA} attendees`,   color: 'text-primary' },
    { label: 'Moved → Expo Floor',    value: `${r.movedToExpo} attendees`,    color: 'text-primary' },
    { label: 'Moved → Main Stage',    value: `${r.movedToMainStage} attendees`, color: 'text-primary' },
    { label: 'Held in queue',         value: `${r.heldInQueue} attendees`,    color: 'text-warning' },
    { label: 'Awaiting slot release', value: `${r.awaitingSlot} pending`,     color: 'text-warning' },
    { label: 'Staff reassigned',      value: `${r.staffReassigned} ushers`,   color: 'text-muted-foreground' },
    { label: 'Notifications sent',    value: `${r.notificationsSent} via app`, color: 'text-muted-foreground' },
  ] : [
    { label: 'Routing 46 → Hall A',     value: 'in progress…', color: 'text-warning' },
    { label: 'Routing 28 → Expo Floor', value: 'in progress…', color: 'text-warning' },
    { label: '19 in holding queue',     value: 'draining…',    color: 'text-warning' },
  ];

  return (
    <div className="mt-3 border border-white/5 bg-[#0d1117] p-3 alert-enter">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
        <ArrowRight className="w-3 h-3 text-primary" />
        Redistribution Map
      </p>
      <div className="space-y-1.5">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
            <span className={`text-[10px] font-mono font-bold ${color} tabular-nums`}>{value}</span>
          </div>
        ))}
      </div>
      {r && (
        <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-mono text-muted-foreground">Risk change</span>
          <span className="text-[10px] font-mono flex items-center gap-1">
            <span className="text-destructive">{r.riskBefore}%</span>
            <TrendingDown className="w-3 h-3 text-primary" />
            <span className="text-primary font-bold">{r.riskAfter}%</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── MitigationResultPanel ────────────────────────────────────────────────────

function MitigationResultPanel({ result }: { result: MitigationResult }) {
  const r = result.redistribution;
  return (
    <div className="border border-primary/20 bg-primary/5 p-4 alert-enter">
      <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3" />
        Mitigation Report
      </p>
      <div className="space-y-1.5 mb-3">
        <Row label="Issue"       value={result.issue} />
        <Row label="Cause"       value={result.cause} />
        <Row label="Action"      value={result.actionTaken} />
      </div>
      <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2">
        <StatBox label="Moved" value={`${r.movedToHallA + r.movedToExpo + r.movedToMainStage}`} color="text-primary" />
        <StatBox label="Queued" value={String(r.heldInQueue)} color="text-warning" />
        <StatBox label="Staff" value={`${r.staffReassigned} redeployed`} color="text-muted-foreground" />
        <StatBox label="Time" value={r.timeToStabilize} color="text-muted-foreground" />
        <StatBox label="Risk Before" value={`${r.riskBefore}%`} color="text-destructive" />
        <StatBox label="Risk After" value={`${r.riskAfter}%`} color="text-primary" />
      </div>
      <div className="border-t border-white/5 pt-3 mt-2">
        <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Final Occupancy by Zone</p>
        {Object.values(result.finalOccupancyByZone).map(({ name, pct }) => (
          <div key={name} className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-muted-foreground w-24 shrink-0">{name}</span>
            <div className="flex-1 bg-background h-1">
              <div
                className={`h-full transition-all duration-700 ${pct > 80 ? 'bg-destructive' : pct > 60 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-foreground tabular-nums w-8 text-right">{pct}%</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-2">
        Stabilized {format(result.stabilizedAt, 'HH:mm:ss')}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9px] font-mono text-muted-foreground uppercase block">{label}</span>
      <span className="text-[10px] font-sans text-foreground/90 leading-snug">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-background p-2">
      <p className="text-[9px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className={`text-xs font-mono font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

// ─── MitigationButton ─────────────────────────────────────────────────────────

function MitigationButton({ phase, onBegin }: { phase: MitigationPhase; onBegin: () => void }) {
  if (!['RECOMMENDING', 'EXECUTING', 'REDISTRIBUTING', 'STABILIZING', 'MONITORING'].includes(phase)) return null;
  if (phase === 'MONITORING') return null;

  const isReady    = phase === 'RECOMMENDING';
  const isActive   = ['EXECUTING', 'REDISTRIBUTING', 'STABILIZING'].includes(phase);

  const label = phase === 'RECOMMENDING'   ? 'AUTO-MITIGATE: SWAP SESSIONS' :
                phase === 'EXECUTING'      ? 'EXECUTING MITIGATION' :
                phase === 'REDISTRIBUTING' ? 'REDISTRIBUTING ATTENDEES…' :
                                             'STABILIZING SYSTEM…';

  const cls = isReady
    ? "bg-destructive text-destructive-foreground border-destructive tactical-glow cursor-pointer hover:bg-destructive/90"
    : "bg-destructive/40 text-destructive-foreground/70 border-destructive/30 cursor-not-allowed processing-sweep";

  return (
    <button
      disabled={!isReady}
      onClick={isReady ? onBegin : undefined}
      className={[
        "mt-3 w-full font-sans font-semibold text-[11px] px-4 py-3 uppercase tracking-widest border",
        "flex justify-center items-center gap-2 transition-all duration-300",
        cls,
      ].join(" ")}
    >
      {isActive ? (
        <>
          <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse [animation-delay:0.2s]" />
          <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse [animation-delay:0.4s]" />
          <span className="ml-1">{label}</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ─── AlertRow ─────────────────────────────────────────────────────────────────

function AlertRow({
  alert, mitigationPhase, mitigationResult, onBeginMitigation,
}: {
  alert: Alert;
  mitigationPhase: MitigationPhase;
  mitigationResult: MitigationResult | null;
  onBeginMitigation: () => void;
}) {
  const isCritical = alert.severity === 'CRITICAL';
  const isResolved = alert.severity === 'RESOLVED';

  const borderLeft = isCritical ? 'border-l-4 border-l-destructive'
    : isResolved ? 'border-l-4 border-l-primary'
    : 'border-l border-l-white/5';
  const bg = isCritical ? 'bg-destructive/5' : isResolved ? 'bg-primary/5' : 'bg-card';

  // Phase badge replaces static CRITICAL label on active critical alert
  const showPipeline = isCritical && mitigationPhase !== 'IDLE';

  return (
    <div className={`p-4 border border-white/5 text-sm alert-enter ${borderLeft} ${bg}`}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {isCritical  && <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />}
          {isResolved  && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
          {!isCritical && !isResolved && <Activity className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span className={`text-[10px] font-mono uppercase ${isCritical ? 'text-destructive' : 'text-muted-foreground'}`}>
            {format(alert.timestamp, 'HH:mm:ss')}
          </span>
        </div>
        <span className={[
          "text-[9px] font-mono border px-1 py-0.5 uppercase",
          showPipeline
            ? mitigationPhase === 'MONITORING'
              ? 'border-primary text-primary'
              : 'border-warning text-warning animate-pulse'
            : isCritical
              ? 'border-destructive/50 text-destructive'
              : 'border-white/10 text-muted-foreground',
        ].join(" ")}>
          {showPipeline ? PHASE_LABELS[mitigationPhase] : alert.severity}
        </span>
      </div>

      {showPipeline && <PhasePipeline current={mitigationPhase} />}

      <p className="font-sans text-foreground/90 leading-relaxed text-xs mt-2">
        {alert.message}
      </p>

      {alert.predictedImpact && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <GitMerge className="w-3 h-3 text-warning shrink-0" />
          <span className="text-[10px] font-mono text-warning uppercase">{alert.predictedImpact}</span>
        </div>
      )}

      {alert.mitigationAction && (
        <>
          <RedistributionSummaryCard phase={mitigationPhase} result={mitigationResult} />
          <MitigationButton phase={mitigationPhase} onBegin={onBeginMitigation} />
        </>
      )}
    </div>
  );
}

// ─── HeatmapBlock ─────────────────────────────────────────────────────────────

function HeatmapBlock({
  room, isExpanded, onToggle, isMigrating,
}: {
  room: Room;
  isExpanded: boolean;
  onToggle: () => void;
  isMigrating: boolean;
}) {
  const pct = Math.min(Math.round((room.currentOccupancy / room.capacity) * 100), 100);

  const bg =
    room.status === 'CRITICAL' ? 'bg-destructive/20' :
    room.status === 'WARNING'  ? 'bg-warning/10' :
    pct > 55 ? 'bg-primary/5' : 'bg-card';

  const borderCls =
    room.status === 'CRITICAL' ? 'border-destructive critical-pulse' :
    room.status === 'WARNING'  ? 'border-warning/60' :
    'border-white/5';

  const barCls =
    room.status === 'CRITICAL' ? 'bg-destructive' :
    room.status === 'WARNING'  ? 'bg-warning' :
    'bg-primary';

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className={[
          "relative p-4 border flex flex-col justify-between h-44",
          "transition-all duration-500 text-left w-full hover:brightness-110",
          bg, borderCls,
        ].join(" ")}
      >
        {/* MIGRATING overlay for Hall B */}
        {isMigrating && room.id === 'R3' && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30 z-10">
            <span className="font-mono text-sm text-destructive-foreground blink tracking-widest">
              ● MIGRATING…
            </span>
          </div>
        )}

        <div className="flex justify-between items-start">
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            {room.name}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 border bg-background ${borderCls}`}>
              {pct}%
            </span>
            {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground border-b border-white/5 pb-1">
            <span>OCCUPANCY</span>
            <span className="tabular-nums">{room.currentOccupancy} / {room.capacity}</span>
          </div>
          <div className="w-full bg-background h-1.5 overflow-hidden">
            <div className={`h-full transition-all duration-700 ${barCls}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
            <span>{room.staffAssigned} staff</span>
            <span>{room.sessionCount} sessions</span>
          </div>
        </div>
      </button>

      {/* EXPANDED DETAIL */}
      {isExpanded && (
        <div className="border border-t-0 border-white/5 bg-[#0d1117] p-4 panel-enter">
          {/* Crowd state */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Status</p>
              <p className={`text-xs font-mono font-bold ${room.status === 'CRITICAL' ? 'text-destructive' : room.status === 'WARNING' ? 'text-warning' : 'text-primary'}`}>
                {room.status}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Capacity</p>
              <p className="text-xs font-mono text-foreground">{room.capacity}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Staff</p>
              <p className="text-xs font-mono text-foreground">{room.staffAssigned}</p>
            </div>
          </div>

          {/* Crowd state rows */}
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Crowd State</p>
          <div className="space-y-1 mb-4">
            <CrowdRow label="Seated / Active" value={room.currentOccupancy} color="text-foreground" />
            {room.queueLength > 0 && <CrowdRow label="In Queue" value={room.queueLength} color="text-warning" />}
            {room.waitingExternal > 0 && <CrowdRow label="Waiting Outside" value={room.waitingExternal} color="text-warning" />}
            {room.rerouted > 0 && <CrowdRow label="Rerouted" value={room.rerouted} color="text-primary" />}
          </div>

          {/* Sparkline */}
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Occupancy Trend</p>
          <div className="flex items-end gap-px h-8 w-full">
            {room.history.slice(-12).map((snap, i) => {
              const h = Math.max(3, Math.round((snap.value / room.capacity) * 32));
              const isLast = i === room.history.slice(-12).length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 transition-all duration-300 ${
                    room.status === 'CRITICAL' ? 'bg-destructive/70' :
                    room.status === 'WARNING' ? 'bg-warning/60' :
                    isLast ? 'bg-primary' : 'bg-primary/40'
                  }`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CrowdRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

// ─── TerminalLog ──────────────────────────────────────────────────────────────

function TerminalLog({ lines }: { lines: LogLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const color = (type: LogLine["type"]) => {
    if (type === "AI")   return "text-primary/70";
    if (type === "WARN") return "text-warning/80";
    if (type === "OK")   return "text-green-400/80";
    return "text-muted-foreground/50";
  };

  const prefix = (type: LogLine["type"]) => {
    if (type === "AI")   return "[AI]";
    if (type === "WARN") return "[!!]";
    if (type === "OK")   return "[OK]";
    return "[OS]";
  };

  return (
    <div className="h-44 border-t border-white/5 bg-[#070a10] p-3 overflow-y-auto flex flex-col-reverse font-mono text-[9.5px] leading-[1.8] shrink-0">
      <div ref={bottomRef} />
      {lines.map((line) => (
        <div key={line.id} className={color(line.type)}>
          <span className="text-white/15 mr-2 select-none tabular-nums">
            {format(new Date(line.timestamp), "HH:mm:ss")}
          </span>
          <span className="mr-1 text-white/30">{prefix(line.type)}</span>
          {line.text}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function TacticalNocDashboard() {
  const {
    totalAttendance, checkInVelocity, activeSessions, systemStatus,
    rooms, alerts, logLines, mitigationPhase, mitigationResult,
    tickSimulation, triggerCriticalSurge,
    advanceToAnalyzing, advanceToRecommending, beginMitigation,
    advanceToRedistributing, advanceToStabilizing, advanceToMonitoring,
  } = useSimulationStore();
  
  const { 
    isAuthenticated, userRole, userName, login, logout, 
    canExecuteAction, logSecurityAction 
  } = useAuthStore();

  const [mounted, setMounted]       = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [velocityFlash, setVelocityFlash] = useState(false);

  // Flash KPIs when resolved
  useEffect(() => {
    if (mitigationPhase === 'MONITORING') {
      setVelocityFlash(true);
      const t = setTimeout(() => setVelocityFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [mitigationPhase]);

  // Clock
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 500);
    return () => clearInterval(id);
  }, []);

  // Simulation tick
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(tickSimulation, 1500);
    return () => clearInterval(id);
  }, [mounted, tickSimulation]);

  // Crisis at T+10s
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(triggerCriticalSurge, 10000);
    return () => clearTimeout(t);
  }, [mounted, triggerCriticalSurge]);

  // ── Auto-phase advancement (deterministic single-timeout per phase) ────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;

    if (mitigationPhase === 'DETECTED')       t = setTimeout(advanceToAnalyzing,     2000);
    if (mitigationPhase === 'ANALYZING')      t = setTimeout(advanceToRecommending,  1500);
    if (mitigationPhase === 'EXECUTING')      t = setTimeout(advanceToRedistributing, 1500);
    if (mitigationPhase === 'REDISTRIBUTING') t = setTimeout(advanceToStabilizing,   2000);
    if (mitigationPhase === 'STABILIZING')    t = setTimeout(advanceToMonitoring,    1500);

    return () => { if (t) clearTimeout(t); };
  }, [
    mitigationPhase,
    advanceToAnalyzing, advanceToRecommending,
    advanceToRedistributing, advanceToStabilizing, advanceToMonitoring,
  ]);

  // Trigger resource shift when redistribution begins
  useEffect(() => {
    if (mitigationPhase === 'REDISTRIBUTING') {
      useResourceStore.getState().triggerMitigationDemand();
    }
  }, [mitigationPhase]);

  const handleBeginMitigation = useCallback(() => {
    if (canExecuteAction()) {
      logSecurityAction(`MITIGATION_CLICKED: zone_target=HALL_B`, 'HIGH');
      beginMitigation();
    } else {
      console.warn('[SECURITY] Action blocked: insufficient permissions or rate limit.');
    }
  }, [beginMitigation, canExecuteAction, logSecurityAction]);

  const toggleRoom = useCallback((id: string) => {
    setExpandedRoom((prev) => (prev === id ? null : id));
  }, []);

  const isMigrating = mitigationPhase === 'REDISTRIBUTING';

  const sysIcon: LucideIcon =
    systemStatus === 'NOMINAL'  ? CheckCircle2 :
    systemStatus === 'DEGRADED' ? AlertTriangle : ServerCrash;

  const sysValue =
    systemStatus === 'NOMINAL'  ? '100%' :
    systemStatus === 'DEGRADED' ? 'WARN' : 'FAIL';

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm border border-white/10 bg-[#0d1117] p-8 space-y-6 panel-enter shadow-2xl">
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-sans uppercase tracking-[0.2em] font-bold">Access Restricted</h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">VantageOS // Security Layer v4.1</p>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => login('ADMIN')}
              className="w-full p-4 border border-white/10 hover:border-primary/50 bg-[#161B22] text-left transition-all group flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="text-xs font-sans font-bold group-hover:text-primary transition-colors uppercase tracking-widest">Master Operator</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase mt-1">Full Mitigation Clearance</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => login('OPERATOR')}
              className="w-full p-4 border border-white/10 hover:border-primary/50 bg-[#161B22] text-left transition-all group flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="text-xs font-sans font-bold group-hover:text-primary transition-colors uppercase tracking-widest">Tactical Staff</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase mt-1">Standard NOC Permissions</span>
              </div>
              <Activity className="w-4 h-4 text-warning opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest pt-2">
            Secure Session Required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ paddingLeft: '64px' }}>

      {/* ── ICON RAIL ────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-background flex flex-col items-center py-6 gap-7 z-50">
        <Link href="/">
          <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/80 transition-colors">
            <span className="font-mono font-bold text-background text-[9px] tracking-tight">VOS</span>
          </div>
        </Link>
        <nav className="flex flex-col items-center gap-6 flex-1 text-muted-foreground">
          <div className="relative w-full flex justify-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <Link href="/staff" className="opacity-30 hover:opacity-80 transition-opacity">
            <Users className="w-5 h-5" />
          </Link>
          <Link href="/resources" className="opacity-30 hover:opacity-80 transition-opacity">
            <Package className="w-5 h-5" />
          </Link>
          <Link href="/reports" className="opacity-30 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5" />
          </Link>
        </nav>
        <div className={`w-2 h-2 rounded-full shrink-0 ${systemStatus === 'NOMINAL' ? 'bg-primary' : 'bg-destructive animate-pulse'}`} />
      </aside>

      {/* ── MAIN STAGE ───────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">

        {/* CENTER */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 shrink-0">
            <div>
              <h1 className="text-base font-sans tracking-[0.2em] uppercase font-semibold text-foreground">
                Live Control Center
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
                VANTAGE_OS // CORE SECTOR //
                <span className={`ml-2 font-bold ${systemStatus === 'NOMINAL' ? 'text-primary' : 'text-destructive'}`}>
                  {systemStatus}
                </span>
                {mitigationPhase !== 'IDLE' && (
                  <span className="ml-3 text-warning">
                    ● {PHASE_LABELS[mitigationPhase]}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right flex items-center gap-6">
              <div className="flex flex-col items-end border-r border-white/5 pr-6">
                 <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="w-2.5 h-2.5" />
                  Operator: {userName}
                </span>
                <button 
                  onClick={logout}
                  className="text-[9px] font-mono text-destructive hover:text-destructive/80 uppercase mt-1 flex items-center gap-1"
                >
                  <LogOut className="w-2.5 h-2.5" />
                  [ TERMINATE_SESS ]
                </button>
              </div>
              <div>
                <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest block mb-1">
                  SYNCED — UTC+5:30
                </span>
                {currentTime && (
                  <span className="text-sm font-mono text-primary flex items-center justify-end gap-2">
                    <span className="w-1.5 h-1.5 bg-primary animate-pulse shrink-0" />
                    {format(currentTime, 'HH:mm:ss')}
                    <span className="text-muted-foreground text-[10px]">
                      .{String(currentTime.getMilliseconds()).padStart(3, '0').slice(0, 2)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPI STRIP */}
            <div className="grid grid-cols-4 gap-3">
              <MetricCard title="Total Checked-In" value={totalAttendance} icon={Users} />
              <MetricCard
                title="Check-in Velocity"
                value={checkInVelocity}
                unit="p/min"
                icon={Activity}
                status={systemStatus === 'DEGRADED' ? 'DEGRADED' : 'NOMINAL'}
                flash={velocityFlash}
              />
              <MetricCard title="Active Nodes" value={activeSessions} icon={Cpu} />
              <MetricCard title="System Status" value={sysValue} icon={sysIcon} status={systemStatus} />
            </div>

            {/* HEATMAP */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
                  Venue Floorplan Topology
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Click sector for crowd detail
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <HeatmapBlock
                    key={room.id}
                    room={room}
                    isExpanded={expandedRoom === room.id}
                    onToggle={() => toggleRoom(room.id)}
                    isMigrating={isMigrating}
                  />
                ))}
              </div>
            </div>

            {/* Phase timeline when active — center panel footer */}
            {mitigationPhase !== 'IDLE' && mitigationPhase !== 'MONITORING' && (
              <div className="border border-warning/20 bg-warning/5 p-4 panel-enter">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-warning" />
                  <span className="text-[10px] font-mono text-warning uppercase tracking-widest">
                    Mitigation in Progress
                  </span>
                </div>
                <PhasePipeline current={mitigationPhase} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT RAIL ───────────────────────────────────────────── */}
        <aside className="w-[400px] border-l border-white/5 flex flex-col overflow-hidden shrink-0">
          <div className="px-5 py-4 border-b border-white/5 bg-background shrink-0 flex items-center justify-between">
            <h2 className="text-[10px] font-sans tracking-widest uppercase flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-4 h-4 text-warning" />
              AI Threat Intelligence
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground border border-white/10 px-1.5 py-0.5">
              {alerts.length} EVENT{alerts.length !== 1 ? 'S' : ''}
            </span>
          </div>

          {/* Alert feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                mitigationPhase={mitigationPhase}
                mitigationResult={mitigationResult}
                onBeginMitigation={handleBeginMitigation}
              />
            ))}

            {/* Mitigation result panel — rendered after MONITORING fires */}
            {mitigationPhase === 'MONITORING' && mitigationResult && (
              <MitigationResultPanel result={mitigationResult} />
            )}
          </div>

          {/* Terminal log */}
          <TerminalLog lines={logLines} />
        </aside>

      </main>
    </div>
  );
}
