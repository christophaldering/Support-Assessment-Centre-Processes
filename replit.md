# Executive Diagnostics Platform

## Overview

The Executive Diagnostics Platform is an enterprise-grade, multi-tenant SaaS solution designed to host executive assessment centers. Its primary purpose is to streamline and enhance executive evaluation through advanced diagnostics, supporting organizational development and talent management. Key capabilities include observer ratings, data consolidation, comprehensive consent management, audio processing (transcription and AI-driven summarization), AI-powered insights and recommendations, robust reporting, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle planned)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: copper/terracotta (hsl(14, 48%, 44%)), Playfair Display + Inter, pure white backgrounds
Default passwords: "Christoph" for all access
Footer credit: "© Christoph Aldering · Private initiative / concept"

## System Architecture

The platform is built on a modern full-stack architecture using Next.js 14 (App Router) with TypeScript, Prisma ORM, PostgreSQL, and Tailwind CSS.

**Key Architectural Decisions:**

*   **UI/UX:** Features a multi-step candidate portal and an enterprise cockpit with detailed project views. It supports per-workspace dual-branding and theming with live preview.
*   **Authentication & Authorization:** Employs HTTP-only cookies and a granular Role-Based Access Control (RBAC) system with six distinct roles (ADMIN, MODERATOR, OBSERVER, PROJECT_ASSISTANT, HR_CLIENT, CANDIDATE) for secure access.
*   **Data Processing Pipelines:**
    *   **Observer Rating System:** Offline-first UI with localStorage caching, auto-sync, and conflict resolution.
    *   **Consolidation Engine:** Configurable methods (mean, median, trimmed_mean) for score consolidation.
    *   **Consent Management:** GDPR-compliant system with versioned templates and granular consent records.
    *   **Audio Processing:** Pipeline for uploading, transcribing (via OpenAI), and generating structured AI summaries.
*   **AI Integration:** Leverages OpenAI for competency model generation, behavioral anchor creation, recommendations, and autonomous diagnostics, with RBAC protection, consent verification, and audit logging.
*   **Reporting & Analytics:** Generates comprehensive reports in DOCX, PDF, and PPTX formats, and provides an analytics dashboard with normalized scores and benchmark views.
*   **Module & Content Builders:**
    *   **Baustein-Builder Hub:** Allows manual, library-based, or AI-generated creation of assessment modules (exercises).
    *   **Case Study Builder:** Supports uploading documents for AI-driven structuring or AI-generated case studies based on specified parameters.
    *   **Exercise Library:** Provides CRUD operations for reusable exercises, including AI-powered content analysis for automatic categorization and suggestions.
    *   **Observation Sheet Templates:** Builder module for creating observation sheets, supporting both AI analysis of uploaded documents and AI generation based on user inputs.
*   **Advanced Intelligence Layer:** Includes three AI-powered diagnostic modules: Predictive Success Intelligence, Development Path Generator, and Diagnostic Hypothesis Engine, all with confidence scoring, evidence tracking, and audit logging.
*   **Collaboration:** Features a real-time (polling-based) collaboration system for observers and assessors with live presence indicators, activity feeds, and shared notes.
*   **Versioning & Locking:** MTMM matrices are versioned, with automatic locking upon rating submission to prevent modifications.
*   **Theming & Branding:** Provides a brand rule set management system for defining and applying corporate identity rules, with future plans for AI parsing of style guides.
*   **Exercise Matching:** Implements a scoring algorithm to match library exercises to requirements, with planned AI enhancement for contextual fit and adaptation suggestions.

## External Dependencies

*   **PostgreSQL**: Primary database.
*   **Replit Object Storage**: Used for documents, audio, and generated reports (leveraging Google Cloud Storage).
*   **OpenAI**: Integrated via Replit AI Integrations for advanced AI functionalities (transcription, summarization, generation).
*   **`docx`**: JavaScript library for DOCX report generation.
*   **`pdfkit`**: JavaScript library for PDF report generation.
*   **`pptxgenjs`**: JavaScript library for PPTX report generation.