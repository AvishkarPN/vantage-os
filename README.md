# VantageOS — Tactical NOC & Event Command Center

[![CI Pipeline](https://github.com/AvishkarPN/vantage-os/actions/workflows/ci.yml/badge.svg)](https://github.com/AvishkarPN/vantage-os/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.7.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20LibSQL-003B57?style=flat&logo=sqlite)](https://github.com/libsql/libsql-client-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **VantageOS** is a mission-critical, AI-driven Tactical Network Operations Center (NOC) and Command & Control dashboard designed for high-density venues, arenas, and mega-conferences. It unifies real-time crowd dynamics, sensory telemetry, automated dispatching, and autonomous neural incident mitigation with a cryptographically auditable forensic ledger.

---

## Architecture Overview

```mermaid
graph TD
    UI["VantageOS Tactical NOC (React 19 + Tailwind v4)"]
    Stores["Client Zustand Stores (Optimistic Mutations)"]
    API["Next.js 16 REST APIs (/api/*) & Server Actions"]
    Prisma["Prisma 7 ORM (@prisma/adapter-libsql)"]
    DB[("Relational Database (SQLite dev.db / PostgreSQL)")]
    Engine["Autonomous AI Mitigation Engine"]
    Audit[("Forensic Audit Ledger")]
    CI["GitHub Actions CI/CD Pipeline"]

    UI --> Stores
    Stores -->|"Instant Optimistic UI Updates"| API
    API -->|"Type-Safe CRUD & Relational Queries"| Prisma
    Prisma --> DB
    UI -.->|"1-Click Crisis Remediation"| Engine
    Engine -->|"Atomic DB Commit & State Reroute"| Prisma
    Engine -->|"Immutable Record"| Audit
    CI -->|"Automated Lint, Test, DB Sync & Build"| DB
```

### Core Technologies
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Tactical Brutalist NOC theme.
- **State Management**: Zustand stores (`simulationStore`, `staffStore`, `resourceStore`) with optimistic UI updates and background DB persistence.
- **Backend & APIs**: Next.js 16 Route Handlers (`/api/*`) and Server Actions (`src/actions/dbActions.ts`).
- **Database Engine**: Prisma 7 ORM with LibSQL Driver Adapter (`@prisma/adapter-libsql` + `@libsql/client`). Zero-config native SQLite out-of-the-box, effortlessly swappable to PostgreSQL or Turso.
- **Continuous Integration**: Automated GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`) validating TypeScript compilation, ESLint standards, database migrations, seed integrity, and production builds.

---

## GitHub Actions CI/CD Integration

VantageOS is connected to GitHub Actions via [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) to ensure that every pull request and push to `main` or `master` is automatically verified before deployment.

### 1. Workflow Triggers
The workflow executes automatically under three conditions:
- **`push`** to `main` or `master` branches.
- **`pull_request`** targeting `main` or `master` branches.
- **`workflow_dispatch`**: Manual 1-click execution directly from the GitHub Actions dashboard.
- **Concurrency Control**: Automatically cancels outdated in-progress runs for the same branch or PR to conserve CI minutes.

### 2. Pipeline Execution Stages

```mermaid
flowchart LR
    A[Checkout Code] --> B[Setup Node.js 20]
    B --> C[npm install]
    C --> D[TypeScript Check]
    D --> E[ESLint Audit]
    E --> F[Prisma Push & Seed]
    F --> G[Automated Telemetry Test]
    G --> H[Production Build]
    H --> I[GitHub Summary Report]
```

1. **Environment Setup**:
   - Provisions an `ubuntu-latest` runner.
   - Initializes Node.js `20.x` LTS with native npm dependency caching.
2. **Static Analysis & Type Checking**:
   - `npx tsc --noEmit`: Verifies 100% strict TypeScript compliance across all components, actions, and API routes.
   - `npm run lint`: Enforces Next.js Core Web Vitals and ESLint standards.
3. **Database Schema & Seeding Validation**:
   - `npx prisma generate`: Generates type-safe Prisma Client with the LibSQL driver adapter.
   - `npm run db:push`: Applies database schema directly into SQLite (`dev.db`).
   - `npm run db:seed`: Seeds 3 users, 1 venue, 10 tactical zones, 20 personnel, 12 tactical resources, 4 sessions, and audit logs.
4. **Automated Health & Telemetry Test (`npm run test:ci`)**:
   - Executes [`scripts/verify-deployment.mjs`](file:///scripts/verify-deployment.mjs) against the live SQLite database.
   - Validates relational integrity (`Zone` $\leftrightarrow$ `Staff` $\leftrightarrow$ `Resource`).
   - Simulates audit log creation to guarantee write capabilities.
   - Generates an executive Markdown report directly into `$GITHUB_STEP_SUMMARY`.
5. **Optimized Production Build**:
   - `npm run build`: Compiles all static pages (`/`, `/staff`, `/resources`, `/reports`) and 8 dynamic server API route handlers using Next.js Webpack.

---

## Process: How to Connect & Push to GitHub

### Step 1: Stage and Commit Changes
Verify your local git status and commit all files including the GitHub Actions workflow, seed scripts, and API routes:

```bash
git add .
git commit -m "feat: complete full-stack database integration and GitHub Actions CI/CD"
```

### Step 2: Push to GitHub
Push your commits to your remote repository:

```bash
git push origin master
# or if your default branch is main:
# git push origin main
```

### Step 3: Monitor Workflow in GitHub Actions
1. Navigate to your repository on GitHub: `https://github.com/AvishkarPN/vantage-os`.
2. Click the **Actions** tab at the top.
3. Select the **VantageOS CI / CD Pipeline** workflow.
4. Observe each job step in real time.

---

## Expected CI Output & Summary

When the GitHub Actions pipeline runs, you will see the following step-by-step logs and visual summary:

### Console Output Sample

```text
----------------------------------------------------
   VANTAGE_OS // CI AUTOMATED HEALTH VERIFICATION   
----------------------------------------------------
[CI] Verifying database file at: /home/runner/work/vantage-os/vantage-os/dev.db
[CI] Connecting to database via LibSQL Driver Adapter...
[CI] Users in database:       3
[CI] Venues in database:      1
[CI] Zones in database:       10
[CI] Staff in database:       20
[CI] Resources in database:   12
[CI] Incidents in database:   3
[CI] Audit Logs in database:  12

[CI] Testing Relational Joins (Zone -> Staff & Resources)...
[CI] Main Stage Capacity: 1500, Assigned Staff: 2, Resources: 2

[CI] Simulating Autonomous Audit Log Creation...
[CI] Audit log entry created with ID: cmvovur480000bgiqckr74o7q

====================================================
   ALL CI VERIFICATION CHECKS COMPLETED: SUCCESS    
====================================================

▲ Next.js 16.2.3 (webpack)
  Creating an optimized production build ...
✓ Compiled successfully in 18.2s
  Collecting page data using 4 workers ...
✓ Generating static pages (15/15) in 320ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/audit
├ ƒ /api/incidents
├ ƒ /api/mitigate
├ ƒ /api/reports
├ ƒ /api/resources
├ ƒ /api/staff
├ ƒ /api/system/status
├ ƒ /api/zones
├ ○ /reports
├ ○ /resources
└ ○ /staff
```

### GitHub Actions Step Summary Report

GitHub Actions will automatically render this table on the run overview page:

| Component | Status | Metric / Details |
| :--- | :--- | :--- |
| **Database Engine** | ✅ Connected | SQLite / LibSQL Adapter |
| **Venues** | ✅ Verified | 1 Venue Registered |
| **Tactical Zones** | ✅ Verified | 10 Zones Active |
| **Personnel Roster** | ✅ Verified | 20 Staff Assigned |
| **Equipment Inventory**| ✅ Verified | 12 Tactical Resources |
| **Audit Ledger** | ✅ Verified | 13 Entries Recorded |
| **TypeScript / Build** | ✅ Verified | 0 Type Errors, Webpack Bundle Optimized |

---

## REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/system/status` | `GET` | Health check, real-time database connection status, and aggregate crowd telemetry. |
| `/api/zones` | `GET`, `PATCH`, `POST` | Query all venue zones with relational staff/resources, update metrics, or batch sync simulated telemetry. |
| `/api/staff` | `GET`, `POST`, `PATCH` | Fetch all 20 personnel, assign staff to zones, swap duties, and update shift states. |
| `/api/resources` | `GET`, `POST`, `PATCH` | Query tactical inventory, adjust allocation counts, and update operational readiness. |
| `/api/incidents` | `GET`, `POST`, `PATCH` | Retrieve active incident logs and flag sensory anomalies. |
| `/api/mitigate` | `POST` | **1-Click AI Autonomous Mitigation**: Atomically reroutes crowd flows, rebalances barriers, resolves incidents, accepts recommendations, and commits immutable audit logs. |
| `/api/audit` | `GET`, `POST` | Inspect the forensic audit trail or append operational operator entries. |
| `/api/reports` | `GET` | Aggregated command dossier including full audit logs, incident histories, zone analytics, and export archives. |

---

## Local Development & Setup

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ LTS
- **npm** or **pnpm**

### 2. Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration for zero-config SQLite:
```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV="development"
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed tactical dataset (users, zones, staff, resources, sessions)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the VantageOS Tactical NOC.

### 5. Run CI Verification Locally
To execute the exact verification performed by GitHub Actions:

```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Automated database & telemetry test
npm run test:ci

# Production build test
npm run build
```

---

## Enterprise Migration (PostgreSQL / Cloud)

To switch from SQLite to an enterprise PostgreSQL cluster:
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
2. Update `.env` or GitHub Repository Secrets:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/vantage_db?schema=public"
   ```
3. Run `npm run db:push` and `npm run db:seed`.
4. In GitHub Repository Settings $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**, set `DATABASE_URL` to your production database connection string.
