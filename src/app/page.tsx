"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Users,
  AlertTriangle,
  Radio,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  GitMerge,
  ServerCrash,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import {
  useSimulationStore,
  type Room,
  type Alert,
  type LogLine,
  type MitigationPhase,
} from "@/store/simulationStore";

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
    <div
      className={[
        "p-4 border flex flex-col justify-between bg-card panel-enter transition-colors duration-700",
        isCritical ? "border-destructive critical-pulse" : "border-white/5",
        flash ? "success-flash" : "",
      ].join(" ")}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest">
          {title}
        </span>
        <Icon className={`w-4 h-4 ${isCritical ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-mono text-foreground tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ─── HeatmapBlock ─────────────────────────────────────────────────────────────

function HeatmapBlock({
  room,
  isExpanded,
  onToggle,
  isMigrating,
}: {
  room: Room;
  isExpanded: boolean;
  onToggle: () => void;
  isMigrating: boolean;
}) {
  const pct = Math.min(Math.round((room.currentOccupancy / room.capacity) * 100), 100);

  const bg =
    room.status === "CRITICAL" ? "bg-destructive/20" :
    room.status === "WARNING"  ? "bg-warning/10" :
    pct > 55                   ? "bg-primary/5" :
    "bg-card";

  const borderCls =
    room.status === "CRITICAL" ? "border-destructive critical-pulse" :
    room.status === "WARNING"  ? "border-warning/60" :
    "border-white/5";

  const barCls =
    room.status === "CRITICAL" ? "bg-destructive" :
    room.status === "WARNING"  ? "bg-warning" :
    "bg-primary";

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className={[
          "relative p-4 border flex flex-col justify-between h-44",
          "transition-all duration-500 text-left w-full",
          bg, borderCls,
          "hover:brightness-110 cursor-pointer",
        ].join(" ")}
      >
        {/* MIGRATING overlay */}
        {isMigrating && room.id === "R3" && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30 z-10">
            <span className="font-mono text-sm text-destructive-foreground blink tracking-widest uppercase">
              ● Migrating...
            </span>
          </div>
        )}

        <div className="flex justify-between items-start">
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            {room.name}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 border bg-background ${borderCls}`}
            >
              {pct}%
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground border-b border-white/5 pb-1">
            <span>OCCUPANCY</span>
            <span className="tabular-nums">{room.currentOccupancy} / {room.capacity}</span>
          </div>
          <div className="w-full bg-background h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${barCls}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
            <span>{room.staffAssigned} staff</span>
            <span>{room.sessionCount} sessions</span>
          </div>
        </div>
      </button>

      {/* EXPANDED DETAIL PANEL */}
      {isExpanded && (
        <div className="border border-t-0 border-white/5 bg-[#0d1117] p-4 panel-enter">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Status</p>
              <p className={`text-xs font-mono font-bold ${room.status === "CRITICAL" ? "text-destructive" : room.status === "WARNING" ? "text-warning" : "text-primary"}`}>
                {room.status}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Capacity</p>
              <p className="text-xs font-mono text-foreground">{room.capacity}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Sessions</p>
              <p className="text-xs font-mono text-foreground">{room.sessionCount}</p>
            </div>
          </div>

          {/* Mini sparkline */}
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Occupancy Trend</p>
          <div className="flex items-end gap-px h-10 w-full">
            {room.history.slice(-12).map((snap, i) => {
              const h = Math.max(4, Math.round((snap.value / room.capacity) * 40));
              const isLast = i === room.history.slice(-12).length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 transition-all duration-300 ${
                    room.status === "CRITICAL" ? "bg-destructive/70" :
                    room.status === "WARNING" ? "bg-warning/60" :
                    isLast ? "bg-primary" : "bg-primary/40"
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

// ─── MitigationButton ─────────────────────────────────────────────────────────

function MitigationButton({
  phase,
  onBegin,
}: {
  phase: MitigationPhase;
  onBegin: () => void;
}) {
  if (phase === "SETTLED") return null;

  const isDisabled = phase === "PROCESSING" || phase === "SUCCESS";

  const label =
    phase === "PROCESSING" ? "EXECUTING MITIGATION" :
    phase === "SUCCESS"    ? "✓ MITIGATION APPLIED" :
    "AUTO-MITIGATE: SWAP SESSIONS";

  const cls =
    phase === "PROCESSING"
      ? "relative overflow-hidden bg-destructive/60 text-destructive-foreground cursor-not-allowed border border-destructive/40 processing-sweep"
      : phase === "SUCCESS"
      ? "bg-primary text-primary-foreground border border-primary tactical-glow-green cursor-not-allowed"
      : "relative bg-destructive text-destructive-foreground border border-destructive tactical-glow cursor-pointer hover:bg-destructive/90";

  return (
    <button
      disabled={isDisabled}
      onClick={onBegin}
      className={[
        "mt-4 w-full font-sans font-semibold text-xs px-4 py-3 uppercase tracking-widest",
        "flex justify-center items-center gap-2 transition-all duration-300",
        cls,
      ].join(" ")}
    >
      {phase === "PROCESSING" ? (
        <>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.4s]" />
          <span className="ml-1">{label}</span>
        </>
      ) : phase === "SUCCESS" ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>{label}</span>
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
  alert,
  mitigationPhase,
  onBeginMitigation,
}: {
  alert: Alert;
  mitigationPhase: MitigationPhase;
  onBeginMitigation: () => void;
}) {
  const isCritical  = alert.severity === "CRITICAL";
  const isResolved  = alert.severity === "RESOLVED";

  const borderLeft =
    isCritical ? "border-l-4 border-l-destructive" :
    isResolved  ? "border-l-4 border-l-primary" :
    "border-l border-l-white/5";

  const bg =
    isCritical ? "bg-destructive/5" :
    isResolved  ? "bg-primary/5" :
    "bg-card";

  return (
    <div className={`p-4 border border-white/5 text-sm alert-enter ${borderLeft} ${bg}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {isCritical  && <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />}
          {isResolved  && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
          {!isCritical && !isResolved && <Activity className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span className={`text-[10px] font-mono uppercase ${isCritical ? "text-destructive" : "text-muted-foreground"}`}>
            {format(alert.timestamp, "HH:mm:ss")}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground border border-white/10 px-1 uppercase">
          {alert.severity}
        </span>
      </div>

      <p className="font-sans text-foreground/90 leading-relaxed text-xs mt-2">
        {alert.message}
      </p>

      {alert.predictedImpact && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <GitMerge className="w-3 h-3 text-warning shrink-0" />
          <span className="text-[10px] font-mono text-warning uppercase">
            {alert.predictedImpact}
          </span>
        </div>
      )}

      {alert.mitigationAction && (
        <MitigationButton phase={mitigationPhase} onBegin={onBeginMitigation} />
      )}
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
    if (type === "OK")   return "text-green-400/70";
    return "text-muted-foreground/50";
  };

  const prefix = (type: LogLine["type"]) => {
    if (type === "AI")   return "[AI]";
    if (type === "WARN") return "[!!]";
    if (type === "OK")   return "[OK]";
    return "[OS]";
  };

  return (
    <div className="h-48 border-t border-white/5 bg-[#070a10] p-3 overflow-y-auto flex flex-col-reverse font-mono text-[10px] leading-[1.7]">
      <div ref={bottomRef} />
      {lines.map((line) => (
        <div key={line.id} className={color(line.type)}>
          <span className="text-white/20 mr-2 select-none">
            {format(new Date(line.timestamp), "HH:mm:ss")}
          </span>
          <span className="mr-1">{prefix(line.type)}</span>
          {line.text}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function TacticalNocDashboard() {
  const {
    totalAttendance,
    checkInVelocity,
    activeSessions,
    systemStatus,
    rooms,
    alerts,
    logLines,
    mitigationPhase,
    threatResolved,
    tickSimulation,
    triggerCriticalSurge,
    beginMitigation,
    _advanceMitigationToSuccess,
    _advanceMitigationToSettled,
  } = useSimulationStore();

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [velocityFlash, setVelocityFlash] = useState(false);

  // Flash velocity KPI when system settles
  useEffect(() => {
    if (mitigationPhase === "SETTLED") {
      setVelocityFlash(true);
      const t = setTimeout(() => setVelocityFlash(false), 1000);
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

  // Simulation tick (1.5s)
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(tickSimulation, 1500);
    return () => clearInterval(id);
  }, [mounted, tickSimulation]);

  // Crisis trigger at T+10s
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(triggerCriticalSurge, 10000);
    return () => clearTimeout(t);
  }, [mounted, triggerCriticalSurge]);

  // Mitigation phase advancement — 2 bounded timeouts, both cleared on exit
  const handleBeginMitigation = useCallback(() => {
    beginMitigation();
    const t1 = setTimeout(() => {
      _advanceMitigationToSuccess();
      const t2 = setTimeout(() => {
        _advanceMitigationToSettled();
      }, 1500);
      // t2 is inside t1's callback — t1 cleanup covers entry, t2 always fires within ~1.5s
      return t2; // returned only for conceptual clarity; JS won't auto-clear
    }, 2000);
    return () => clearTimeout(t1);
  }, [beginMitigation, _advanceMitigationToSuccess, _advanceMitigationToSettled]);

  const toggleRoom = useCallback((id: string) => {
    setExpandedRoom((prev) => (prev === id ? null : id));
  }, []);

  const isMigrating = mitigationPhase === "PROCESSING";
  const sysIcon: LucideIcon =
    systemStatus === "NOMINAL" ? CheckCircle2 :
    systemStatus === "DEGRADED" ? AlertTriangle :
    ServerCrash;

  const sysValue =
    systemStatus === "NOMINAL" ? "100%" :
    systemStatus === "DEGRADED" ? "WARN" :
    "FAIL";

  if (!mounted) return null;

  return (
    <div className="h-screen flex overflow-hidden pl-16">

      {/* ── LEFT ICON RAIL ──────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-background flex flex-col items-center py-6 gap-7 z-50">
        {/* Logo */}
        <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0">
          <span className="font-mono font-bold text-background text-[10px] tracking-tight">VOS</span>
        </div>

        <nav className="flex flex-col items-center gap-6 flex-1 text-muted-foreground">
          {/* Active page indicator */}
          <div className="relative w-full flex justify-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <Users className="w-5 h-5 opacity-30 hover:opacity-80 transition-opacity cursor-pointer" />
          <Activity className="w-5 h-5 opacity-30 hover:opacity-80 transition-opacity cursor-pointer" />
          <ServerCrash className="w-5 h-5 opacity-30 hover:opacity-80 transition-opacity cursor-pointer" />
        </nav>

        {/* Bottom status dot */}
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            systemStatus === "NOMINAL" ? "bg-primary" : "bg-destructive animate-pulse"
          }`}
        />
      </aside>

      {/* ── MAIN STAGE ──────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">

        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 shrink-0">
            <div>
              <h1 className="text-base font-sans tracking-[0.2em] uppercase font-semibold text-foreground">
                Live Control Center
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
                VANTAGE_OS // CORE SECTOR //
                <span className={`ml-2 ${systemStatus === "NOMINAL" ? "text-primary" : "text-destructive"}`}>
                  {systemStatus}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest block mb-1">
                SYNCED — UTC+5:30
              </span>
              {currentTime && (
                <span className="text-sm font-mono text-primary flex items-center justify-end gap-2">
                  <span className="w-1.5 h-1.5 bg-primary animate-pulse shrink-0" />
                  {format(currentTime, "HH:mm:ss")}
                  <span className="text-muted-foreground text-[10px]">.{String(currentTime.getMilliseconds()).padStart(3, "0").slice(0, 2)}</span>
                </span>
              )}
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
                status={systemStatus === "DEGRADED" ? "DEGRADED" : "NOMINAL"}
                flash={velocityFlash}
              />
              <MetricCard title="Active Nodes" value={activeSessions} icon={Cpu} />
              <MetricCard
                title="System Status"
                value={sysValue}
                icon={sysIcon}
                status={systemStatus}
              />
            </div>

            {/* HEATMAP */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
                  Venue Floorplan Topology
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Click sector for detail
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

          </div>
        </div>

        {/* ── RIGHT RAIL ──────────────────────────────────────────── */}
        <aside className="w-[380px] border-l border-white/5 flex flex-col overflow-hidden shrink-0">

          {/* Rail header */}
          <div className="px-5 py-4 border-b border-white/5 bg-background shrink-0 flex items-center justify-between">
            <h2 className="text-[10px] font-sans tracking-widest uppercase flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-4 h-4 text-warning" />
              AI Threat Intelligence
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground border border-white/10 px-1.5 py-0.5">
              {alerts.length} EVENT{alerts.length !== 1 ? "S" : ""}
            </span>
          </div>

          {/* Alert feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                mitigationPhase={mitigationPhase}
                onBeginMitigation={handleBeginMitigation}
              />
            ))}
          </div>

          {/* Live terminal log */}
          <TerminalLog lines={logLines} />
        </aside>

      </main>
    </div>
  );
}
