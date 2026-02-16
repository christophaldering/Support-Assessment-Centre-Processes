# Executive Diagnostics Platform

Enterprise-grade, multi-tenant SaaS platform for hosting executive assessment centers.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS with custom design tokens
- **Linting:** ESLint (next/core-web-vitals) + Prettier

## Project Structure

```
/app            → Next.js App Router (pages, layouts, API routes)
/components     → Reusable React components
/lib            → Shared utilities & modules
  auth.ts       → Authentication (stub)
  db.ts         → Prisma client singleton
  rbac.ts       → Role-based access control (stub)
  consent.ts    → GDPR consent management (stub)
  audit.ts      → Audit logging (stub)
  ai.ts         → AI integration helpers (stub)
/prisma         → Prisma schema & seed script
```

## Environment Variables

| Variable       | Required | Description                          |
| -------------- | -------- | ------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string         |

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start dev server (port 5000)
npm run dev
```

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start dev server on port 5000        |
| `npm run build`  | Production build                     |
| `npm run start`  | Start production server              |
| `npm run lint`   | Run ESLint                           |
| `npm run format` | Format code with Prettier            |
| `db:generate`    | Regenerate Prisma client             |
| `db:push`        | Push schema changes to database      |
| `db:studio`      | Open Prisma Studio                   |
| `db:seed`        | Run seed script                      |

## Design System

Neutral platform theme:
- **Primary:** Dark navy `#0f172a`
- **Accent:** Blue `#3b82f6`
- **Fonts:** Inter (body) + Playfair Display (headings)
- **Backgrounds:** White with subtle slate borders
