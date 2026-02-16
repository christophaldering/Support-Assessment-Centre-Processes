# Executive Diagnostics Platform

## Overview

Enterprise-grade, multi-tenant SaaS platform for hosting executive assessment centers. Currently in **Phase 1 — Landing + Admin Gate + Workspace Selector**.

Tech stack: Next.js 14 (App Router) + TypeScript (strict) + Prisma + PostgreSQL + Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle planned)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: copper/terracotta (hsl(14, 48%, 44%)), Playfair Display + Inter, pure white backgrounds
Default passwords: "Christoph" for all access
Footer credit: "© Christoph Aldering · Private initiative / concept"

## Project Structure

```
/app                          → Next.js App Router
  page.tsx                    → Neutral landing page with feature overview
  layout.tsx                  → Root layout with metadata
  globals.css                 → Tailwind + design baseline + Google Fonts
  /admin/login/page.tsx       → Master admin password gate
  /admin/workspaces/page.tsx  → Workspace selector (loads from DB)
  /w/[workspaceSlug]/admin/page.tsx → Workspace admin dashboard (themed)
  /api/health/route.ts        → Health check endpoint
  /api/auth/master/route.ts   → Master admin password verification
  /api/auth/workspace/route.ts → Workspace admin password verification
  /api/workspaces/route.ts    → List workspaces (master-auth protected)
/components                   → Reusable React components (empty, ready)
/lib                          → Shared utilities & modules
  db.ts                       → Prisma client singleton
  session.ts                  → Cookie-based auth helpers (master + workspace)
  auth.ts                     → Authentication (stub)
  rbac.ts                     → Role-based access control (stub)
  consent.ts                  → GDPR consent management (stub)
  audit.ts                    → Audit logging (stub)
  ai.ts                       → AI integration helpers (stub)
/prisma
  schema.prisma               → Prisma schema (Workspace, Theme, HealthCheck)
  seed.ts                     → Seeds aestimamus workspace with copper theme
```

## Access Control Flow

1. **Landing page** (`/`) — Neutral platform landing, "Administrator Access" button
2. **Master admin gate** (`/admin/login`) — Single password (env var `MASTER_ADMIN_PASSWORD_HASH`, bcrypt)
3. **Workspace selector** (`/admin/workspaces`) — Lists workspaces from DB, protected by master auth cookie
4. **Workspace admin password** — Per-workspace password (bcrypt hash stored on Workspace model)
5. **Workspace dashboard** (`/w/{slug}/admin`) — Themed admin dashboard with workspace colors

All passwords: "Christoph"

## System Architecture

- **Framework**: Next.js 14 App Router + TypeScript (strict mode)
- **ORM**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS v3 with custom design tokens
- **Auth**: HTTP-only cookies (`edp_master_auth`, `edp_workspace_auth`) with 4-hour expiry
- **Password hashing**: bcryptjs
- **Linting**: ESLint (next/core-web-vitals) + Prettier
- **Port**: 5000 (bound to 0.0.0.0)

## Database

- **Provider**: PostgreSQL (via DATABASE_URL env var)
- **Tables**: `health_check`, `workspaces`, `themes`
- **Seeded data**: aestimamus workspace with copper theme
- **Schema management**: `npx prisma db push` for development

## Environment Variables

| Variable                      | Description                              |
| ----------------------------- | ---------------------------------------- |
| `DATABASE_URL`                | PostgreSQL connection string (required)  |
| `MASTER_ADMIN_PASSWORD_HASH`  | bcrypt hash of master admin password     |

## Build & Development

- `npm run dev` — Start dev server on port 5000
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint check
- `npm run format` — Prettier format
- `npm run db:push` — Push schema to database
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:seed` — Run seed script (creates aestimamus workspace)

## Design System Baseline

- **Primary**: Dark navy `#0f172a`
- **Accent**: Blue `#3b82f6`
- **Fonts**: Inter (body, sans-serif) + Playfair Display (headings, serif)
- **Backgrounds**: White with subtle slate borders
- **Workspace theming**: Per-workspace colors applied via inline styles on `/w/{slug}/admin`

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable.
