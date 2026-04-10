"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText, Users, Radio, Activity, ServerCrash, Package,
  Download, Printer, FileJson, Clock, AlertTriangle, ShieldCheck
} from "lucide-react";

import { useSimulationStore } from "@/store/simulationStore";
import { useStaffStore, ZONE_CONFIGS, getZoneStatus } from "@/store/staffStore";
import { useResourceStore } from "@/store/resourceStore";
import { useAuthStore } from "@/store/v2/authStore";

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
    // Escape commas in cells to prevent corruption
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

    // Add UTF-8 BOM so Excel opens it with correct encoding
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
  const { logSecurityAction, canExecuteAction } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const handleExportJSON = () => {
    if (!canExecuteAction()) return;
    exportJSON(buildLiveSnapshot(), "Live_Snapshot");
    logSecurityAction("EXPORT_GENERATED: format=JSON", "MEDIUM");
  };

  const handleExportCSV = () => {
    if (!canExecuteAction()) return;
    const headers = ["Zone", "Occupancy (%)", "Queue", "Rerouted", "Staff Status"];
    const rows = simState.rooms.map(r => {
      // @ts-ignore - loose binding for demo
      const sStatus = getZoneStatus(r.name as any, staffState.staff);
      return [
        r.name,
        Math.round((r.currentOccupancy / r.capacity) * 100),
        r.queueLength,
        r.rerouted,
        sStatus
      ];
    });
    exportCSV(headers, rows, "Zone_Status");
    logSecurityAction("EXPORT_GENERATED: format=CSV", "MEDIUM");
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
              Executive Reports
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
              VANTAGE_OS // EXPORT MODULE
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors text-muted-foreground uppercase">
              <FileJson className="w-3 h-3" /> Export JSON
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors text-muted-foreground uppercase">
              <Download className="w-3 h-3" /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-primary text-background border border-primary px-3 py-1.5 text-[10px] font-mono hover:bg-primary/80 transition-colors uppercase font-bold">
              <Printer className="w-3 h-3" /> Print PDF
            </button>
          </div>
        </header>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="max-w-4xl mx-auto p-12 print:p-4 space-y-8">
          
          {/* Doc Header */}
          <div className="border-b border-foreground/20 pb-4 mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-sans tracking-widest font-bold text-foreground">OPERATIONAL SUMMARY</h2>
              <p className="text-xs font-mono text-muted-foreground mt-1 tracking-wider uppercase">Event Command Center • VantageOS</p>
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
            <div className="border border-white/10 p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Total Attendance</h3>
              <p className="text-2xl font-mono text-foreground">{simState.totalAttendance}</p>
            </div>
            <div className="border border-white/10 p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Staff Coverage Deficit</h3>
              <p className="text-2xl font-mono text-warning">
                {ZONE_CONFIGS.filter(z => getZoneStatus(z.zone, staffState.staff) === 'critical').length} Zones
              </p>
            </div>
            <div className="border border-white/10 p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Resource Shortfalls</h3>
              <p className="text-2xl font-mono text-destructive">
                {resourceState.resources.filter(r => r.allocated < r.required).length} Critical
              </p>
            </div>
          </div>

          {/* Section: Zone Utilization */}
          <div className="border border-white/10 p-6">
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
                  const pct = Math.round((r.currentOccupancy / r.capacity) * 100);
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

          {/* Section: Mitigation Summary (only show if it happened) */}
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
                    <li>Moved → Hall A: <span className="text-primary float-right">{mitigationRes.redistribution.movedToHallA}</span></li>
                    <li>Moved → Expo Floor: <span className="text-primary float-right">{mitigationRes.redistribution.movedToExpo}</span></li>
                    <li>Held in queue: <span className="text-warning float-right">{mitigationRes.redistribution.heldInQueue}</span></li>
                    <li>Staff reassigned: <span className="text-primary float-right">2 personnel</span></li>
                    <li>Notifications sent: <span className="text-foreground float-right">96 devices</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-[9px] font-mono text-muted-foreground text-center uppercase tracking-widest pt-8 border-t border-white/5 print:mt-12">
            VantageOS Report Engine v1.0.2 / END OF REPORT
          </div>

        </div>
      </main>
    </div>
  );
}
