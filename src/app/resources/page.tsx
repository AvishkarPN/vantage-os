"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Package, Users, Radio, Activity, ServerCrash,
  AlertTriangle, CheckCircle2, Factory, Zap, ShieldAlert,
  ChevronRight, ArrowUpRight, BatteryWarning
} from "lucide-react";
import {
  useResourceStore,
  type ResourcePriority, type SetupStatus, type ResourceCategory
} from "@/store/resourceStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<ResourcePriority, string> = {
  critical: "text-destructive border-destructive/40 bg-destructive/10",
  high:     "text-warning border-warning/40 bg-warning/10",
  normal:   "text-primary border-primary/40 bg-primary/10",
};

const STATUS_COLORS: Record<SetupStatus, string> = {
  pending:       "text-warning border-warning/30 bg-warning/5",
  "in-progress": "text-primary border-primary/30 bg-primary/5",
  ready:         "text-muted-foreground border-white/10 bg-white/5",
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ShortageSidebar() {
  const resources = useResourceStore(s => s.resources);
  
  const shortfalls = useMemo(() => {
    return resources
      .filter(r => r.allocated < r.required)
      .sort((a, b) => b.required - b.allocated - (a.required - a.allocated));
  }, [resources]);

  return (
    <aside className="w-80 border-l border-white/5 flex flex-col overflow-hidden shrink-0">
      <div className="px-4 py-4 border-b border-white/5 bg-background shrink-0">
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-foreground flex items-center gap-2">
          <BatteryWarning className="w-3 h-3 text-warning" />
          Critical Shortages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {shortfalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 mb-2 opacity-20" />
            <p className="text-[10px] font-mono uppercase">All resources fully allocated</p>
          </div>
        ) : (
          shortfalls.map(r => (
            <div key={r.id} className="border border-white/5 bg-card p-3 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-1 h-full ${
                r.priority === 'critical' ? 'bg-destructive' : r.priority === 'high' ? 'bg-warning' : 'bg-primary'
              }`} />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-sans text-foreground truncate">{r.name}</h3>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">{r.zone}</p>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 border uppercase ${PRIORITY_COLORS[r.priority]}`}>
                  {r.priority}
                </span>
              </div>
              <div className="flex items-end justify-between font-mono">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-destructive">-{r.required - r.allocated}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">shortfall</span>
                </div>
                <div className="text-[10px] text-muted-foreground border border-white/10 px-2 py-0.5 pointer-events-none">
                  {r.allocated} / {r.required}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const { resources, allocateResource, updateSetupStatus } = useResourceStore();
  const [filterPriority, setFilterPriority] = useState<ResourcePriority | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && 
          !r.zone.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [resources, filterPriority, search]);

  const shortfallCount = resources.filter(r => r.allocated < r.required).length;

  return (
    <div className="h-screen flex overflow-hidden" style={{ paddingLeft: '64px' }}>

      {/* ── SIDEBAR NAV ────────────────────────────────────────────── */}
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
          <Link href="/staff" className="opacity-30 hover:opacity-80 transition-opacity">
            <Users className="w-5 h-5" />
          </Link>
          
          {/* Package icon — active */}
          <div className="relative w-full flex justify-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
            <Package className="w-5 h-5 text-primary" />
          </div>

          <Link href="/reports" className="opacity-30 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5" />
          </Link>
        </nav>
        {shortfallCount > 0 && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" />}
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center px-8 py-4 border-b border-white/5 shrink-0">
            <div>
              <h1 className="text-base font-sans tracking-[0.2em] uppercase font-semibold text-foreground">
                Resource Planning
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-widest">
                VANTAGE_OS // LOGISTICS MODULE // 
                <span className="ml-2 text-foreground tabular-nums">{resources.length} SYSTEMS</span>
                {shortfallCount > 0 && (
                  <span className="ml-3 text-destructive animate-pulse">⚠ {shortfallCount} SHORTFALL{shortfallCount > 1 ? 'S' : ''} DETECTED</span>
                )}
              </p>
            </div>
          </header>

          {/* Filters */}
          <div className="flex items-center gap-3 px-8 py-3 border-b border-white/5 shrink-0 bg-background">
            <input
              type="text"
              placeholder="Search resource / zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border border-white/10 text-foreground text-[10px] font-mono px-3 py-1.5 w-64 focus:outline-none focus:border-primary placeholder:text-muted-foreground uppercase"
            />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as ResourcePriority | 'all')}
              className="bg-card border border-white/10 text-foreground text-[10px] font-mono px-2 py-1.5 focus:outline-none focus:border-primary appearance-none uppercase cursor-pointer"
            >
              <option value="all">ALL PRIORITIES</option>
              <option value="critical">CRITICAL ONLY</option>
              <option value="high">HIGH PRIORITY</option>
              <option value="normal">NORMAL PRIORITY</option>
            </select>
          </div>

          {/* Headers */}
          <div className="flex items-center gap-3 px-8 py-2 border-b border-white/5 shrink-0 bg-background font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
            <div className="w-48 shrink-0">Resource</div>
            <div className="w-24 shrink-0">Zone</div>
            <div className="w-24 shrink-0">Priority</div>
            <div className="w-48 flex-1">Allocated / Required</div>
            <div className="w-32 shrink-0">Setup</div>
            <div className="w-24 shrink-0">Actions</div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-8 py-3 space-y-1.5">
            {filtered.map(r => {
              const shortfall = r.required - r.allocated;
              const hasShortfall = shortfall > 0;
              const fillPct = Math.min((r.allocated / r.required) * 100, 100);

              return (
                <div key={r.id} className={`border p-3 flex items-center gap-3 transition-colors ${
                  hasShortfall ? "border-destructive/20 bg-background" : "border-white/5 bg-card"
                }`}>
                  {/* Info */}
                  <div className="w-48 shrink-0 min-w-0">
                    <p className="text-xs font-sans text-foreground truncate">{r.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate">{r.category} • {r.vendor}</p>
                  </div>

                  {/* Zone */}
                  <div className="w-24 shrink-0 text-[10px] font-mono text-muted-foreground truncate uppercase">
                    {r.zone}
                  </div>

                  {/* Priority */}
                  <div className="w-24 shrink-0">
                    <span className={`text-[9px] font-mono border px-1.5 py-0.5 uppercase ${PRIORITY_COLORS[r.priority]}`}>
                      {r.priority}
                    </span>
                  </div>

                  {/* Load Bar */}
                  <div className="w-48 flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-mono tabular-nums text-foreground">
                        {r.allocated} / {r.required}
                      </span>
                      {hasShortfall && (
                        <span className="text-[9px] font-mono text-destructive uppercase">{-shortfall} Short</span>
                      )}
                    </div>
                    <div className="w-full h-1 bg-background">
                      <div 
                        className={`h-full transition-all duration-500 ${hasShortfall ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Setup */}
                  <div className="w-32 shrink-0">
                     <select
                        value={r.setupStatus}
                        onChange={(e) => updateSetupStatus(r.id, e.target.value as SetupStatus)}
                        className={`w-full text-[9px] font-mono uppercase border px-2 py-1 appearance-none cursor-pointer focus:outline-none ${STATUS_COLORS[r.setupStatus]}`}
                      >
                        <option value="pending">PENDING</option>
                        <option value="in-progress">IN PROGRESS</option>
                        <option value="ready">READY</option>
                      </select>
                  </div>

                  {/* Action */}
                  <div className="w-24 shrink-0">
                    <button
                      onClick={() => allocateResource(r.id, 10)}
                      disabled={!hasShortfall}
                      className="text-[9px] font-mono border border-white/10 px-2 py-1 hover:border-primary hover:text-primary transition-colors disabled:opacity-20 uppercase tracking-widest bg-background"
                    >
                      +10 Alloc
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <ShortageSidebar />
      </main>
    </div>
  );
}
