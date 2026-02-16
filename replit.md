# Executive Diagnostics Platform

## Overview

The Executive Diagnostics Platform is an enterprise-grade, multi-tenant SaaS solution designed to host executive assessment centers. Its primary purpose is to streamline and enhance the process of executive evaluation through advanced diagnostics. Key capabilities include observer ratings, data consolidation, comprehensive consent management, audio processing (transcription and AI-driven summarization), AI-powered insights and recommendations, robust reporting, and detailed analytics. The platform aims to provide a sophisticated, efficient, and compliant environment for executive assessment, supporting organizational development and talent management.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle planned)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: copper/terracotta (hsl(14, 48%, 44%)), Playfair Display + Inter, pure white backgrounds
Default passwords: "Christoph" for all access
Footer credit: "© Christoph Aldering · Private initiative / concept"

## System Architecture

The platform is built on a modern full-stack architecture utilizing Next.js 14 (App Router) with TypeScript for the frontend and API routes. Data persistence is managed with Prisma ORM and PostgreSQL. Styling is handled by Tailwind CSS, allowing for a consistent and customizable design system.

**Key Architectural Decisions:**
- **UI/UX:** A dual-branding approach supports both a neutral platform theme (dark navy, blue accent) and a customizable workspace theme (e.g., aestimamus workspace with copper/terracotta). The platform supports per-workspace theming with live preview capabilities for colors, fonts, and logos.
- **Authentication & Authorization:** Employs HTTP-only cookies for session management (master admin, workspace admin, and user sessions). Password hashing uses bcryptjs. A granular Role-Based Access Control (RBAC) system with six distinct roles (ADMIN, MODERATOR, OBSERVER, PROJECT_ASSISTANT, HR_CLIENT, CANDIDATE) ensures secure access to resources and features based on a role-to-permissions map.
- **Data Processing Pipelines:**
    - **Observer Rating System:** Features an offline-first UI for exercise x competency matrix ratings, with localStorage caching, auto-sync, and conflict resolution.
    - **Consolidation Engine:** Configurable methods (mean, median, trimmed_mean) for score consolidation, including variance calculation and moderator override.
    - **Consent Management:** GDPR-compliant system with versioned templates, granular consent records, and API-level feature gating (`checkConsent()`).
    - **Audio Processing:** A pipeline for uploading audio to object storage, transcribing via OpenAI, and generating structured AI summaries, with configurable retention policies.
- **AI Integration:** An enhanced AI layer integrates OpenAI services (via Replit AI Integrations) for tasks like competency model generation, behavioral anchor creation, recommendations, and autonomous diagnostics. All AI actions are protected by RBAC, consent verification, and full audit logging. Transparency tags are added to all AI-generated responses.
- **Reporting:** Generates comprehensive reports in DOCX, PDF, and PPTX formats, including executive summaries, competency profiles, and AI-generated recommendations. Reports are versioned and stored in object storage.
- **Analytics:** Provides a dashboard with normalized scores, benchmark views, and visual representations of competency averages, with outlier highlighting.
- **Telemetry:** A usage event logging system tracks platform activities, supporting audit trails and platform insights.

## External Dependencies

- **PostgreSQL**: The primary database for all persistent data.
- **Replit Object Storage**: Used for storing uploaded documents, audio recordings, and generated reports. It leverages Google Cloud Storage internally.
- **OpenAI**: Integrated via Replit AI Integrations for advanced AI functionalities such as transcription, summarization, competency model generation, behavioral anchors, recommendations, and autonomous diagnostics.
- **`docx`**: A JavaScript library for generating DOCX format reports.
- **`pdfkit`**: A JavaScript library for generating PDF format reports.
- **`pptxgenjs`**: A JavaScript library for generating PowerPoint (PPTX) format reports.