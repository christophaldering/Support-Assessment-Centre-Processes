# Executive Diagnostics Platform

## Overview

Enterprise-grade, multi-tenant SaaS platform for hosting executive assessment centers. Currently in **Phase 0 — scaffold only**. No business logic implemented yet.

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
/app                → Next.js App Router (pages, layouts, API routes)
  /api/health       → Health check endpoint (Prisma connectivity test)
  layout.tsx        → Root layout with metadata
  page.tsx          → Home page placeholder
  globals.css       → Tailwind + design baseline
/components         → Reusable React components (empty, ready)
/lib                → Shared utilities & modules
  db.ts             → Prisma client singleton
  auth.ts           → Authentication (stub)
  rbac.ts           → Role-based access control (stub)
  consent.ts        → GDPR consent management (stub)
  audit.ts          → Audit logging (stub)
  ai.ts             → AI integration helpers (stub)
/prisma
  schema.prisma     → Prisma schema (HealthCheck placeholder model)
  seed.ts           → Seed script placeholder
```

## System Architecture

- **Framework**: Next.js 14 App Router + TypeScript (strict mode)
- **ORM**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS v3 with custom design tokens
- **Linting**: ESLint (next/core-web-vitals) + Prettier
- **Port**: 5000 (bound to 0.0.0.0)

## Database

- **Provider**: PostgreSQL (via DATABASE_URL env var)
- **Current tables**: `health_check` (scaffold verification only)
- **Schema management**: `npx prisma db push` for development, migrations for production

## Build & Development

- `npm run dev` — Start dev server on port 5000
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint check
- `npm run format` — Prettier format
- `npm run db:push` — Push schema to database
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:seed` — Run seed script

## Design System Baseline

- **Primary**: Dark navy `#0f172a`
- **Accent**: Blue `#3b82f6`
- **Fonts**: Inter (body, sans-serif) + Playfair Display (headings, serif)
- **Backgrounds**: White with subtle slate borders

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable.
