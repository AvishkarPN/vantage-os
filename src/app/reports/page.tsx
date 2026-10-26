"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText, Users, Radio, Activity, ServerCrash, Package,
  Download, Printer, FileJson, Clock, AlertTriangle, ShieldCheck,
  Shield, CheckCircle2, History
} from "lucide-react";

import { useSimulationStore } from "@/store/simulationStore";
import { useStaffStore, ZONE_CONFIGS, getZoneStatus } from "@/store/staffStore";
import { useResourceStore } from "@/store/resourceStore";
import { useAuthStore } from "@/store/v2/authStore";
import { recordExport } from "@/actions/dbActions";

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTimestamp(date: Date) {
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function exportJSON(data: any, prefix: string) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VantageOS_${prefix}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error("Export failure [JSON]:", err);
    alert("CRITICAL_FAIL: Failed to generate JSON report. Check system console.");
  }
}

function exportCSV(headers: string[], rows: any[][], prefix: string) {
  try {
    const escape = (val: any) => {
      const s = String(val);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      headers.map(escape).join(","),
      ...rows.map(r => r.map(escape).join(","))
    ].join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VantageOS_${prefix}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error("Export failure [CSV]:", err);
    alert("CRITICAL_FAIL: Failed to generate CSV report. Integrity check required.");
  }
}

// ─── Reports Page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const simState = useSimulationStore();
  const staffState = useStaffStore();
  const resourceState = useResourceStore();
  const { logSecurityAction, canExecuteAction, userName } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [dbData, setDbData] = useState<{
    auditLogs: any[];
    incidents: any[];
    exports: any[];
  }>({
    auditLogs: [],
    incidents: [],
    exports: []
  });
  const [isDbLoading, setIsDbLoading] = useState(false);

  const loadDbReports = async () => {
    try {
      setIsDbLoading(true);
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setDbData({
          auditLogs: data.auditLogs || [],
          incidents: data.incidents || [],
          exports: data.exports || []
        });
      }
    } catch (e) {
      console.warn("Failed to fetch reports from DB:", e);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDbReports();
  }, []);

  if (!mounted) return null;

  // Snapshot Builders
  const buildLiveSnapshot = () => ({
    timestamp: new Date().toISOString(),
    status: simState.systemStatus,
    attendance: simState.totalAttendance,
    velocity: simState.checkInVelocity,
    zones: simState.rooms.map(r => ({
      name: r.name,
      occupancyPct: Math.round((r.currentOccupancy / r.capacity) * 100),
      queueLength: r.queueLength,
      rerouted: r.rerouted
    })),
    staffingCoverageDeficit: ZONE_CONFIGS.filter(z => getZoneStatus(z.zone, staffState.staff) === 'critical').length,
    resourceShortages: resourceState.resources.filter(r => r.allocated < r.required).length
  });

  const handleExportJSON = async () => {
    if (!canExecuteAction()) return;
    const filename = `VantageOS_Live_Snapshot_${Date.now()}.json`;
    const snapshot = buildLiveSnapshot();
    exportJSON(snapshot, "Live_Snapshot");
    logSecurityAction("EXPORT_GENERATED: format=JSON", "MEDIUM");
    await recordExport(filename, "JSON", userName, snapshot.zones.length);
    loadDbReports();
  };

  const handleExportCSV = async () => {
    if (!canExecuteAction()) return;
    const headers = ["Zone", "Occupancy", "Capacity", "Fill %", "Queue", "Rerouted", "Staff Status"];
    const rows = simState.rooms.map(r => {
      // @ts-ignore - loose binding for demo
      const sStatus = getZoneStatus(r.name as any, staffState.staff);
      const fillPct = r.capacity > 0 ? Math.round((r.currentOccupancy / r.capacity) * 100) : 0;
      return [
        r.name,
        r.currentOccupancy,
        r.capacity,
        `${fillPct}%`,
        r.queueLength,
        r.rerouted,
        sStatus
      ];
    });
    const filename = `VantageOS_Zone_Status_${Date.now()}.csv`;
    exportCSV(headers, rows, "Zone_Status");
    logSecurityAction("EXPORT_GENERATED: format=CSV", "MEDIUM");
    await recordExport(filename, "CSV", userName, rows.length);
    loadDbReports();
  };

  const handlePrint = () => {
    window.print();
  };

  const mitigationRes = simState.mitigationResult;

  return (
    <div className="h-screen flex overflow-hidden print:overflow-visible print:h-auto" style={{ paddingLeft: '64px' }}>

      {/* ── SIDEBAR NAV (Hidden when printing) ── */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/5 bg-background flex flex-col items-center py-6 gap-7 z-50 print:hidden">
        <Link href="/">
          <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/80 transition-colors">
            <span className="font-mono font-bold text-background text-[9px] tracking-tight">VOS</span>
          </div>
        </Link>
        <nav className="flex flex-col items-center gap-6 flex-1 text-muted-foreground">
          <Link href="/" className="opacity-30 hover:opacity-80 transition-opacity">
            <Radio className="w-5 h-5" />
          </Link>
          <Link href="/staff" className="opacity-30 hover:opacity-80 transition-opacity">
            <Users className="w-5 h-5" />
          </Link>
          <Link href="/resources" className="opacity-30 hover:opacity-80 transition-opacity">
            <Package className="w-5 h-5" />
          </Link>
          
          <div className="relative w-full flex justify-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
            <Activity className="w-5 h-5 text-primary" />
          </div>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto bg-background print:w-full print:ml-0 print:p-0">
        
        {/* Header - Screen Only */}
        <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 shrink-0 print:hidden sticky top-0 bg-background/90 backdrop-blur z-10">
          <div>
            <h1 className="text-base font-sans tracking-[0.2em] uppercase font-semibold text-foreground">
              Executive Reports & Audit Ledger
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
              VANTAGE_OS // COMPLIANCE & FORENSICS MODULE
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-2.5 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${!isDbLoading ? 'bg-primary animate-pulse' : 'bg-warning'}`} />
              <span className="text-[9px] font-mono text-primary uppercase tracking-wider">
                {isDbLoading ? 'READING DB...' : 'DB ONLINE [SQLITE WAL]'}
              </span>
            </div>
            <button onClick={handleExportJSON} className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors text-muted-foreground uppercase">
              <FileJson className="w-3 h-3" /> Export JSON
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors text-muted-foreground uppercase">
              <Download className="w-3 h-3" /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-primary text-background border border-primary px-3 py-1.5 text-[10px] font-mono hover:bg-primary/80 transition-colors uppercase font-bold">
              <Printer className="w-3 h-3" /> Print PDF
            </button>
            <Link href="/" className="text-[10px] font-mono text-muted-foreground border border-white/10 px-3 py-1.5 hover:border-primary hover:text-primary transition-colors uppercase tracking-widest">
              ← Control Center
            </Link>
          </div>
        </header>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="max-w-5xl mx-auto p-12 print:p-4 space-y-8">
          
          {/* Doc Header */}
          <div className="border-b border-foreground/20 pb-4 mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-sans tracking-widest font-bold text-foreground">OPERATIONAL SUMMARY</h2>
              <p className="text-xs font-mono text-muted-foreground mt-1 tracking-wider uppercase">Event Command Center • VantageOS Persistence Layer</p>
            </div>
            <div className="text-right font-mono text-xs text-muted-foreground">
              <p>Generated: {formatTimestamp(new Date())}</p>
              <p className={`mt-1 font-bold ${simState.systemStatus === 'NOMINAL' ? 'text-primary' : 'text-destructive'}`}>
                STATUS: {simState.systemStatus}
              </p>
            </div>
          </div>

          {/* Grid 1: High Level */}
          <div className="grid grid-cols-3 gap-6">
            <div className="border border-white/10 p-4 bg-card">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Total Attendance</h3>
              <p className="text-2xl font-mono text-foreground">{simState.totalAttendance}</p>
            </div>
            <div className="border border-white/10 p-4 bg-card">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Staff Coverage Deficit</h3>
              <p className="text-2xl font-mono text-warning">
                {ZONE_CONFIGS.filter(z => getZoneStatus(z.zone, staffState.staff) === 'critical').length} Zones <span className="text-[10px] text-muted-foreground">(Critical)</span>
              </p>
            </div>
            <div className="border border-white/10 p-4 bg-card">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Resource Shortfalls</h3>
              <p className="text-2xl font-mono text-destructive">
                {resourceState.resources.filter(r => r.allocated < r.required && r.priority === 'critical').length} Critical
              </p>
            </div>
          </div>

          {/* Section: Zone Utilization */}
          <div className="border border-white/10 p-6 bg-card">
            <h3 className="text-sm font-sans tracking-[0.1em] font-semibold text-foreground uppercase border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Zone Occupancy & Queue State
            </h3>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-white/5">
                  <th className="pb-2 font-normal">Zone</th>
                  <th className="pb-2 font-normal">Occupancy</th>
                  <th className="pb-2 font-normal">Fill %</th>
                  <th className="pb-2 font-normal text-right">In Queue</th>
                </tr>
              </thead>
              <tbody>
                {simState.rooms.map(r => {
                  const pct = r.capacity > 0 ? Math.round((r.currentOccupancy / r.capacity) * 100) : 0;
                  const isHigh = pct > 90;
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 text-foreground">
                      <td className="py-2 flex items-center gap-2">
                        {isHigh && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        {r.name}
                      </td>
                      <td className="py-2">{r.currentOccupancy} / {r.capacity}</td>
                      <td className={`py-2 ${isHigh ? 'text-destructive font-bold' : ''}`}>{pct}%</td>
                      <td className="py-2 text-right">{r.queueLength > 0 ? <span className="text-warning">{r.queueLength}</span> : 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section: Mitigation Summary */}
          {mitigationRes && (
            <div className="border border-primary/40 bg-primary/5 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24" />
              </div>
              <h3 className="text-sm font-sans tracking-[0.1em] font-semibold text-primary uppercase border-b border-primary/20 pb-2 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Incident Mitigation Report
              </h3>
              
              <div className="grid grid-cols-2 gap-8 mb-4 relative z-10">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Trigger Event</div>
                  <div className="font-sans text-sm pb-3">Hall B Registration Surge Capacity Breach</div>
                  
                  <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Risk Reduction</div>
                  <div className="font-mono text-foreground text-sm">
                    {mitigationRes.redistribution.riskBefore}% ↘ {mitigationRes.redistribution.riskAfter}%
                  </div>
                </div>
                
                <div className="font-mono text-xs">
                  <div className="text-[10px] text-muted-foreground uppercase mb-2 border-b border-primary/20 pb-1">Redistribution Log</div>
                  <ul className="space-y-1 text-foreground">
                    <li>Moved → Hall A: <span className="text-primary float-right">{mitigationRes.redistribution.movedToHallA} attendees</span></li>
                    <li>Moved → Expo Floor: <span className="text-primary float-right">{mitigationRes.redistribution.movedToExpo} attendees</span></li>
                    <li>Held in queue: <span className="text-warning float-right">{mitigationRes.redistribution.heldInQueue} pending</span></li>
                    <li>Staff reassigned: <span className="text-primary float-right">{mitigationRes.redistribution.staffReassigned} pers.</span></li>
                    <li>Notifications sent: <span className="text-foreground float-right">{mitigationRes.redistribution.notificationsSent}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section: Database Audit Trail */}
          <div className="border border-white/10 p-6 bg-card">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
              <h3 className="text-sm font-sans tracking-[0.1em] font-semibold text-foreground uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Immutable Audit Ledger (Database)
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {dbData.auditLogs.length} LOGGED FORENSIC ENTRIES
              </span>
            </div>
            
            <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
              {dbData.auditLogs.length === 0 ? (
                <p className="text-muted-foreground text-xs py-4 text-center">No audit logs recorded yet.</p>
              ) : (
                dbData.auditLogs.map((log: any) => (
                  <div key={log.id} className="border border-white/5 p-2.5 flex items-start justify-between gap-4 bg-background/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1 border uppercase font-bold ${
                          log.severity === 'HIGH' ? 'border-destructive text-destructive' :
                          log.severity === 'MEDIUM' ? 'border-warning text-warning' :
                          'border-primary/50 text-primary'
                        }`}>
                          {log.severity}
                        </span>
                        <span className="text-foreground text-[11px] font-bold">{log.operatorName || 'root_admin'}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[10px] mt-1">{log.action}</p>
                    </div>
                    <span className="text-[9px] text-primary shrink-0 uppercase border border-primary/20 px-1 py-0.5">
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Export History */}
          {dbData.exports.length > 0 && (
            <div className="border border-white/10 p-6 bg-card">
              <h3 className="text-sm font-sans tracking-[0.1em] font-semibold text-foreground uppercase border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Generated Report Archives
              </h3>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                {dbData.exports.slice(0, 6).map((exp: any) => (
                  <div key={exp.id} className="border border-white/5 p-2.5 bg-background/50 flex justify-between items-center">
                    <div>
                      <p className="text-foreground text-[10px] font-bold truncate max-w-xs">{exp.filename}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(exp.createdAt).toLocaleString()} • by {exp.user || 'operator'}</p>
                    </div>
                    <span className="text-[9px] font-bold border border-white/10 px-1.5 py-0.5 uppercase text-primary">
                      {exp.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-[9px] font-mono text-muted-foreground text-center uppercase tracking-widest pt-8 border-t border-white/5 print:mt-12">
            VantageOS Report Engine v1.0.2 • Connected to Persistent Database • END OF REPORT
          </div>

        </div>
      </main>
    </div>
  );
}
