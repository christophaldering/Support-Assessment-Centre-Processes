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
- **Navigation Flow:** Enterprise Cockpit (global KPIs + project list) → Project Detail (5-step process within a specific assessment) → Individual process sections (requirements, competencies, assessments, etc.). This ensures all work is scoped to a specific project/assessment.
- **Tools & Modules:** A reusable assessment instrument container available per workspace. Includes case studies (e.g., Varexia SE with 6 tabs), exercises, and assessment instruments. Data stored in TypeScript files under `lib/case-studies/`.
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
- **Exercise Library (Enhanced):** Full CRUD for reusable assessment exercises with variant management, file upload (Word/PPT/PDF), AI analysis, and CD adaptation. Exercise types: Interview-Leitfaden, Fallstudie, Fact-Finding-Simulation, Präsentation, Verhaltenssimulation, Psychometrischer Test, Sonstiges. Target levels: SE-Level/Vorstand, Director/Bereichsleitung, Manager, Expert. Upload stores originals in object storage with metadata. Enhanced generation includes multi-step progress visualization, project linking, and basis exercise selection. API: `/api/w/{slug}/exercise-library/`, `/api/w/{slug}/exercise-library/upload`. UI: `/w/{slug}/admin/exercise-library`.
- **Observation Sheet Templates (Toolbox):** Reusable observation sheet templates with upload (Word/PPT/PDF), manual creation (types: Verhaltensanker-Bogen, Kompetenzmatrix, Freitext-Bogen, Kombinierter Bogen), search/filter, CD adaptation placeholder. Stored in object storage with original file preservation. API: `/api/w/{slug}/observation-sheet-templates/`, `/api/w/{slug}/observation-sheet-templates/upload`. UI: `/w/{slug}/admin/observation-sheets`.
- **Brand Rule Sets (Phase 1):** Manual entry of corporate identity rules (colors, typography, tone, document/slide rules) with activate/archive lifecycle and apply-to-theme action. API: `/api/w/{slug}/brand-rules/`. UI: `/w/{slug}/admin/brand-rules`.
- **Exercise Matching (Phase 1):** Scoring algorithm (type 40pts, level 20pts, tag overlap 30pts, language 10pts) classifying library exercises into use_as_is (>=70), adapt (40-69), create_new (gaps). Integrated into requirements analysis page with "Übungen finden" button. API: `/api/w/{slug}/exercise-matching/`.
- **Style Guide AI Parsing (Phase 2):** Upload PDF/DOCX style guides via `/api/w/{slug}/brand-rules/parse-styleguide`, AI extracts structured brand rules (colors, typography, tone, document/slide rules) into a new BrandRuleSet. UI: KI-Analyse tab on Brand & Style page with drag-and-drop upload and results preview.
- **AI-Enhanced Exercise Matching (Phase 2):** `?enhance=true` query param on exercise matching API triggers OpenAI analysis for contextual fit rationale, specific adaptation suggestions, and detailed new exercise specs. UI: KI-Analyse toggle on requirements page.
- **CD-Adapted Variant Generation (Phase 2):** `/api/w/{slug}/exercise-library/{id}/generate-variant` uses active brand rules + OpenAI to generate CD-adapted exercise variants (variantType: cd_adapted). UI: "CD-Variante erstellen" button on exercise cards and matching recommendations.
- **Advanced Intelligence Layer (Priority 1):** Three AI-powered diagnostic modules under `/api/w/{slug}/intelligence/`:
    - **Predictive Success Intelligence:** Risk indicators (execution, stakeholder, resilience, governance, transformation) + scenario simulations (crisis, growth, conflict, transformation). Entity: PredictiveProfile. RBAC: advanced_intelligence.generate.
    - **Development Path Generator:** 90-day focus areas, 6-month growth targets, 12-month positioning goals, coaching questions, interventions, risk mitigation. Entity: DevelopmentBlueprint.
    - **Diagnostic Hypothesis Engine:** Evidence-linked hypotheses with alternative interpretations, supporting/counter evidence, validation steps. Entity: DiagnosticHypothesis.
    - All outputs are confidence-scored, evidence-coverage-tracked, AI-labeled, and audit-logged. UI: `/w/{slug}/admin/intelligence` with 3 tabs.
    - Permissions: ADMIN (full), MODERATOR (view+generate), HR_CLIENT (view only), OBSERVER/CANDIDATE (none).

## External Dependencies

- **PostgreSQL**: The primary database for all persistent data.
- **Replit Object Storage**: Used for storing uploaded documents, audio recordings, and generated reports. It leverages Google Cloud Storage internally.
- **OpenAI**: Integrated via Replit AI Integrations for advanced AI functionalities such as transcription, summarization, competency model generation, behavioral anchors, recommendations, and autonomous diagnostics.
- **`docx`**: A JavaScript library for generating DOCX format reports.
- **`pdfkit`**: A JavaScript library for generating PDF format reports.
- **`pptxgenjs`**: A JavaScript library for generating PowerPoint (PPTX) format reports.