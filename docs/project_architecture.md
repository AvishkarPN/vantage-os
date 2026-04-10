# VantageOS: Project Architecture & Technical Blueprint
*A Tactical Brutalist Event Operations Control Center*

## 1. Executive Summary
VantageOS is a specialized **NOC (Network Operations Center)** for event execution. It focuses on live spatial intelligence, predictive crowd analytics, and automated crisis mitigation. The system is built using a **Deterministic Simulation Architecture**, ensuring demo consistency while providing a high-fidelity "production" feel.

---

## 2. Technical Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | Core application shell & routing. |
| **State Management** | Zustand | Global deterministic simulation & business logic. |
| **Styling** | Tailwind CSS v4 | "Tactical Brutalist" design language (Glassmorphism, Dark NOC Mode). |
| **Icons** | Lucide React | High-clarity operational iconography. |
| **Type Safety** | TypeScript (Strict) | Schema-first development for DB-ready integration. |
| **Visualization** | Native CSS/SVG | Heatmaps, Sparklines, and Progress Pipelines. |

---

## 3. Core Architecture Pillars

### A. Deterministic Simulation Loop (`simulationStore.ts`)
The "Heart" of VantageOS. Instead of relying on flakey real-time events, the system runs a central `tickSimulation` cycle every 1.5s:
- **Organic Flux:** Rooms gain/lose attendees based on capacity-aware noise.
- **Queue Dynamics:** People flow from *Entrance* -> *External Waiting* -> *Tactical Queue* -> *Room Occupancy*.
- **Crisis Trigger:** A hardcoded `T+10s` surge trigger initiates the Hall B demo scenario.

### B. Relational Mock Database (`v2/databaseStore.ts`)
A normalized data layer that mimics a real PostgreSQL/Supabase backend:
- **Entities:** `Zones`, `Staff`, `Resources`, `Incidents`, `Recommendations`.
- **Relational Keys:** Staff are assigned to `zoneId`, Incidents reference `zoneId`.
- **Persistence:** Local storage persistence via Zustand middleware ensures the NOC stays "alive" through refreshes.

### C. The Mitigation State Machine
The system handles crises through a 7-phase deterministic pipeline:
1. `DETECTED`: AI flags an anomaly.
2. `ANALYZING`: System computes vector impacts.
3. `RECOMMENDING`: A locked mitigation strategy is proposed.
4. `EXECUTING`: Operator authorizes intervention.
5. `REDISTRIBUTING`: Live people-flow redistribution occurs.
6. `STABILIZING`: Metric recovery verification.
7. `MONITORING`: Return to nominal tracking.

---

## 4. Security & Governance Layer
- **Auth Guard:** A tactical login interceptor restricts NOC access to authorized roles (`Master Operator` vs `Tactical Staff`).
- **Audit Logs:** Immutable record of every critical intervention, severity-coded for post-event forensics.
- **Action Throttling:** Client-side rate limiting prevents instruction spamming during high-stress ops.

---

## 5. Directory Structure
```text
vantage-os/
├── docs/                  # System documentation (Audit, Database, Security)
├── src/
│   ├── app/               # Page Modules (Dashboard, Staff, Resources, Reports)
│   ├── components/        # Reusable Tactical UI (MetricCards, Heatmaps)
│   ├── store/             # Global Logic
│   │   ├── simulationStore.ts # Core Simulation Logic
│   │   └── v2/            # Database-style stores (Auth, Resources)
│   ├── types/             # Strict Schema Definitions
│   └── seed/              # Relational Mock Data (JSON)
└── public/                # Static tactical assets
```

---

## 6. Demo "Happy Path" Mechanics
1. **Nominal:** System show normal flux across all 4 zones.
2. **Surge:** Hall B triggers red, `queueLength` spikes, `systemStatus` drops to CRITICAL.
3. **AI Prop:** Right rail pop-up with a 0.94 confidence mitigation recommendation.
4. **Approval:** Operator clicks "AUTO-MITIGATE". 
5. **Resolution:** Numbers shift from Hall B -> Hall A/Expo. Security logs recorded. System returns to Green.

---

## 7. Future Scaling (Supabase/PostgreSQL)
The project is "Backend-Ready." Migrating to a real database requires only:
1. Swapping `set()` calls in Zustand for `supabase.from().update()`.
2. Listening to Postgres changes via Realtime to update the local store.
3. Replacing the `tickSimulation` with server-side Cron jobs or Edge Functions.
